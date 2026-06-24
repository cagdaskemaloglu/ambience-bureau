import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { PortableText } from '@portabletext/react'
import {
  getProductBySlug,
  getRelatedProducts,
  getAllProductSlugs,
} from '@/lib/queries'
import { getLocalizedValue, urlFor, formatPriceForLocale, getPriceForLocale } from '@/lib/sanity'
import { ProductGallery } from '@/components/product/ProductGallery'
import { SpecTable } from '@/components/product/SpecTable'
import { AddToCartButton } from '@/components/product/AddToCartButton'
import { RelatedProducts } from '@/components/product/RelatedProducts'
import { Link } from '@/i18n/navigation'

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

const STATUS_LABEL: Record<string, { tr: string; en: string }> = {
  certified: { tr: 'Sertifikalı', en: 'Certified' },
  limited: { tr: 'Sınırlı Seri', en: 'Limited Series' },
  decommissioned: { tr: 'Hizmet Dışı', en: 'Decommissioned' },
}

const STATUS_CLASS: Record<string, string> = {
  certified: 'status-certified',
  limited: 'status-limited',
  decommissioned: 'status-decommissioned',
}

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs()
  return slugs.map((item) => ({ slug: item.slug.current }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return {}

  const name = getLocalizedValue(product.name, locale, '—')
  const description =
    getLocalizedValue(product.seo?.metaDescription, locale) ??
    getLocalizedValue(product.shortDescription, locale) ??
    ''

  const ogImageSource = product.seo?.ogImage ?? product.images?.[0]
  const ogImageUrl = ogImageSource ? urlFor(ogImageSource).width(1200).height(630).url() : undefined

  return {
    title: getLocalizedValue(product.seo?.metaTitle, locale) ?? `${name} — REG. NO. ${product.registryNo}`,
    description,
    alternates: {
      canonical: `/${locale}/registry/${slug}`,
      languages: { tr: `/tr/registry/${slug}`, en: `/en/registry/${slug}` },
    },
    openGraph: {
      title: name,
      description,
      images: ogImageUrl ? [{ url: ogImageUrl, width: 1200, height: 630 }] : undefined,
    },
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { locale, slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) notFound()

  const t = await getTranslations({ locale, namespace: 'product' })
  const tCommon = await getTranslations({ locale, namespace: 'common' })

  const name = getLocalizedValue(product.name, locale, '—') ?? '—'
  const description = getLocalizedValue(product.description, locale)
  const statusLabel = STATUS_LABEL[product.status]?.[locale as 'tr' | 'en'] ?? product.status
  const statusClass = STATUS_CLASS[product.status] ?? 'status-certified'

  const relatedProducts = await getRelatedProducts(product.category, slug)

  // JSON-LD Product Schema
  const { amount: jsonLdPrice, currency: jsonLdCurrency } = getPriceForLocale(product, locale)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description: getLocalizedValue(product.shortDescription, locale) ?? '',
    sku: product.registryNo,
    image: product.images?.map((img:any) => urlFor(img).url()) ?? [],
    offers: {
      '@type': 'Offer',
      price: jsonLdPrice,
      priceCurrency: jsonLdCurrency,
      availability:
        product.status === 'decommissioned'
          ? 'https://schema.org/OutOfStock'
          : 'https://schema.org/InStock',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb / doc strip */}
      <div className="flex items-center justify-between border-b border-bureau-black px-10 py-3.5 font-mono text-[11px] text-bureau-muted">
        <Link href="/registry" className="no-underline hover:text-bureau-black">
          ← {tCommon('backToRegistry')}
        </Link>
        <div>REGISTRY NO. {product.registryNo}</div>
      </div>

      <div className="grid grid-cols-1 gap-0 lg:grid-cols-2">
        {/* Left: Gallery */}
        <div className="border-b border-bureau-black p-9 lg:border-r lg:border-b-0">
          <ProductGallery images={product.images} fallbackAlt={name} />
        </div>

        {/* Right: Info + Form */}
        <div className="p-9">
          <div className="mb-4 flex items-center justify-between">
            <span className="serial">REG. NO. {product.registryNo}</span>
            <span className={statusClass}>● {statusLabel}</span>
          </div>

          <h1 className="mb-3 text-[32px] font-light uppercase tracking-wide">{name}</h1>

          <div className="mb-6 font-mono text-[20px] font-semibold">
            {formatPriceForLocale(product, locale)}
            {product.vatIncluded && (
              <span className="ml-2 font-sans text-[11px] font-normal text-bureau-muted">
                {locale === 'tr' ? '(KDV dahil)' : '(VAT included)'}
              </span>
            )}
          </div>

          {description && description.length > 0 && (
            <div className="mb-6 space-y-3 text-[13.5px] leading-relaxed text-bureau-ink [&_p]:mb-3">
              <PortableText value={description as any} />
            </div>
          )}

          <div className="mb-6">
            <AddToCartButton product={product} />
          </div>

          <SpecTable
            specs={product.specs}
            compatibility={product.compatibility}
            photonOutput={product.photonOutput}
          />

          {product.isConfigurable && (
            <div className="mt-5 border border-bureau-amber bg-bureau-amber/5 p-4">
              <p className="mb-2.5 text-[12px] leading-relaxed">
                {locale === 'tr'
                  ? 'Bu nesne özelleştirilebilir. Kendi konfigürasyonunuzu Custom Registry üzerinden oluşturun.'
                  : 'This object is configurable. Build your own configuration via Custom Registry.'}
              </p>
              <Link href="/custom-registry" className="btn-bureau-amber w-full text-center">
                Custom Registry →
              </Link>
            </div>
          )}
        </div>
      </div>

      <RelatedProducts products={relatedProducts} />
    </>
  )
}
