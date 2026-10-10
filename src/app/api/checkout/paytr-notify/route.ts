import { verifyNotificationHash, fromPaytrOid, type PayTRNotification } from '@/lib/paytr/client'
import { updateOrderStatus, resolveOrderRecipientEmail } from '@/lib/supabase/queries'
import { createSupabaseAdminClient } from '@/lib/supabase/server'
import { sendOrderConfirmationEmail, sendAdminOrderNotification } from '@/lib/email/sendOrderConfirmation'
import { createOwnedProductFromCustomDesign } from '@/lib/sanity-fulfillment'
import { censorName, generateGuestDisplayName } from '@/lib/nameCensor'

/**
 * PayTR'nin ÖDEME SONUCUNU bize bildirdiği tek yer burası — sunucudan
 * sunucuya (server-to-server) POST, tarayıcı bu URL'i HİÇ görmez/ziyaret
 * etmez. iyzico'daki callback'in aksine burası "asıl gerçek" — tarayıcının
 * gittiği merchant_ok_url/merchant_fail_url (confirmation sayfası) sadece
 * görsel bir yönlendirme, sipariş durumunu DEĞİŞTİRMEZ.
 *
 * KRİTİK: PayTR'nin döngüye girip tekrar tekrar denemesini durdurmak için,
 * bildirimi aldığımızı (işleyip işleyemediğimize bakmaksızın, sadece
 * GEÇERLİ bir bildirim olduğunu) düz metin "OK" ile onaylamamız GEREKİYOR.
 * Hash doğrulanamazsa "OK" DÖNMÜYORUZ — bu durumda PayTR'nin tekrar
 * denemesi bilerek isteniyor (muhtemelen bizim tarafta bir yapılandırma
 * hatası var, sessizce yutmak yerine görünür kalsın).
 */
export async function POST(request: Request) {
  let notification: PayTRNotification | null = null

  try {
    const formData = await request.formData()
    notification = {
      merchant_oid: String(formData.get('merchant_oid') ?? ''),
      status: (formData.get('status') as 'success' | 'failed') ?? 'failed',
      total_amount: String(formData.get('total_amount') ?? ''),
      hash: String(formData.get('hash') ?? ''),
      failed_reason_code: formData.get('failed_reason_code') as string | undefined,
      failed_reason_msg: formData.get('failed_reason_msg') as string | undefined,
      test_mode: formData.get('test_mode') as string | undefined,
      payment_type: formData.get('payment_type') as string | undefined,
      currency: formData.get('currency') as string | undefined,
      payment_amount: formData.get('payment_amount') as string | undefined,
    }

    if (!verifyNotificationHash(notification)) {
      console.error('[PayTR notify] HASH DOĞRULANAMADI — sahte bildirim olabilir:', notification)
      return new Response('hash mismatch', { status: 400 })
    }

    // PayTR'ye tiresiz gönderdik (TAB2026AB12C), veritabanında tireli
    // duruyor (TAB-2026-AB12C) — önce çevrilmiş halini, olmazsa ham halini dene.
    // "Bulunamadı" ile "DB hatası"nı AYIRIYORUZ: bulunamadı kalıcı bir durum,
    // DB hatası geçici.
    const lookupAdmin = createSupabaseAdminClient()
    let order: any = null
    let orderNumber = notification.merchant_oid
    let dbError: unknown = null
    for (const candidate of [fromPaytrOid(notification.merchant_oid), notification.merchant_oid]) {
      const { data, error } = await (lookupAdmin as any)
        .from('orders')
        .select('*, order_items(*)')
        .eq('order_number', candidate)
        .maybeSingle()
      if (error) {
        dbError = error
        continue
      }
      if (data) {
        order = data
        orderNumber = candidate
        break
      }
    }

    if (!order) {
      if (dbError) {
        // Geçici DB hatası: PayTR tekrar denesin.
        console.error('[PayTR notify] Sipariş sorgusu DB hatası:', dbError)
        return new Response('db error', { status: 500 })
      }
      // Hash GEÇERLİ ama bu sipariş bizde yok (ör. PayTR panelinin canlı mod
      // "Bildirim URL" test bildirimi sahte merchant_oid gönderir). 500
      // dönersek PayTR "bildirim URL'de sorun var" der ve tekrar dener —
      // bu yüzden OK ile onaylıyoruz.
      console.warn('[PayTR notify] Bilinmeyen sipariş için geçerli bildirim, OK dönülüyor:', notification.merchant_oid)
      return new Response('OK')
    }

    if (notification.status === 'success') {
      // NOT: Durum artık doğrudan 'processing' değil 'received' oluyor.
      // Sertifika/Ürün Kartı/Garanti belgeleri BURADA üretilmiyor —
      // müşterinin ödeme sonrası bekleme süresini kısaltmak için, admin
      // siparişi panelden 'processing'e aldığında üretiliyor
      // (bkz. src/app/api/admin/orders/route.ts).
      //
      // NOT 2: iyzico'daki `iyzicoPaymentId`/`iyzicoToken` alanları GEÇİCİ
      // olarak genel amaçlı yeniden kullanılıyor (PayTR'nin merchant_oid ve
      // payment_type değerlerini taşımak için) — veritabanında ayrı
      // paytr_* kolonları açmak istiyorsanız (Faz 4) burayı da güncelleriz.
      await updateOrderStatus(order.id, 'received', {
        iyzicoPaymentId: notification.merchant_oid,
        iyzicoToken: notification.payment_type ?? 'paytr',
        paidAt: new Date().toISOString(),
      })

      // E-posta gönderimi — başarısız olsa da ödeme akışını bloklamaz.
      try {
        const recipientEmail = await resolveOrderRecipientEmail(order)

        if (recipientEmail) {
          const currency = (order.currency ?? 'TRY') as 'TRY' | 'USD'
          const admin = createSupabaseAdminClient()

          const orderItems = await Promise.all(
            (order.order_items ?? []).map(async (item: any) => {
              let snapshotUrl: string | undefined
              let parts: Array<{ slotType: string; partId: string; materialId: string; color: string }> = []

              if (item.custom_design_id) {
                const { data: design } = await (admin as any)
                  .from('custom_designs')
                  .select('snapshot_url, design_data')
                  .eq('id', item.custom_design_id)
                  .single()

                if (design) {
                  snapshotUrl = design.snapshot_url ?? undefined
                  parts = (design.design_data?.parts ?? []).map((p: any) => ({
                    slotType: String(p.slotType ?? '').toUpperCase(),
                    partId: String(p.partId ?? ''),
                    materialId: String(p.materialId ?? ''),
                    color: String(p.color ?? p.materialId ?? ''),
                  }))
                }
              }

              return {
                name: item.product_name,
                quantity: item.quantity,
                unitPriceMinor: item.unit_price,
                snapshotUrl,
                parts,
              }
            })
          )

          // E-posta dili, ödeme para birimine göre belirlenir: USD -> EN,
          // TRY -> TR. Admin panelinden gönderilen durum e-postalarıyla
          // (processing/shipped) aynı kuralı takip eder.
          const emailLocale: 'tr' | 'en' = order.currency === 'USD' ? 'en' : 'tr'

          const emailParams = {
            locale: emailLocale,
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
          console.error('[PayTR notify] Sipariş için e-posta adresi çözümlenemedi:', orderNumber)
        }
      } catch (emailError) {
        console.error('[PayTR notify] E-posta gönderim hatası:', emailError)
      }

      // Custom Registry kalemlerini gerçek Sanity "owned" ürününe dönüştür
      // — hem ÜYE hem MİSAFİR siparişlerinde. Bu blok KASITLI olarak ödeme
      // akışını BLOKLAMAZ: Sanity tarafında bir hata olsa bile müşteri
      // ödemeyi zaten yapmıştır ve sipariş onaylanmıştır — hata sadece
      // loglanır, admin panelden sonradan elle düzeltilebilir.
      try {
        const admin = createSupabaseAdminClient()

        let ownerDisplayName: string
        let ownerUserId: string | undefined
        if (order.user_id) {
          const { data: profile } = await (admin as any)
            .from('profiles')
            .select('full_name')
            .eq('id', order.user_id)
            .single()
          ownerDisplayName = censorName(profile?.full_name ?? 'Üye')
          ownerUserId = order.user_id
        } else {
          ownerDisplayName = generateGuestDisplayName()
          ownerUserId = undefined
        }
        const ownerCity = order.shipping_city ?? undefined

        for (const item of order.order_items ?? []) {
          if (!item.custom_design_id) continue

          const { data: design } = await (admin as any)
            .from('custom_designs')
            .select('collection_key, design_data, snapshot_url')
            .eq('id', item.custom_design_id)
            .single()

          if (!design?.collection_key || !design?.design_data?.parts) {
            console.error(
              `[PayTR notify] custom_design ${item.custom_design_id} eksik veri, Sanity ürünü oluşturulamadı`
            )
            continue
          }

          const unitPriceMajor = Number(item.unit_price ?? 0) / 100
          const priceTRY = order.currency === 'TRY' ? unitPriceMajor : unitPriceMajor
          const priceUSD = order.currency === 'USD' ? unitPriceMajor : unitPriceMajor

          await createOwnedProductFromCustomDesign({
            customDesignId: item.custom_design_id,
            ownerDisplayName,
            ownerCity,
            ownerUserId,
            collectionKey: design.collection_key,
            parts: design.design_data.parts,
            productName: item.product_name ?? 'Custom Registry Object',
            priceTRY,
            priceUSD,
            snapshotUrl: design.snapshot_url ?? undefined,
          })
        }
      } catch (sanityError) {
        console.error('[PayTR notify] Sanity "owned" ürün oluşturma hatası:', sanityError)
      }

      // Bureau Credits işlemleri — üye siparişleri için
      if (order.user_id) {
        try {
          const admin = createSupabaseAdminClient()
          const currency = (order.currency ?? 'TRY') as 'TRY' | 'USD'

          const creditsUsed = Number(order.bureau_credits_used ?? 0)
          if (creditsUsed > 0) {
            await (admin as any).rpc('grant_bureau_credits', {
              p_user_id: order.user_id,
              p_amount: -creditsUsed,
              p_description: `Sipariş #${orderNumber} — Büro Kredisi Kullanımı`,
              p_currency: currency,
            })
          }

          const totalInCurrency = Number(order.total_amount ?? 0) / 100
          const creditsEarned = Math.floor(totalInCurrency * 0.1 * 100) / 100

          if (creditsEarned > 0) {
            await (admin as any).rpc('grant_bureau_credits', {
              p_user_id: order.user_id,
              p_amount: creditsEarned,
              p_description: `Sipariş #${orderNumber} — %10 Bureau Credits`,
              p_currency: currency,
            })
            await (admin as any)
              .from('orders')
              .update({ credits_earned: creditsEarned })
              .eq('id', order.id)
          }
        } catch (creditError) {
          console.error('[PayTR notify] Kredi işlem hatası:', creditError)
        }
      }
    } else {
      // Ödeme başarısız — siparişi iptal olarak işaretle
      await updateOrderStatus(order.id, 'cancelled', {
        iyzicoToken: notification.failed_reason_msg ?? 'paytr_failed',
      })
    }

    // PayTR'ye bildirimi aldığımızı onaylıyoruz — bu dönmezse PayTR
    // periyodik olarak tekrar POST atmaya devam eder.
    return new Response('OK')
  } catch (error) {
    console.error('[PayTR notify] Beklenmedik hata:', error, notification)
    // "OK" DÖNMÜYORUZ — PayTR tekrar denesin, çünkü bu muhtemelen geçici
    // bir hata (DB bağlantısı vb.), kalıcı bir red değil.
    return new Response('error', { status: 500 })
  }
}
