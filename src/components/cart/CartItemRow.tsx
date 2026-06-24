'use client'

import { useLocale } from 'next-intl'
import { formatPrice } from '@/lib/sanity'
import { useCartStore } from '@/lib/store/cart'
import type { CartItem } from '@/types'

export function CartItemRow({ item }: { item: CartItem }) {
  const locale = useLocale() as 'tr' | 'en'
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)

  const name = item.name[locale]
  const unitPrice = locale === 'tr' ? item.priceTRY : item.priceUSD
  const currency = locale === 'tr' ? 'TRY' : 'USD'
  const intlLocale = locale === 'tr' ? 'tr-TR' : 'en-US'
  const lineTotal = unitPrice * item.quantity

  return (
    <div className="flex items-start justify-between gap-4 border-b border-dashed border-bureau-rule py-4">
      {/* Sol: tip + isim + custom tasarım detayı */}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="serial">REG. NO. {item.registryNo}</span>
          {item.type === 'custom' && (
            <span className="font-mono text-[9.5px] uppercase tracking-wide text-bureau-amber">
              {locale === 'tr' ? 'ÖZEL TASARIM' : 'CUSTOM DESIGN'}
            </span>
          )}
        </div>
        <h3 className="text-[13.5px] font-semibold uppercase tracking-bureau">{name}</h3>

        {item.customDesign && (
          <p className="mt-1 text-[11px] text-bureau-muted">
            {item.customDesign.parts.length}{' '}
            {locale === 'tr' ? 'parçadan oluşan konfigürasyon' : 'part configuration'}
          </p>
        )}

        {/* Adet kontrolü */}
        <div className="mt-3 flex items-center gap-3">
          <div className="flex items-center border border-bureau-black">
            <button
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              className="px-2.5 py-1 font-mono text-[12px] hover:bg-bureau-surface"
              aria-label="-"
            >
              −
            </button>
            <span className="min-w-[2rem] border-x border-bureau-black px-2 py-1 text-center font-mono text-[12px]">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              className="px-2.5 py-1 font-mono text-[12px] hover:bg-bureau-surface"
              aria-label="+"
            >
              +
            </button>
          </div>

          <button
            onClick={() => removeItem(item.id)}
            className="font-mono text-[10.5px] uppercase tracking-wide text-bureau-subtle hover:text-bureau-amber"
          >
            {locale === 'tr' ? 'Kaldır' : 'Remove'}
          </button>
        </div>
      </div>

      {/* Sağ: fiyat */}
      <div className="flex-shrink-0 text-right">
        <div className="font-mono text-[13px] font-semibold">
          {formatPrice(lineTotal, currency, intlLocale)}
        </div>
        {item.quantity > 1 && (
          <div className="mt-0.5 font-mono text-[10.5px] text-bureau-subtle">
            {formatPrice(unitPrice, currency, intlLocale)} × {item.quantity}
          </div>
        )}
      </div>
    </div>
  )
}
