import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { getAllDropsWithProducts } from '@/lib/queries'
import { DropRow } from '@/components/registry/DropRow'
import { UpcomingDropRow } from '@/components/registry/UpcomingDropRow'
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

  // Yayında olan drop'lar (ürünü olanlar) + zamanlanmış "yakında" drop'lar,
  // sortOrder sırasıyla tek listede. Ürünü olmayan CANLI drop'lar boş satır
  // olmasın diye elenir; "yakında" drop'ların ürünü zaten bilerek boştur.
  const allDrops = (await getAllDropsWithProducts()) as Array<
    DropWithProducts & { dropState: 'live' | 'upcoming'; scheduledAt?: string | null }
  >
  const visibleDrops = allDrops.filter((d) => d.dropState === 'upcoming' || d.products.length > 0)

  if (visibleDrops.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center border-t border-bureau-line-header">
        <p className="font-mono text-[12px] uppercase tracking-wide text-bureau-muted">{t('noDrops')}</p>
      </div>
    )
  }

  return (
    <div className="border-t border-bureau-line-header">
      {visibleDrops.map((drop, i) => {
        const prevDrop = i > 0 ? visibleDrops[i - 1] : null
        const nextDrop = i < visibleDrops.length - 1 ? visibleDrops[i + 1] : null
        if (drop.dropState === 'upcoming' && drop.scheduledAt) {
          return (
            <UpcomingDropRow
              key={drop._id}
              drop={{
                _id: drop._id,
                dropNo: drop.dropNo,
                name: drop.name,
                scheduledAt: drop.scheduledAt,
                plannedQuantity: drop.plannedQuantity,
                totalCombinations: drop.totalCombinations,
              }}
              index={i}
              prevDrop={prevDrop}
              nextDrop={nextDrop}
            />
          )
        }
        return <DropRow key={drop._id} drop={drop} index={i} prevDrop={prevDrop} nextDrop={nextDrop} />
      })}
    </div>
  )
}
