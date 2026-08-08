'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { useCartStore } from '@/lib/store/cart'
import { getLocalizedValue } from '@/lib/sanity'
import type { ProductCard as ProductCardType } from '@/types'

// Mobil breakpoint — 1024px (Tailwind lg). AddToCartButton.tsx'teki ile
// aynı davranış: mobilde sepete ekleyince doğrudan /cart'a yönlendir
// (satın alma niyetini anında sonuca bağlamak için), masaüstünde ise
// sepet drawer'ını aç.
function isMobile() {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 1024
}

export function AddToCartMini({ product }: { product: ProductCardType }) {
  const t = useTranslations('product')
  const locale = useLocale()
  const router = useRouter()
  const addItem = useCartStore((s) => s.addItem)
  const openDrawer = useCartStore((s) => s.openDrawer)
  const [justAdded, setJustAdded] = useState(false)

  const isDecommissioned = product.status === 'decommissioned'

  function handleAddToCart(e: React.MouseEvent) {
    // Kart tamamen bir <Link> — bu butona tıklamanın ürün detay
    // sayfasına yönlendirmeyi TETİKLEMEMESİ gerekiyor.
    e.preventDefault()
    e.stopPropagation()

    if (isDecommissioned || justAdded) return

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

  if (isDecommissioned) return null

  return (
    <button
      onClick={handleAddToCart}
      className="mt-1.5 w-full border border-bureau-black py-1.5 font-mono text-[9px] uppercase tracking-wide text-bureau-black transition-colors hover:bg-bureau-black hover:text-white"
    >
      {justAdded ? '✓ ' + (locale === 'tr' ? 'Eklendi' : 'Added') : t('addToCart')}
    </button>
  )
}
