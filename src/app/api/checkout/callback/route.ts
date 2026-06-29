import { NextResponse } from 'next/server'
import { retrieveCheckoutForm } from '@/lib/iyzico/client'
import { updateOrderStatus, getOrderByNumber, resolveOrderRecipientEmail } from '@/lib/supabase/queries'
import { sendOrderConfirmationEmail, sendAdminOrderNotification } from '@/lib/email/sendOrderConfirmation'

/**
 * iyzico, Checkout Form ödemesi tamamlandığında bu URL'e POST yapar.
 */
export async function POST(request: Request) {
  try {
    const url = new URL(request.url)
    const locale = (url.searchParams.get('locale') ?? 'tr') as 'tr' | 'en'

    const formData = await request.formData()
    const token = formData.get('token') as string | null

    if (!token) {
      console.error('[iyzico callback] Token bulunamadı')
      return redirectToResult(locale, 'error', 'missing_token')
    }

    // iyzico'dan gerçek ödeme sonucunu sorgula
    // "conversationId: ''" imza hatasına yol açtığı için parametrelerden kaldırıldı.
    const result = await retrieveCheckoutForm({
      locale: 'tr',
      token,
    })

    if (result.status !== 'success' || !result.basketId) {
      console.error('[iyzico callback] iyzico sorgusu başarısız veya basketId yok:', result.errorMessage)
      return redirectToResult(locale, 'error', 'retrieve_failed')
    }

    // basketId = bizim order_number'ımız
    const orderNumber = result.basketId
    const order = (await getOrderByNumber(orderNumber)) as any

    if (!order) {
      console.error('[iyzico callback] Sipariş veritabanında bulunamadı:', orderNumber)
      return redirectToResult(locale, 'error', 'order_not_found')
    }

    if (result.paymentStatus === 'SUCCESS') {
      await updateOrderStatus(order.id, 'processing', {
        iyzicoPaymentId: result.paymentId,
        iyzicoToken: token,
        paidAt: new Date().toISOString(),
      })

      // E-posta gönderimi — başarısız olsa da ödeme akışını bloklamaz.
      // Hem üye hem misafir siparişler için doğru e-posta adresini çözümler.
      try {
        const recipientEmail = await resolveOrderRecipientEmail(order)

        if (recipientEmail) {
          const currency = (order.currency ?? 'TRY') as 'TRY' | 'USD'
          const orderItems = (order.order_items ?? []).map((item: any) => ({
            name: item.product_name,
            quantity: item.quantity,
            unitPriceMinor: item.unit_price,
          }))

          const emailParams = {
            locale,
            to: recipientEmail,
            orderNumber: order.order_number,
            customerName: order.shipping_name ?? '',
            currency,
            items: orderItems,
            subtotalMinor: order.subtotal,
            totalMinor: order.total_amount,
            shippingAddress: {
              name: order.shipping_name ?? '',
              address1: order.shipping_address1 ?? '',
              address2: order.shipping_address2 ?? undefined,
              city: order.shipping_city ?? '',
              postal: order.shipping_postal ?? '',
              country: order.shipping_country ?? 'TR',
            },
          }

          await sendOrderConfirmationEmail(emailParams)
          await sendAdminOrderNotification(emailParams)
        } else {
          console.error('[iyzico callback] Sipariş için e-posta adresi çözümlenemedi:', orderNumber)
        }
      } catch (emailError) {
        console.error('[iyzico callback] E-posta gönderim hatası:', emailError)
      }

      return redirectToResult(locale, 'success', orderNumber)
    }

    // Ödeme başarısız — siparişi iptal olarak işaretle
    await updateOrderStatus(order.id, 'cancelled', { iyzicoToken: token })
    return redirectToResult(locale, 'error', 'payment_failed', orderNumber)
  } catch (error) {
    console.error('[iyzico callback] Beklenmedik Hata:', error)
    return redirectToResult('tr', 'error', 'unexpected')
  }
}

function redirectToResult(
  locale: 'tr' | 'en',
  status: 'success' | 'error',
  reasonOrOrderNumber: string,
  orderNumber?: string
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  if (status === 'success') {
    return NextResponse.redirect(
      `${baseUrl}/${locale}/checkout/confirmation?order=${reasonOrOrderNumber}&status=success`
    )
  }

  const params = new URLSearchParams({ status: 'error', reason: reasonOrOrderNumber })
  if (orderNumber) params.set('order', orderNumber)

  return NextResponse.redirect(`${baseUrl}/${locale}/checkout/confirmation?${params.toString()}`)
}