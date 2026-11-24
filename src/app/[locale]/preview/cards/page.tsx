import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllDropsWithProducts, getAllProducts } from '@/lib/queries'
import { DropRow } from '@/components/registry/DropRow'
import { DEMO_ENABLED } from '@/lib/bulletinDemo'
import { ProductCard } from '@/components/registry/ProductCard'
import type { DropWithProducts, ProductCard as ProductCardType } from '@/types'

export const metadata: Metadata = {
  title: 'Kart önizleme',
  robots: { index: false, follow: false },
}

/**
 * SADECE LOCAL ÖNİZLEME: yeni dosya kartının TÜM durumlarını (damgalar,
 * iki satış rejimi) gerçek ürün görselleriyle yan yana gösterir.
 * `BULLETIN_DEMO=1` yoksa 404 döner — üretimde erişilemez.
 */
export default async function CardPreviewPage({ params }: { params: Promise<{ locale: string }> }) {
  if (!DEMO_ENABLED) notFound()
  const { locale } = await params
  const tr = locale === 'tr'

  const base = (await getAllProducts()) as ProductCardType[]
  if (base.length === 0) notFound()
  const pick = (i: number) => base[i % base.length]

  const variants: Array<{ label: string; product: ProductCardType }> = [
    { label: tr ? 'Sınırlı Tahsis · sertifikalı (gerçek)' : 'Limited · certified (real)', product: pick(0) },
    {
      label: tr ? 'Sınırlı Tahsis · indirimli' : 'Limited · discounted',
      product: { ...pick(1), discountPriceTRY: Math.round(pick(1).priceTRY * 0.85), discountPriceUSD: Math.round(pick(1).priceUSD * 0.85) },
    },
    {
      label: tr ? 'Satılmış (owned)' : 'Owned',
      product: { ...pick(2), status: 'owned', ownerDisplayName: 'Ça*** KE***', ownerCity: 'Mersin' },
    },
    { label: tr ? 'Hizmet dışı' : 'Decommissioned', product: { ...pick(3), status: 'decommissioned' } },
    {
      label: tr ? 'Daimi Envanter · stokta' : 'Standing · in stock',
      product: { ...pick(4), saleMode: 'standing', stockQuantity: 24, category: 'floor', registryNo: 'ENV-S-001', isConfigurable: false },
    },
    {
      label: tr ? 'Daimi Envanter · son adetler' : 'Standing · low stock',
      product: { ...pick(5), saleMode: 'standing', stockQuantity: 2, category: 'desk', registryNo: 'ENV-F-004', isConfigurable: false },
    },
    {
      label: tr ? 'Daimi Envanter · siparişe üretim' : 'Standing · made to order',
      product: { ...pick(6), saleMode: 'standing', stockQuantity: null, category: 'wall', registryNo: 'ENV-D-002', isConfigurable: false },
    },
    {
      label: tr ? 'Daimi Envanter · tükendi' : 'Standing · sold out',
      product: { ...pick(7), saleMode: 'standing', stockQuantity: 0, category: 'wall', registryNo: 'ENV-D-003', isConfigurable: false },
    },
  ]

  // Tükenmiş drop önizlemesi: gerçek bir drop, tüm adetleri satılmış gibi.
  const drops = (await getAllDropsWithProducts()) as Array<DropWithProducts & { dropState: string }>
  const liveDrop = drops.find((d) => d.dropState === 'live' && d.products.length > 0)
  const soldOutDrop = liveDrop
    ? { ...liveDrop, soldCount: liveDrop.plannedQuantity ?? liveDrop.products.length, plannedQuantity: liveDrop.plannedQuantity ?? liveDrop.products.length }
    : null

  return (
    <>
    <div className="px-5 py-8 md:px-9">
      <p className="font-mono text-[10.5px] uppercase tracking-widest text-bureau-amber">
        {tr ? 'Local önizleme · üretimde görünmez' : 'Local preview · not visible in production'}
      </p>
      <h1 className="mt-2 text-[32px] font-semibold tracking-[-0.02em] text-bureau-black">
        {tr ? 'Dosya kartı: tüm durumlar' : 'File card: all states'}
      </h1>
      <p className="mt-2 max-w-[60ch] text-[14px] text-bureau-muted">
        {tr
          ? 'Görseller gerçek ürünlerden; durumlar (damga, stok, sınıf) önizleme için atanmıştır.'
          : 'Images come from real products; states (stamp, stock, class) are assigned for preview.'}
      </p>
      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {variants.map((v) => (
          <div key={v.label}>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-bureau-muted">{v.label}</p>
            <ProductCard product={{ ...v.product, _id: `${v.product._id}-${v.label}` }} />
          </div>
        ))}
      </div>
    </div>
    {soldOutDrop && (
      <section className="border-t border-bureau-rule pt-8">
        <p className="px-5 font-mono text-[10px] uppercase tracking-wider text-bureau-muted md:px-9">
          {tr ? 'Tükenmiş drop (tüm adetler tahsis edilmiş gibi)' : 'Sold-out drop (as if every unit were allocated)'}
        </p>
        <DropRow drop={soldOutDrop} index={0} prevDrop={null} nextDrop={null} />
      </section>
    )}
    </>
  )
}
