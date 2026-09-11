import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { getAllDropsWithProducts } from '@/lib/queries'
import { DropRow } from '@/components/registry/DropRow'
import type { DropWithProducts } from '@/types'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'home' })

  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: `/${locale}`,
      languages: { tr: '/tr', en: '/en' },
    },
  }
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'home' })

  const drops: DropWithProducts[] = await getAllDropsWithProducts()
  // Hiç ürünü olmayan (veya ürünleri henüz Drop'a atanmamış) drop'lar
  // anasayfada boş bir satır olarak görünmesin diye elenir.
  const dropsWithProducts = drops.filter((d) => d.products.length > 0)

  if (dropsWithProducts.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center border-t border-bureau-black">
        <p className="font-mono text-[12px] uppercase tracking-wide text-bureau-muted">{t('noDrops')}</p>
      </div>
    )
  }

  return (
    <div className="border-t border-bureau-black">
      {dropsWithProducts.map((drop) => (
        <DropRow key={drop._id} drop={drop} />
      ))}
    </div>
  )
}