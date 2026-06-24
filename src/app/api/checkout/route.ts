import { NextResponse } from 'next/server'
import { createOrder } from '@/lib/supabase/queries'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { CartItem } from '@/types'

interface CheckoutRequestBody {
  items: CartItem[]
  currency: 'TRY' | 'USD'
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

// KDV oranı — Türkiye standart oranı. İleride ülkeye göre değişebilir.
const VAT_RATE = 0.2

export async function POST(request: Request) {
  try {
    const body: CheckoutRequestBody = await request.json()
    const { items, currency, guestEmail, shippingInfo } = body

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

    const vatMinor = Math.round(subtotalMinor * VAT_RATE)
    const shippingMinor = 0 // şimdilik ücretsiz kargo — ileride kurala bağlanabilir
    const totalMinor = subtotalMinor + vatMinor + shippingMinor

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

    return NextResponse.json({ order }, { status: 201 })
  } catch (error) {
    console.error('[checkout API] Sipariş oluşturma hatası:', error)
    return NextResponse.json(
      { error: 'Sipariş oluşturulamadı. Lütfen tekrar deneyin.' },
      { status: 500 }
    )
  }
}
