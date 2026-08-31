'use client'

import { useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import { urlFor, getLocalizedValue, formatPriceForLocale } from '@/lib/sanity'
import { AddToCartMini } from './AddToCartMini'
import { CustomizeButtonMini } from './CustomizeButtonMini'
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
      className="group flex flex-col border-r border-b border-bureau-black p-2.5 no-underline transition-colors hover:bg-bureau-surface"
    >
      {/* Top: serial + status */}
      <div className="mb-2 flex items-start justify-between">
        <span className="serial text-[9px]">REG. NO. {product.registryNo}</span>
        <span className={`${statusClass} text-[9px]`}>● {statusLabel}</span>
      </div>

      {/* Image — 3:4 (portre) oranında: çektiğiniz fotoğrafların gerçek
          oranı (3024×4032). Önceden sabit ve yatay (h-40) bir kutuydu,
          bu da dikey fotoğrafların içinde küçücük kalıp devasa boş alan
          bırakmasına yol açıyordu. */}
      <div className="mb-2 flex aspect-[3/4] w-full items-center justify-center border border-bureau-rule bg-bureau-surface">
        {product.image ? (
          <Image
            src={urlFor(product.image).width(600).height(800).fit('max').url()}
            alt={product.image.alt ?? name ?? ''}
            width={600}
            height={800}
            className="h-full w-full object-contain p-1.5"
          />
        ) : (
          <span className="font-mono text-[9px] text-bureau-subtle uppercase">
            No Image on Record
          </span>
        )}
      </div>

      {/* Meta */}
      <div className="flex-grow">
        <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-bureau">
          {name}
        </h3>
        {product.shortDescription && (
          <p className="mb-2 text-[9.5px] leading-relaxed text-bureau-muted">
            {getLocalizedValue(product.shortDescription, locale, '')}
          </p>
        )}
      </div>

      {/* Foot: price + spec */}
      <div className="mt-auto flex items-center justify-between border-t border-dashed border-bureau-rule pt-2">
        <span className="font-mono text-[11px] font-semibold">
          {formatPriceForLocale(product, locale)}
        </span>
        {product.photonOutput && (
          <span className="font-mono text-[9px] text-bureau-subtle">
            {product.photonOutput}
          </span>
        )}
      </div>

      <AddToCartMini product={product} />
      <CustomizeButtonMini slug={product.slug.current} isConfigurable={product.isConfigurable} />
    </Link>
  )
}