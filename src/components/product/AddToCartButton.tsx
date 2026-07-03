'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { useCartStore } from '@/lib/store/cart'
import { getLocalizedValue } from '@/lib/sanity'
import type { Product } from '@/types'

// Mobil breakpoint — 1024px (Tailwind lg)
function isMobile() {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 1024
}

export function AddToCartButton({ product }: { product: Product }) {
  const t = useTranslations('product')
  const locale = useLocale()
  const router = useRouter()
  const addItem = useCartStore((s) => s.addItem)
  const openDrawer = useCartStore((s) => s.openDrawer)
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

    if (isMobile()) {
      router.push('/cart')
    } else {
      openDrawer()
      setJustAdded(true)
      setTimeout(() => setJustAdded(false), 2000)
    }
  }

  if (isDecommissioned) {
    return (
      <button disabled className="btn-bureau-outline w-full cursor-not-allowed opacity-40">
        {t('outOfStock')}
      </button>
    )
  }

  return (
    <button onClick={handleAddToCart} className="btn-bureau w-full">
      {justAdded ? '✓ ' + (locale === 'tr' ? 'Sepete Eklendi' : 'Added') : t('addToCart')}
    </button>
  )
}