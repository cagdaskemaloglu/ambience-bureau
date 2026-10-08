import { NextResponse } from 'next/server'
import { createOrder, updateOrderStatus } from '@/lib/supabase/queries'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createPaymentToken, toPaytrOid } from '@/lib/paytr/client'
import type { CartItem } from '@/types'
import { createSupabaseAdminClient } from '@/lib/supabase/server'
import { checkCustomDesignCapacity } from '@/lib/sanity-fulfillment'

interface CheckoutRequestBody {
  items: CartItem[]
  currency: 'TRY' | 'USD'
  locale: 'tr' | 'en'
  guestEmail?: string
  useCredits?: string
  shippingInfo: {
    name: string
    phone: string
    address1: string
    address2?: string
    city: string
    postal: string
    country?: string
  }
}

// NOT: Sanity'de girilen ürün fiyatları (priceTRY/priceUSD) ZATEN KDV DAHİLDİR.
// Bu yüzden burada KDV'yi AYRICA hesaplayıp toplama eklemiyoruz — öyle yapmak
// hem müşteriye çift KDV gösterir hem de iyzico'ya gönderilen price/paidPrice
// ile basketItems toplamı arasında tutarsızlık yaratıp "geçersiz imza" hatasına
// yol açar (iyzico, basket item toplamının price alanıyla eşleşmesini zorunlu kılar).

export async function POST(request: Request) {
  try {
    const body: CheckoutRequestBody = await request.json()
    const { items, currency, locale, guestEmail, shippingInfo } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Sepet boş.' }, { status: 400 })
    }

    if (!shippingInfo?.name || !shippingInfo?.address1 || !shippingInfo?.city) {
      return NextResponse.json(
        { error: 'Teslimat bilgileri eksik.' },
        { status: 400 }
      )
    }

    // Stok kontrolü — SADECE Custom Registry (type: 'custom') kalemleri için.
    // Bağlı olduğu Drop'un "Planlanan Satış Adedi"ni doldurmuş sepet
    // kalemleri varsa, sipariş burada (ödeme adımına hiç gitmeden) reddedilir.
    // Konfigüratör ekranı kendisi kapanmaz — sadece bu checkout adımında
    // engellenir (bkz. sanity-fulfillment.ts).
    for (const item of items) {
      if (item.type === 'custom' && item.customDesign?.collectionKey) {
        const capacity = await checkCustomDesignCapacity(item.customDesign.collectionKey)
        if (!capacity.ok) {
          return NextResponse.json({ error: capacity.reason }, { status: 409 })
        }
      }
    }

    // Üye kullanıcı kontrolü
    const supabase = await createSupabaseServerClient()
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData?.user?.id ?? null
    const userEmail = userData?.user?.email ?? guestEmail

    // Misafir checkout için email zorunlu
    if (!userId && !guestEmail) {
      return NextResponse.json(
        { error: 'Misafir siparişi için e-posta adresi zorunludur.' },
        { status: 400 }
      )
    }

    // Fiyatları en küçük para birimine çevir (kuruş/cent) — ondalık hata riskini önler
    const toMinorUnit = (amount: number) => Math.round(amount * 100)

    const subtotalMinor = items.reduce((sum, item) => {
      const unitPrice = currency === 'TRY' ? item.priceTRY : item.priceUSD
      return sum + toMinorUnit(unitPrice) * item.quantity
    }, 0)

    const vatMinor = 0 // KDV, ürün fiyatına zaten dahil — burada ayrıca eklenmiyor
    const shippingMinor = 0 // şimdilik ücretsiz kargo — ileride kurala bağlanabilir

    // Bureau Credits kullanımı
    const useCreditsParam = parseFloat(body.useCredits ?? '0')
    let creditsUsedMinor = 0
    if (userId && useCreditsParam > 0) {
      const admin = createSupabaseAdminClient()
      const { data: profile } = await (admin as any)
        .from('profiles')
        .select('bureau_credits_try, bureau_credits_usd')
        .eq('id', userId)
        .single()
      // Siparişin para birimine göre doğru kredi kolonu
      const available = currency === 'TRY'
        ? Number(profile?.bureau_credits_try ?? 0)
        : Number(profile?.bureau_credits_usd ?? 0)
      const subtotalFull = subtotalMinor / 100
      const maxUsable = Math.min(available, subtotalFull)
      const actualUse = Math.min(useCreditsParam, maxUsable)
      creditsUsedMinor = Math.round(actualUse * 100)
    }

    const totalMinor = Math.max(0, subtotalMinor + shippingMinor - creditsUsedMinor)

    // 1. Siparişi Supabase'de 'pending' olarak oluştur
    const order = await createOrder({
      userId,
      guestEmail: userId ? null : guestEmail,
      currency,
      subtotal: subtotalMinor,
      vatAmount: vatMinor,
      shippingAmount: shippingMinor,
      totalAmount: totalMinor,
      bureauCreditsUsed: creditsUsedMinor / 100,
      locale,
      shippingInfo,
      items: items.map((item) => ({
        itemType: item.type,
        sanityProductId: item.type === 'product' ? item.id : undefined,
        registryNo: item.registryNo,
        productName: item.name[currency === 'TRY' ? 'tr' : 'en'],
        unitPrice: toMinorUnit(currency === 'TRY' ? item.priceTRY : item.priceUSD),
        quantity: item.quantity,
        customDesignId: item.type === 'custom' ? item.id.replace('custom-', '') : undefined,
      })),
    })

    // 2. PayTR ödeme token'ını oluştur
    // NOT: PayTR'nin para birimi kısaltması "TL" — ISO kodu "TRY" DEĞİL.
    const paytrCurrency = currency === 'TRY' ? 'TL' : 'USD'

    // PayTR basket formatı [isim, birim_fiyat, adet] — iyzico'dan farklı
    // olarak quantity AYRI bir alan, fiyatı adetle çarpıp tek satıra
    // sıkıştırmaya gerek yok.
    const basket: Array<{ name: string; price: string; quantity: number }> = items.map((item) => ({
      name: item.name[locale],
      price: (toMinorUnit(currency === 'TRY' ? item.priceTRY : item.priceUSD) / 100).toFixed(2),
      quantity: item.quantity,
    }))

    // payment_amount = GERÇEK tahsil edilecek tutar (kredi indirimi sonrası
    // olabilir) — sepet toplamından farklı olabilir, PayTR iyzico kadar
    // katı bir eşleşme aramıyor (sepet daha çok fatura/makbuz amaçlı).
    const [nameSplit, ...surnameParts] = shippingInfo.name.trim().split(' ')
    const fullName = surnameParts.length > 0 ? shippingInfo.name.trim() : nameSplit

    // Site adresi: önce NEXT_PUBLIC_APP_URL, yoksa NEXT_PUBLIC_SITE_URL,
    // o da yoksa isteğin geldiği adres (localhost'ta da Vercel'de de doğru
    // çalışır). ESKİSİ fallback'siz `undefined/tr/...` üretip PayTR'nin
    // "merchant_ok_url geçersiz" hatasına yol açıyordu.
    const baseUrl = (
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      new URL(request.url).origin
    )
      .trim()
      .replace(/\/+$/, '')
    const localePrefix = `${baseUrl}/${locale}`

    // x-forwarded-for Vercel'de "istemci, proxy1, proxy2" gibi birden fazla
    // IP içerebilir — PayTR TEK bir IP bekliyor, ilkini alıyoruz.
    const userIp = (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || '85.34.78.112'

    try {
      const paytrResult = await createPaymentToken({
        // PayTR merchant_oid'de tire kabul etmiyor: TAB-2026-AB12C → TAB2026AB12C
        merchantOid: toPaytrOid(order.order_number),
        userIp,
        email: userEmail ?? guestEmail ?? '',
        paymentAmountMinor: totalMinor,
        basket,
        userName: fullName,
        userAddress: `${shippingInfo.address1}${shippingInfo.address2 ? ', ' + shippingInfo.address2 : ''}, ${shippingInfo.city}`,
        userPhone: (() => {
          const raw = shippingInfo.phone.replace(/\s+/g, '').replace(/-/g, '')
          if (raw.startsWith('+')) return raw
          if (raw.startsWith('00')) return '+' + raw.slice(2)
          if (raw.startsWith('0')) return '+90' + raw.slice(1)
          return '+90' + raw
        })(),
        // Bu URL'leri BİZ belirliyoruz, PayTR dinamik parametre eklemiyor —
        // bu yüzden sipariş numarasını kendimiz gömüyoruz (onay sayfası
        // bunu okuyor, bkz. ConfirmationContent.tsx). Asıl sipariş onayı
        // (DB güncelleme, e-posta, Sanity kaydı) BURADA DEĞİL,
        // /api/checkout/paytr-notify'da olur — bu sadece tarayıcı yönlendirmesi.
        merchantOkUrl: `${localePrefix}/checkout/confirmation?order=${order.order_number}&status=success`,
        merchantFailUrl: `${localePrefix}/checkout/confirmation?order=${order.order_number}&status=error&reason=payment_failed`,
        currency: paytrCurrency,
        lang: locale,
      })

      if (paytrResult.status !== 'success') {
        console.error('[PayTR] FULL RESPONSE:', JSON.stringify(paytrResult, null, 2))
        await updateOrderStatus(order.id, 'cancelled')
        return NextResponse.json(
          { error: paytrResult.reason ?? 'Ödeme başlatılamadı.' },
          { status: 400 }
        )
      }

      return NextResponse.json({ order, token: paytrResult.token }, { status: 201 })
    } catch (paytrError) {
      // PayTR hatası — siparişi iptal et, kullanıcıya bildir
      console.error('[checkout API] PayTR hatası:', paytrError)
      await updateOrderStatus(order.id, 'cancelled')
      return NextResponse.json(
        { error: 'Ödeme sistemine bağlanılamadı. Lütfen tekrar deneyin.' },
        { status: 502 }
      )
    }
  } catch (error) {
    console.error('[checkout API] Sipariş oluşturma hatası:', error)
    return NextResponse.json(
      { error: 'Sipariş oluşturulamadı. Lütfen tekrar deneyin.' },
      { status: 500 }
    )
  }
}