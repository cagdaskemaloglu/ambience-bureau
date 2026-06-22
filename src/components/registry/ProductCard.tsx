'use client'

import { useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import { urlFor, getLocalizedValue, formatPriceForLocale } from '@/lib/sanity'
import type { ProductCard as ProductCardType } from '@/types'

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

export function ProductCard({ product }: { product: ProductCardType }) {
  const locale = useLocale()
  const name = getLocalizedValue(product.name, locale, '—')
  const statusLabel = STATUS_LABEL[product.status]?.[locale as 'tr' | 'en'] ?? product.status
  const statusClass = STATUS_CLASS[product.status] ?? 'status-certified'

  return (
    <Link
      href={`/registry/${product.slug.current}`}
      className="group flex flex-col border-r border-b border-bureau-black p-5 no-underline transition-colors hover:bg-bureau-surface"
    >
      {/* Top: serial + status */}
      <div className="mb-3.5 flex items-start justify-between">
        <span className="serial">REG. NO. {product.registryNo}</span>
        <span className={statusClass}>● {statusLabel}</span>
      </div>

      {/* Image */}
      <div className="mb-4.5 flex h-40 items-center justify-center border border-bureau-rule bg-bureau-surface">
        {product.image ? (
          <Image
            src={urlFor(product.image).width(280).height(220).fit('max').url()}
            alt={product.image.alt ?? name ?? ''}
            width={280}
            height={160}
            className="h-full w-full object-contain p-3"
          />
        ) : (
          <span className="font-mono text-[11px] text-bureau-subtle uppercase">
            No Image on Record
          </span>
        )}
      </div>

      {/* Meta */}
      <div className="flex-grow">
        <h3 className="mb-1.5 text-[13.5px] font-semibold uppercase tracking-bureau">
          {name}
        </h3>
        {product.shortDescription && (
          <p className="mb-3.5 text-[11.5px] leading-relaxed text-bureau-muted">
            {getLocalizedValue(product.shortDescription, locale, '')}
          </p>
        )}
      </div>

      {/* Foot: price + spec */}
      <div className="mt-auto flex items-center justify-between border-t border-dashed border-bureau-rule pt-3">
        <span className="font-mono text-[13px] font-semibold">
          {formatPriceForLocale(product, locale)}
        </span>
        {product.photonOutput && (
          <span className="font-mono text-[10.5px] text-bureau-subtle">
            {product.photonOutput}
          </span>
        )}
      </div>
    </Link>
  )
}
