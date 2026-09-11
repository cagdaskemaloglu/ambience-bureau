import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getAllProducts } from '@/lib/queries'
import { CategoryFilterBar } from '@/components/registry/CategoryFilterBar'
import { ProductGrid } from '@/components/registry/ProductGrid'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import type { ProductCategory, ProductStatus, PhotonOutput, ControlCompatibility } from '@/types'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{
    category?: string
    status?: string
    photon?: string
    compat?: string
    price?: string
    drop?: string
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

export default async function RegistryPage({ params, searchParams }: Props) {
  const { locale } = await params
  const resolvedSearch = await searchParams
  const { minPrice, maxPrice } = parsePriceRange(resolvedSearch.price)
  const tr = locale === 'tr'

  const products = await getAllProducts({
    category: resolvedSearch.category as ProductCategory | undefined,
    status: resolvedSearch.status as ProductStatus | undefined,
    photonOutput: resolvedSearch.photon as PhotonOutput | undefined,
    compatibility: resolvedSearch.compat as ControlCompatibility | undefined,
    minPrice,
    maxPrice,
    drop: resolvedSearch.drop,
  })

  return (
    <>
      {/* Mobil Custom Registry CTA banner */}
      <div className="border-b border-bureau-black bg-bureau-black px-5 py-3 md:hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/50">
              {tr ? 'KENDİNİZ TASARLAYIN' : 'DESIGN YOUR OWN'}
            </p>
            <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-white">
              {tr ? 'Özel Lamba Konfigüratörü' : 'Custom Lamp Configurator'}
            </p>
          </div>
          <Link
            href="/custom-registry"
            className="flex items-center gap-1.5 border border-bureau-amber bg-bureau-amber px-3.5 py-2 font-mono text-[10px] uppercase tracking-wider text-white no-underline"
          >
            <span className="h-[4px] w-[4px] rounded-full bg-white flex-shrink-0" />
            {tr ? 'Başla' : 'Start'}
          </Link>
        </div>
      </div>

      <Suspense fallback={<div className="h-[33px] md:h-[37px]" />}>
        <CategoryFilterBar count={products.length} />
      </Suspense>

      <main className="px-5 py-3 md:px-9 md:py-5">
        <ProductGrid products={products} />
      </main>
    </>
  )
}