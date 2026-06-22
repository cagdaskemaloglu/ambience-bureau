'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useCartStore } from '@/lib/store/cart'
import { getLocalizedValue } from '@/lib/sanity'
import type { Product } from '@/types'

export function AddToCartButton({ product }: { product: Product }) {
  const t = useTranslations('product')
  const addItem = useCartStore((state) => state.addItem)
  const [justAdded, setJustAdded] = useState(false)

  const isDecommissioned = product.status === 'decommissioned'

  function handleAddToCart() {
    if (isDecommissioned) return

    addItem({
      id: product._id,
      type: 'product',
      registryNo: product.registryNo,
      name: {
        tr: getLocalizedValue(product.name, 'tr', '—') ?? '—',
        en: getLocalizedValue(product.name, 'en', '—') ?? '—',
      },
      priceTRY: product.priceTRY,
      priceUSD: product.priceUSD,
      quantity: 1,
    })

    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 2000)
  }

  if (isDecommissioned) {
    return (
      <button
        disabled
        className="btn-bureau-outline w-full cursor-not-allowed opacity-40"
      >
        {t('outOfStock')}
      </button>
    )
  }

  return (
    <button onClick={handleAddToCart} className="btn-bureau w-full">
      {justAdded ? '✓ Registered' : t('addToCart')}
    </button>
  )
}
