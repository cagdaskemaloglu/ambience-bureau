'use client'

import { useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { getLocalizedValue, formatPrice, getPricingForLocale } from '@/lib/sanity'
import { useTheme } from '@/components/theme/ThemeProvider'
import { AddToCartMini } from './AddToCartMini'
import { ModelRequestMini } from './ModelRequestMini'
import { CustomizeButtonMini } from './CustomizeButtonMini'
import { ProductCardMedia } from './ProductCardMedia'
import {
  getLightClass,
  isProductPurchasable,
  resolveSaleMode,
  resolveStockState,
  type StockState,
} from '@/lib/lightClasses'
import type { ProductCard as ProductCardType } from '@/types'

/**
 * Ürün kartı = DOSYA KARTI (bkz. claude/DESIGN.md).
 *
 *  ┌ başlık şeridi: DROP-001 · 006/050  |  durum ┐   (Daimi Envanter: SINIF S · ENV-S-012)
 *  │ fotoğraf / 360° dönüş  + [DAMGA]           │   damga SADECE önemli durumlarda
 *  │ ad                                          │
 *  │ sınıf · ● 2700K · uygulama                  │
 *  │ (sahip satırı — owned)                      │
 *  └ fiyat ──────────────────────────────────────┘
 *  Eylemler: masaüstünde (hover destekleyen cihaz) fotoğrafın altından
 *  çekmece gibi kayar; dokunmatik/mobilde kartın altında hep görünür.
 *  Hover: kart 4px yükselir, köşelerde baskı kesim işaretleri belirir.
 */

const STATUS_LABEL: Record<string, { tr: string; en: string; className: string }> = {
  certified: { tr: 'Sertifikalı', en: 'Certified', className: 'status-certified' },
  limited: { tr: 'Sınırlı Seri', en: 'Limited Series', className: 'status-limited' },
  decommissioned: { tr: 'Hizmet Dışı', en: 'Decommissioned', className: 'status-decommissioned' },
  owned: { tr: 'Sahipli', en: 'Owned', className: 'status-limited' },
}

const STOCK_LABEL: Record<StockState, { tr: string; en: string; className: string }> = {
  'in-stock': { tr: 'Stokta', en: 'In Stock', className: 'status-certified' },
  'made-to-order': { tr: 'Siparişe Üretim', en: 'Made to Order', className: 'status-limited' },
  'out-of-stock': { tr: 'Tükendi', en: 'Out of Stock', className: 'status-decommissioned' },
}

/** Az kaldı damgası bu adet ve altında basılır (Daimi Envanter). */
const LOW_STOCK_THRESHOLD = 3

type Stamp = { text: string; tone: 'amber' | 'red' }

function resolveStamp(product: ProductCardType, tr: boolean, dropSoldOut?: boolean): Stamp | null {
  if (product.status === 'owned') return { text: tr ? 'Tahsis Edildi' : 'Allocated', tone: 'amber' }
  if (product.status === 'decommissioned' || dropSoldOut) return { text: tr ? 'Tükendi' : 'Sold Out', tone: 'red' }
  if (resolveSaleMode(product.saleMode) === 'standing') {
    const state = resolveStockState(product.stockQuantity)
    if (state === 'out-of-stock') return { text: tr ? 'Tükendi' : 'Sold Out', tone: 'red' }
    if (state === 'in-stock' && (product.stockQuantity ?? 0) <= LOW_STOCK_THRESHOLD) {
      const n = product.stockQuantity ?? 0
      return { text: tr ? `Son ${n} adet` : `Last ${n}`, tone: 'amber' }
    }
  }
  return null
}

const PHOTON_SWATCH: Record<string, string> = {
  '2700K': 'bg-[#ffb46b]',
  '6500K': 'bg-[#dfe8ff]',
  '2700K-6500K': 'bg-gradient-to-r from-[#ffb46b] to-[#dfe8ff]',
}

export function ProductCard({
  product,
  mediaAspectClassName,
  compact,
  dropSoldOut,
}: {
  product: ProductCardType
  /** Kartın bağlı olduğu drop'un tüm adetleri tahsis edildiyse: TÜKENDİ damgası, eylem yok. */
  dropSoldOut?: boolean
  /** Varsayılan 3:4 (registry grid'i) — Drop satırlarında farklı bir oran geçilebilir. */
  mediaAspectClassName?: string
  /** Yazıları ve boşlukları sıkılaştırır — Drop satırlarında kullanılır. */
  compact?: boolean
}) {
  const locale = useLocale()
  const tr = locale === 'tr'
  const { theme } = useTheme()
  const name = getLocalizedValue(product.name, locale, '—')
  const pricing = getPricingForLocale(product, locale)
  const intlLocale = tr ? 'tr-TR' : 'en-US'
  // Aydınlık modda 1. fotoğraf, karanlık modda 2. fotoğraf (yoksa 1.).
  const cardImage = theme === 'dark' && product.imageDark ? product.imageDark : product.image

  const isStanding = resolveSaleMode(product.saleMode) === 'standing'
  const lightClass = getLightClass(product.category)
  const status = isStanding
    ? STOCK_LABEL[resolveStockState(product.stockQuantity)]
    : (STATUS_LABEL[product.status] ?? STATUS_LABEL.certified)
  const stamp = resolveStamp(product, tr, dropSoldOut)

  // Montajlı Modelden otomatik üretilen kart: ürün sayfası yok, kart
  // konfigüratörü o model seçili açar; sepete doğrudan eklenmez.
  const modelLink = product.modelLink ?? null

  // Başlık şeridi — dosyanın kimliği.
  const fileId = modelLink
    ? `${tr ? 'Sınıf' : 'Class'} ${lightClass?.code ?? '—'} · ${tr ? 'Model' : 'Model'}`
    : isStanding
    ? `${tr ? 'Sınıf' : 'Class'} ${lightClass?.code ?? '—'} · ${product.registryNo}`
    : product.dropNo
      ? `DROP-${product.dropNo} · ${product.registryNo}`
      : `REG. NO. ${product.registryNo}`

  const href = modelLink
    ? `/custom-registry?collection=${encodeURIComponent(modelLink.collectionKey)}&model=${encodeURIComponent(modelLink.modelId)}`
    : `/registry/${product.slug.current}`
  const purchasable = !modelLink && !dropSoldOut && isProductPurchasable(product)
  const configurable = !modelLink && !dropSoldOut && product.isConfigurable
  const hasActions = purchasable || configurable || !!modelLink

  const actions = modelLink ? (
    // Montajlı Model: varsayılan renklerle doğrudan sepete + konfigüratörde özelleştir.
    <>
      {product.modelDefault && <ModelRequestMini product={product} className="min-w-0 flex-[3] basis-0 py-2" />}
      <CustomizeButtonMini
        slug={product.slug.current}
        href={href}
        isConfigurable
        className="min-w-0 flex-[2] basis-0 py-2"
      />
    </>
  ) : hasActions ? (
    <>
      {/* basis-0 + oranlı flex: iki buton varken genişlik 3:2 bölünür, yazılar sıkışmaz */}
      {purchasable && <AddToCartMini product={product} className="min-w-0 flex-[3] basis-0 py-2" />}
      {configurable && (
        <CustomizeButtonMini
          slug={product.slug.current}
          isConfigurable={product.isConfigurable}
          className="min-w-0 flex-[2] basis-0 py-2"
        />
      )}
    </>
  ) : null

  const text = compact ? 'text-[8px]' : 'text-[9px]'

  return (
    <Link
      href={href}
      className="product-file focus-bureau group relative flex flex-col border border-bureau-black bg-bureau-white no-underline"
    >
      {/* Başlık şeridi */}
      <div
        className={`flex items-center justify-between gap-2 border-b border-bureau-black px-2.5 py-1.5 font-mono uppercase tracking-widest ${text}`}
      >
        <span className="truncate text-bureau-black">{fileId}</span>
        <span className={`shrink-0 ${status.className} ${text}`}>● {tr ? status.tr : status.en}</span>
      </div>

      {/* Fotoğraf + damga + (masaüstü) eylem çekmecesi */}
      <div className="product-file-media relative overflow-hidden">
        <ProductCardMedia
          slug={product.slug.current}
          isConfigurable={product.isConfigurable}
          image={cardImage}
          alt={cardImage?.alt ?? name ?? ''}
          {...(mediaAspectClassName ? { aspectClassName: mediaAspectClassName } : {})}
        />
        {stamp && (
          <span
            className={`bureau-stamp pointer-events-none absolute right-2 top-3 -rotate-[8deg] border-2 bg-bureau-white/85 px-2 py-1 font-mono font-semibold uppercase tracking-widest ${
              compact ? 'text-[9px]' : 'text-[11px]'
            } ${stamp.tone === 'red' ? 'border-[#b03224] text-[#b03224]' : 'border-bureau-amber text-bureau-amber'}`}
          >
            {stamp.text}
          </span>
        )}
        {actions && <div className="card-actions-overlay">{actions}</div>}
      </div>

      {/* Gövde */}
      <div className={`flex flex-1 flex-col px-2.5 ${compact ? 'pt-2' : 'pt-2.5'}`}>
        <h3
          className={`font-semibold leading-snug tracking-[-0.01em] text-bureau-black ${compact ? 'text-[12px]' : 'text-[13px]'}`}
        >
          {name}
        </h3>
        <p className={`mt-1 flex flex-wrap items-center gap-x-1.5 font-mono uppercase tracking-wider text-bureau-muted ${text}`}>
          {lightClass && <span>{tr ? lightClass.tr : lightClass.en}</span>}
          {product.photonOutput && (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <span
                  aria-hidden="true"
                  className={`inline-block h-[7px] w-[7px] rounded-full ${PHOTON_SWATCH[product.photonOutput] ?? 'bg-bureau-rule'}`}
                />
                {product.photonOutput}
              </span>
            </>
          )}
          {product.compatibility?.includes('app') && (
            <>
              <span aria-hidden="true">·</span>
              <span>{tr ? 'Uygulama' : 'App control'}</span>
            </>
          )}
        </p>
        {product.status === 'owned' && product.ownerDisplayName && (
          <p className={`mt-1 font-mono text-bureau-subtle ${text}`}>
            {tr ? 'Sahibi' : 'Owner'}: {product.ownerDisplayName}
            {product.ownerCity ? ` · ${product.ownerCity}` : ''}
          </p>
        )}

        <div className={`mt-auto flex items-baseline gap-1.5 border-t border-dashed border-bureau-rule ${compact ? 'mt-2 py-2' : 'mt-2.5 py-2.5'}`}>
          {modelLink && !tr && <span className={`font-mono uppercase tracking-wider text-bureau-muted ${text}`}>From</span>}
          {pricing.discounted !== undefined && (
            <span className={`font-mono text-bureau-subtle line-through ${compact ? 'text-[11px]' : 'text-[12px]'}`}>
              {formatPrice(pricing.original, pricing.currency, intlLocale)}
            </span>
          )}
          <span
            className={`font-mono font-bold ${compact ? 'text-[16px]' : 'text-[18px]'} ${
              pricing.discounted !== undefined ? 'text-bureau-amber' : 'text-bureau-black'
            }`}
          >
            {formatPrice(pricing.discounted ?? pricing.original, pricing.currency, intlLocale)}
          </span>
          {modelLink && tr && <span className={`font-mono uppercase tracking-wider text-bureau-muted ${text}`}>'den başlayan</span>}

        </div>
      </div>

      {/* Eylemler — dokunmatik/mobilde hep görünür */}
      {actions && <div className="card-actions-inline border-t border-bureau-rule p-2.5">{actions}</div>}
    </Link>
  )
}
