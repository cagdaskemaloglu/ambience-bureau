'use client'

import { useTranslations } from 'next-intl'
import { ProductCard } from '@/components/registry/ProductCard'
import type { ProductCard as ProductCardType } from '@/types'

export function RelatedProducts({ products }: { products: ProductCardType[] }) {
  const t = useTranslations('registry')

  if (products.length === 0) return null

  return (
    <section className="border-t border-bureau-black">
      <div className="px-9 py-7">
        <div className="label-mono mb-1">{t('section')}</div>
        <h2 className="text-[20px] font-light uppercase tracking-wide">
          Related Objects
        </h2>
      </div>
      <div className="grid grid-cols-1 border-t border-l border-bureau-black sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  )
}
