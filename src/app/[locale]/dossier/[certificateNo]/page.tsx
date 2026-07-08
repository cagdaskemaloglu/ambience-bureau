import { notFound } from 'next/navigation'
import { getOrderItemByCertificateNo } from '@/lib/supabase/queries'
import { getProductById } from '@/lib/queries'
import { createSupabaseAdminClient } from '@/lib/supabase/server'
import { getLocalizedValue, urlFor } from '@/lib/sanity'

const VISIBLE_STATUSES = ['processing', 'shipped', 'delivered']

const DOC_LABELS: Record<string, { tr: string; en: string }> = {
  certificate: { tr: 'Orijinallik Sertifikası', en: 'Certificate of Authenticity' },
  product_card: { tr: 'Ürün Kartı', en: 'Product Card' },
  warranty: { tr: 'Garanti Belgesi', en: 'Warranty Document' },
}

export default async function DossierPage({
  params,
}: {
  params: Promise<{ locale: string; certificateNo: string }>
}) {
  const { locale, certificateNo } = await params
  const tr = locale === 'tr'

  const item = await getOrderItemByCertificateNo(certificateNo)

  if (!item || !VISIBLE_STATUSES.includes(item.orders?.status)) {
    notFound()
  }

  let imageUrl: string | null = null
  let specs: Array<{ key: string; value: string }> = []
  let collectionName: string | null = null

  if (item.item_type === 'custom' && item.custom_design_id) {
    const admin = createSupabaseAdminClient() as any
    const { data: design } = await admin
      .from('custom_designs')
      .select('snapshot_url, collection_key, design_data')
      .eq('id', item.custom_design_id)
      .single()

    imageUrl = design?.snapshot_url ?? null
    collectionName = design?.collection_key ? design.collection_key.toUpperCase() : null
    specs = (design?.design_data?.parts ?? []).map((p: any) => ({
      key: String(p.slotType ?? '').toUpperCase(),
      value: String(p.materialId ?? p.color ?? ''),
    }))
  } else if (item.sanity_product_id) {
    const product = await getProductById(item.sanity_product_id)
    if (product?.image) imageUrl = urlFor(product.image).width(800).url()
    collectionName = getLocalizedValue(product?.collection?.name, locale) ?? null
    specs = product?.specs ?? []
  }

  const documents = (item.order_documents ?? []) as Array<{
    doc_type: 'certificate' | 'product_card' | 'warranty'
    pdf_url: string
  }>

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="mb-8 border-b border-bureau-rule pb-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-bureau-subtle">
          {tr ? 'Dijital Ürün Kimliği' : 'Digital Product Identity'}
        </p>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-bureau-muted">
          {tr ? 'Sicil No' : 'Registry No'}: {item.registry_no} — {certificateNo}
        </p>
      </div>

      {imageUrl && (
        <div className="mb-6 border border-bureau-rule bg-bureau-surface p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={item.product_name} className="mx-auto max-h-96 object-contain" />
        </div>
      )}

      <h1 className="mb-1 text-[24px] font-light uppercase tracking-wide">{item.product_name}</h1>
      {collectionName && (
        <p className="mb-6 font-mono text-[10px] uppercase tracking-widest text-bureau-muted">
          {collectionName}
        </p>
      )}

      {specs.length > 0 && (
        <div className="mb-8 border border-bureau-rule">
          {specs.map((s, i) => (
            <div
              key={i}
              className={`flex justify-between px-4 py-2 font-mono text-[10px] uppercase tracking-wide ${
                i < specs.length - 1 ? 'border-b border-bureau-rule' : ''
              }`}
            >
              <span className="text-bureau-muted">{s.key}</span>
              <span className="text-bureau-black">{s.value}</span>
            </div>
          ))}
        </div>
      )}

      <div>
        <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-bureau-subtle">
          {tr ? 'Resmi Belgeler' : 'Official Documents'}
        </p>
        <div className="space-y-2">
          {(['certificate', 'product_card', 'warranty'] as const).map((docType) => {
            const doc = documents.find((d) => d.doc_type === docType)
            return (
              <div
                key={docType}
                className="flex items-center justify-between border border-bureau-black px-4 py-3"
              >
                <span className="font-mono text-[11px] uppercase tracking-wide">
                  {tr ? DOC_LABELS[docType].tr : DOC_LABELS[docType].en}
                </span>
                {doc ? (
                  <div className="flex gap-3">
                    <a
                      href={doc.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[10px] uppercase tracking-wider text-bureau-amber hover:underline"
                    >
                      {tr ? 'Görüntüle' : 'View'}
                    </a>
                    <a
                      href={doc.pdf_url}
                      download
                      className="font-mono text-[10px] uppercase tracking-wider text-bureau-muted hover:underline"
                    >
                      {tr ? 'İndir' : 'Download'}
                    </a>
                  </div>
                ) : (
                  <span className="font-mono text-[10px] uppercase tracking-wider text-bureau-subtle">
                    {tr ? 'Hazırlanıyor' : 'Processing'}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
