import type { Metadata } from 'next'
import { getAllProducts, getProductCount } from '@/lib/queries'
import { Sidebar } from '@/components/registry/Sidebar'
import { ProductGrid } from '@/components/registry/ProductGrid'
import { getTranslations } from 'next-intl/server'
import type { ProductCategory, ProductStatus, PhotonOutput, ControlCompatibility } from '@/types'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{
    category?: string
    status?: string
    photon?: string
    compat?: string
    price?: string
  }>
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'registry' })

  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: `/${locale}/registry`,
      languages: { tr: '/tr/registry', en: '/en/registry' },
    },
  }
}

function parsePriceRange(price?: string): { minPrice?: number; maxPrice?: number } {
  if (!price) return {}
  const [min, max] = price.split('-')
  return {
    minPrice: min ? Number(min) : undefined,
    maxPrice: max ? Number(max) : undefined,
  }
}

export default async function RegistryPage({ searchParams }: Props) {
  const params = await searchParams
  const { minPrice, maxPrice } = parsePriceRange(params.price)

  const [products, totalCount] = await Promise.all([
    getAllProducts({
      category: params.category as ProductCategory | undefined,
      status: params.status as ProductStatus | undefined,
      photonOutput: params.photon as PhotonOutput | undefined,
      compatibility: params.compat as ControlCompatibility | undefined,
      minPrice,
      maxPrice,
    }),
    getProductCount(),
  ])

  return (
    <>
      {/* Document strip */}
      <div className="flex items-center justify-between border-b border-bureau-black px-10 py-3.5 font-mono text-[11px] text-bureau-muted">
        <div>DOCUMENT REF: TAB-2026-REG-04 // CLASSIFICATION: PUBLIC CATALOGUE</div>
        <div className="text-bureau-black">
          OBJECTS ON RECORD: <span className="text-bureau-amber">{totalCount}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr]">
        <Sidebar objectCount={products.length} />

        <main className="px-9 py-9">
          <ProductGrid products={products} />
        </main>
      </div>
    </>
  )
}
