import { createSupabaseAdminClient } from '@/lib/supabase/server'
import { getProductById } from '@/lib/queries'
import { loadTemplate, fillTemplate } from './fillTemplate'
import { buildDocumentData } from './buildDocumentData'
import { htmlToPdfBuffer, mergeHtmlPagesToPdf } from './generatePdf'
import type { StoredDocType } from './types'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ambiencebureau.com'

async function uploadPdf(admin: any, path: string, buffer: Buffer): Promise<string> {
  const { error } = await admin.storage.from('documents').upload(path, buffer, {
    contentType: 'application/pdf',
    upsert: true,
  })
  if (error) throw new Error(`PDF yüklenemedi (${path}): ${error.message}`)

  const { data } = admin.storage.from('documents').getPublicUrl(path)
  return data.publicUrl
}

async function saveDocumentRecord(
  admin: any,
  orderItemId: string,
  docType: StoredDocType,
  locale: 'tr' | 'en',
  pdfUrl: string
) {
  const { error } = await admin
    .from('order_documents')
    .upsert(
      { order_item_id: orderItemId, doc_type: docType, locale, pdf_url: pdfUrl, generated_at: new Date().toISOString() },
      { onConflict: 'order_item_id,doc_type' }
    )
  if (error) throw new Error(`order_documents kaydı yapılamadı: ${error.message}`)
}

/**
 * Bir siparişin TÜM kalemleri için Sertifika, Ürün Kartı (ön+arka birleşik) ve
 * Garanti Belgesi PDF'lerini üretir, Supabase Storage'a yükler ve order_documents
 * tablosuna kaydeder. checkout/callback/route.ts içinde sipariş 'processing'
 * durumuna geçtiğinde çağrılır. E-posta gönderimi gibi — hata alırsa ödeme
 * akışını BLOKLAMAZ, sadece loglar.
 */
export async function generateOrderDocuments(order: any, locale: 'tr' | 'en') {
  const admin = createSupabaseAdminClient() as any

  for (const item of order.order_items ?? []) {
    try {
      let product: any = null
      let customDesign: any = null

      if (item.item_type === 'custom' && item.custom_design_id) {
        const { data } = await admin
          .from('custom_designs')
          .select('snapshot_url, collection_key')
          .eq('id', item.custom_design_id)
          .single()
        customDesign = data
      } else if (item.sanity_product_id) {
        product = await getProductById(item.sanity_product_id)
      }

      const templateData = await buildDocumentData({
        locale,
        baseUrl: BASE_URL,
        orderItem: {
          certificate_no: item.certificate_no,
          registry_no: item.registry_no,
          product_name: item.product_name,
          item_type: item.item_type,
        },
        order: { paid_at: order.paid_at, created_at: order.created_at },
        product,
        customDesign,
      })

      // 1. Sertifika
      const certificateHtml = fillTemplate(await loadTemplate(locale, 'certificate'), templateData)
      const certificatePdf = await htmlToPdfBuffer(certificateHtml)
      const certificateUrl = await uploadPdf(
        admin,
        `${order.order_number}/${item.certificate_no}/certificate.pdf`,
        certificatePdf
      )
      await saveDocumentRecord(admin, item.id, 'certificate', locale, certificateUrl)

      // 2. Ürün Kartı (ön + arka, tek PDF'te 2 sayfa)
      const frontHtml = fillTemplate(await loadTemplate(locale, 'product-front'), templateData)
      const backHtml = fillTemplate(await loadTemplate(locale, 'product-back'), templateData)
      const productCardPdf = await mergeHtmlPagesToPdf([frontHtml, backHtml])
      const productCardUrl = await uploadPdf(
        admin,
        `${order.order_number}/${item.certificate_no}/product-card.pdf`,
        productCardPdf
      )
      await saveDocumentRecord(admin, item.id, 'product_card', locale, productCardUrl)

      // 3. Garanti Belgesi
      const warrantyHtml = fillTemplate(await loadTemplate(locale, 'warranty'), templateData)
      const warrantyPdf = await htmlToPdfBuffer(warrantyHtml)
      const warrantyUrl = await uploadPdf(
        admin,
        `${order.order_number}/${item.certificate_no}/warranty.pdf`,
        warrantyPdf
      )
      await saveDocumentRecord(admin, item.id, 'warranty', locale, warrantyUrl)
    } catch (err) {
      console.error(`[generateOrderDocuments] Kalem ${item.id} için belge üretilemedi:`, err)
      // Bu kalem başarısız olsa da diğer kalemler için üretime devam et
    }
  }
}
