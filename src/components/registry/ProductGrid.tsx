'use client'

import { useTranslations } from 'next-intl'
import { ProductCard } from './ProductCard'
import type { ProductCard as ProductCardType } from '@/types'

export function ProductGrid({ products }: { products: ProductCardType[] }) {
  const t = useTranslations('registry')

  if (products.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center border border-bureau-black">
        <p className="font-mono text-[12px] uppercase tracking-wide text-bureau-muted">
          {t('noResults')}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 border-t border-l border-bureau-black sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  )
}
