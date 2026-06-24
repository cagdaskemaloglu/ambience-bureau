'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useCartStore } from '@/lib/store/cart'
import { CartItemRow } from '@/components/cart/CartItemRow'
import { CartSummary } from '@/components/cart/CartSummary'
import { useEffect, useState } from 'react'

export default function CartPage() {
  const t = useTranslations('cart')
  const items = useCartStore((s) => s.items)

  // Hydration mismatch'i önlemek için: localStorage'dan gelen veri
  // server render'ı ile eşleşmeyebilir, mount sonrası gerçek veriyi göster.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <div className="px-6 py-9 sm:px-10">
      <div className="mb-6 border-b border-dashed border-bureau-rule pb-4">
        <div className="label-mono mb-1">FORM 220-C</div>
        <h1 className="text-[28px] font-light uppercase tracking-wide">{t('title')}</h1>
      </div>

      {!mounted ? null : items.length === 0 ? (
        <div className="border border-dashed border-bureau-rule p-10 text-center">
          <p className="font-mono text-[12px] uppercase tracking-wide text-bureau-subtle">
            {t('empty')}
          </p>
          <Link
            href="/registry"
            className="btn-bureau-outline mt-4 inline-block"
          >
            {t('continueShopping')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
          <div>
            {items.map((item) => (
              <CartItemRow key={item.id} item={item} />
            ))}
          </div>
          <div>
            <CartSummary />
          </div>
        </div>
      )}
    </div>
  )
}
