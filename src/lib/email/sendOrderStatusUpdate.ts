import { Resend } from 'resend'
import OrderStatusUpdateEmail from '@/emails/OrderStatusUpdateEmail'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendOrderStatusEmailParams {
  to: string
  orderNumber: string
  customerName: string
  currency: 'TRY' | 'USD'
  trackingNumber?: string | null
}

// Dil, siparişin ÖDENDİĞİ para birimine göre belirlenir:
// USD ile ödenmişse İngilizce, TRY ile ödenmişse Türkçe. Bu, checkout
// sırasında seçilen site diliyle (order.locale) KASITLI olarak farklı bir
// sinyal — istenen davranış bu şekilde.
function localeFromCurrency(currency: 'TRY' | 'USD'): 'tr' | 'en' {
  return currency === 'USD' ? 'en' : 'tr'
}

export async function sendOrderProcessingEmail(params: SendOrderStatusEmailParams) {
  const locale = localeFromCurrency(params.currency)
  const subject =
    locale === 'tr'
      ? `Siparişiniz Hazırlanıyor — ${params.orderNumber}`
      : `Your Order Is Being Prepared — ${params.orderNumber}`

  try {
    return await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'noreply@ambiencebureau.com',
      to: params.to,
      subject,
      react: OrderStatusUpdateEmail({
        locale,
        orderNumber: params.orderNumber,
        customerName: params.customerName,
        status: 'processing',
      }),
    })
  } catch (error) {
    // E-posta gönderimi başarısız olsa bile sipariş akışı durmamalı.
    console.error('[sendOrderProcessingEmail] Hata:', error)
    return null
  }
}

export async function sendOrderShippedEmail(params: SendOrderStatusEmailParams) {
  const locale = localeFromCurrency(params.currency)
  const subject =
    locale === 'tr'
      ? `Siparişiniz Kargoya Verildi — ${params.orderNumber}`
      : `Your Order Has Shipped — ${params.orderNumber}`

  try {
    return await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'noreply@ambiencebureau.com',
      to: params.to,
      subject,
      react: OrderStatusUpdateEmail({
        locale,
        orderNumber: params.orderNumber,
        customerName: params.customerName,
        status: 'shipped',
        trackingNumber: params.trackingNumber,
      }),
    })
  } catch (error) {
    console.error('[sendOrderShippedEmail] Hata:', error)
    return null
  }
}
