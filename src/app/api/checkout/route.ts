import { NextResponse } from 'next/server'
import { createOrder, updateOrderStatus } from '@/lib/supabase/queries'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createCheckoutForm } from '@/lib/iyzico/client'
import type { CartItem } from '@/types'

interface CheckoutRequestBody {
  items: CartItem[]
  currency: 'TRY' | 'USD'
  locale: 'tr' | 'en'
  guestEmail?: string
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

const VAT_RATE = 0.2

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

    // Kuruş/cent dönüşüm fonksiyonu
    const toMinorUnit = (amount: number) => Math.round(amount * 100)

    // 1. Her bir kalemin KDV dahil toplam fiyatlarını tek tek minor birimde hesaplayalım
    // Böylece iyzico basketItems toplamı ile totalMinor kuruşu kuruşuna eşit olur.
    let totalCalculatedMinor = 0
    const iyzicoBasketItems = items.map((item) => {
      const unitPrice = currency === 'TRY' ? item.priceTRY : item.priceUSD
      const rawSubtotalItemMinor = toMinorUnit(unitPrice) * item.quantity
      const vatItemMinor = Math.round(rawSubtotalItemMinor * VAT_RATE)
      const totalItemWithVatMinor = rawSubtotalItemMinor + vatItemMinor
      
      totalCalculatedMinor += totalItemWithVatMinor

      return {
        id: item.id,
        name: item.name[locale] || item.name['tr'] || 'Ürün',
        category1: item.type === 'custom' ? 'Custom Registry' : 'Object Registry',
        itemType: 'PHYSICAL' as const,
        // iyzico'ya bu kalemin KDV dahil TOPLAM tutarını string formatta iletiyoruz
        price: (totalItemWithVatMinor / 100).toFixed(2),
      }
    })

    const shippingMinor = 0 // şimdilik ücretsiz kargo
    const totalMinor = totalCalculatedMinor + shippingMinor

    // Supabase kırılımları için geriye dönük hesaplama (Opsiyonel/Uyumlu)
    const subtotalMinor = items.reduce((sum, item) => {
      const unitPrice = currency === 'TRY' ? item.priceTRY : item.priceUSD
      return sum + toMinorUnit(unitPrice) * item.quantity
    }, 0)
    const vatMinor = totalCalculatedMinor - subtotalMinor

    // Supabase siparişi oluştur
    const order = await createOrder({
      userId,
      guestEmail: userId ? null : guestEmail,
      currency,
      subtotal: subtotalMinor,
      vatAmount: vatMinor,
      shippingAmount: shippingMinor,
      totalAmount: totalMinor,
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

    // iyzico Checkout Form hazırlığı
    const totalPriceDecimal = (totalMinor / 100).toFixed(2)

    const [nameSplit, ...surnameParts] = shippingInfo.name.trim().split(' ')
    const surname = surnameParts.join(' ') || nameSplit

    try {
      const iyzicoResult = await createCheckoutForm({
        locale,
        conversationId: order.order_number,
        price: totalPriceDecimal,
        paidPrice: totalPriceDecimal, // Kampanya/İndirim yoksa price ile birebir eşit olmalı
        currency,
        basketId: order.order_number,
        paymentGroup: 'PRODUCT',
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/checkout/callback?locale=${locale}`,
        enabledInstallments: currency === 'TRY' ? [1, 2, 3, 6, 9, 12] : [1],
        buyer: {
          id: userId ?? `guest-${order.order_number}`,
          name: nameSplit,
          surname,
          gsmNumber: shippingInfo.phone.startsWith('+') ? shippingInfo.phone : `+90${shippingInfo.phone.replace(/\s+/g, '')}`,
          email: userEmail ?? '',
          identityNumber: '11111111111',
          lastLoginDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
          registrationDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
          registrationAddress: shippingInfo.address1,
          ip: request.headers.get('x-forwarded-for') ?? '85.34.78.112',
          city: shippingInfo.city,
          country: shippingInfo.country ?? 'Turkey',
          zipCode: shippingInfo.postal,
        },
        shippingAddress: {
          contactName: shippingInfo.name,
          city: shippingInfo.city,
          country: shippingInfo.country ?? 'Turkey',
          address: shippingInfo.address1,
          zipCode: shippingInfo.postal,
        },
        billingAddress: {
          contactName: shippingInfo.name,
          city: shippingInfo.city,
          country: shippingInfo.country ?? 'Turkey',
          address: shippingInfo.address1,
          zipCode: shippingInfo.postal,
        },
        basketItems: iyzicoBasketItems,
      })

      if (iyzicoResult.status !== 'success') {
        console.error('[iyzico API Hatası]:', iyzicoResult.errorMessage)
        await updateOrderStatus(order.id, 'cancelled')
        return NextResponse.json(
          { error: iyzicoResult.errorMessage ?? 'Ödeme başlatılamadı.' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        {
          order,
          checkoutFormContent: iyzicoResult.checkoutFormContent,
          paymentPageUrl: iyzicoResult.paymentPageUrl,
          token: iyzicoResult.token,
        },
        { status: 201 }
      )
    } catch (iyzicoError) {
      console.error('[checkout API] iyzico hatası:', iyzicoError)
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