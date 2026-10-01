'use client'

import { useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { getLocalizedValue, formatPrice, getPricingForLocale } from '@/lib/sanity'
import { useTheme } from '@/components/theme/ThemeProvider'
import { AddToCartMini } from './AddToCartMini'
import { CustomizeButtonMini } from './CustomizeButtonMini'
import { ProductCardMedia } from './ProductCardMedia'
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

export function ProductCard({
  product,
  mediaAspectClassName,
  compact,
}: {
  product: ProductCardType
  /** Varsayılan 3:4 (registry grid'i) — Drop satırlarında farklı bir oran geçilebilir. */
  mediaAspectClassName?: string
  /** Üst satırı (REG NO/durum) ve buton boşluklarını sıkılaştırır — Drop satırlarında kullanılır. */
  compact?: boolean
}) {
  const locale = useLocale()
  const { theme } = useTheme()
  const name = getLocalizedValue(product.name, locale, '—')
  const statusLabel = STATUS_LABEL[product.status]?.[locale as 'tr' | 'en'] ?? product.status
  const statusClass = STATUS_CLASS[product.status] ?? 'status-certified'
  const pricing = getPricingForLocale(product, locale)
  const intlLocale = locale === 'tr' ? 'tr-TR' : 'en-US'
  // Aydınlık modda Sanity'deki 1. fotoğraf (product.image), karanlık modda
  // 2. fotoğraf (product.imageDark) gösterilir. 2. fotoğraf girilmemişse
  // (imageDark yoksa) her modda 1. fotoğrafa düşer — kart hiç boş kalmaz.
  const cardImage = theme === 'dark' && product.imageDark ? product.imageDark : product.image

  return (
    <Link
      href={`/registry/${product.slug.current}`}
      className="group flex flex-col border border-bureau-line-header p-2.5 no-underline transition-colors hover:bg-bureau-surface"
    >
      {/* Top: serial + status */}
      <div className={`flex items-start justify-between ${compact ? 'mb-1' : 'mb-2'}`}>
        <span className={`serial ${compact ? 'text-[7px]' : 'text-[9px]'}`}>REG. NO. {product.registryNo}</span>
        <span className={`${statusClass} ${compact ? 'text-[7px]' : 'text-[9px]'}`}>● {statusLabel}</span>
      </div>

      {/* Image — 3:4 (portre) oranında: çektiğiniz fotoğrafların gerçek
          oranı (3024×4032). Configurable ürünlerde, görünüme girince
          önceden üretilmiş 360° dönüş kareleriyle otomatik 3D'ye döner
          (bkz. ProductCardMedia.tsx). */}
      <ProductCardMedia
        slug={product.slug.current}
        isConfigurable={product.isConfigurable}
        image={cardImage}
        alt={cardImage?.alt ?? name ?? ''}
        {...(mediaAspectClassName ? { aspectClassName: mediaAspectClassName } : {})}
      />

      {/* Meta */}
      <div className="flex-grow">
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-bureau">
          {name}
        </h3>
      </div>

      {/* Foot: price + spec */}
      <div className="mt-auto flex items-center justify-between border-t border-dashed border-bureau-rule pt-2">
        <span className="flex flex-wrap items-baseline gap-1.5">
          {pricing.discounted !== undefined && (
            <span
              className={`font-mono text-bureau-subtle line-through ${compact ? 'text-[11px]' : 'text-[12px]'}`}
            >
              {formatPrice(pricing.original, pricing.currency, intlLocale)}
            </span>
          )}
          <span
            className={`font-mono font-bold ${compact ? 'text-[16px]' : 'text-[18px]'} ${
              pricing.discounted !== undefined ? 'text-bureau-amber' : ''
            }`}
          >
            {formatPrice(pricing.discounted ?? pricing.original, pricing.currency, intlLocale)}
          </span>
        </span>
        {product.photonOutput && (
          <span className="font-mono text-[9px] text-bureau-subtle">
            {product.photonOutput}
          </span>
        )}
      </div>

      <AddToCartMini product={product} compact={compact} />
      <CustomizeButtonMini slug={product.slug.current} isConfigurable={product.isConfigurable} compact={compact} />
    </Link>
  )
}