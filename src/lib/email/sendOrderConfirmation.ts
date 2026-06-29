import { Resend } from 'resend'
import OrderConfirmationEmail from '@/emails/OrderConfirmationEmail'
import { formatPrice } from '@/lib/sanity'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendOrderConfirmationParams {
  locale: 'tr' | 'en'
  to: string
  orderNumber: string
  customerName: string
  currency: 'TRY' | 'USD'
  items: Array<{
    name: string
    quantity: number
    unitPriceMinor: number // kuruş/cent
  }>
  subtotalMinor: number // kuruş/cent — KDV dahil, kargo hariç
  totalMinor: number // kuruş/cent — kargo dahil nihai toplam
  shippingAddress: {
    name: string
    address1: string
    address2?: string
    city: string
    postal: string
    country: string
  }
}

export async function sendOrderConfirmationEmail(params: SendOrderConfirmationParams) {
  const intlLocale = params.locale === 'tr' ? 'tr-TR' : 'en-US'
  const fmt = (minor: number) => formatPrice(minor / 100, params.currency, intlLocale)

  const items = params.items.map((item) => ({
    name: item.name,
    quantity: item.quantity,
    unitPrice: fmt(item.unitPriceMinor),
    lineTotal: fmt(item.unitPriceMinor * item.quantity),
  }))

  const subject =
    params.locale === 'tr'
      ? `Kayıt Onayı — ${params.orderNumber}`
      : `Registration Confirmed — ${params.orderNumber}`

  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'noreply@ambiencebureau.com',
      to: params.to,
      subject,
      react: OrderConfirmationEmail({
        locale: params.locale,
        orderNumber: params.orderNumber,
        customerName: params.customerName,
        items,
        subtotal: fmt(params.subtotalMinor),
        total: fmt(params.totalMinor),
        shippingAddress: params.shippingAddress,
      }),
    })

    return result
  } catch (error) {
    // E-posta gönderimi başarısız olsa bile sipariş/ödeme akışı durmamalı —
    // hatayı logluyoruz ama fırlatmıyoruz (çağıran kod akışı sürdürebilsin).
    console.error('[sendOrderConfirmationEmail] Hata:', error)
    return null
  }
}

export async function sendAdminOrderNotification(params: SendOrderConfirmationParams) {
  const adminEmail = process.env.RESEND_ADMIN_EMAIL
  if (!adminEmail) return null

  const intlLocale = 'tr-TR'
  const fmt = (minor: number) => formatPrice(minor / 100, params.currency, intlLocale)

  try {
    return await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'noreply@ambiencebureau.com',
      to: adminEmail,
      subject: `[Yeni Sipariş] ${params.orderNumber} — ${fmt(params.totalMinor)}`,
      react: OrderConfirmationEmail({
        locale: 'tr',
        orderNumber: params.orderNumber,
        customerName: params.customerName,
        items: params.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: fmt(item.unitPriceMinor),
          lineTotal: fmt(item.unitPriceMinor * item.quantity),
        })),
        subtotal: fmt(params.subtotalMinor),
        total: fmt(params.totalMinor),
        shippingAddress: params.shippingAddress,
      }),
    })
  } catch (error) {
    console.error('[sendAdminOrderNotification] Hata:', error)
    return null
  }
}
