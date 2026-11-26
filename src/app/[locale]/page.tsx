import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { getAllDropsWithProducts, getAllLampCollections, getAllProducts, getHeroWireframes, getModelStandingCards, getPanelBulletins, getStandingInventory } from '@/lib/queries'
import { withDemoBulletins, withDemoStanding } from '@/lib/bulletinDemo'
import { getLocalizedValue } from '@/lib/sanity'
import { DropRow } from '@/components/registry/DropRow'
import { UpcomingDropRow } from '@/components/registry/UpcomingDropRow'
import { MastheadIntro, buildLiveRows, type BulletinData } from '@/components/home/HomeMasthead'
import { HeroWireframe } from '@/components/home/HeroWireframe'
import { BulletinPanel } from '@/components/home/BulletinPanel'
import { HomeIndex } from '@/components/home/HomeIndex'
import { RegisterSection } from '@/components/home/RegisterSection'
import type { Bulletin, Collection, DropWithProducts, ProductCard } from '@/types'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'home' })

  return {
    // absolute: layout'taki "%s — The Ambience Bureau" şablonu başlığı ikilemesin.
    title: { absolute: locale === 'tr' ? 'The Ambience Bureau: Işık Tahsis Bürosu' : 'The Ambience Bureau: Bureau of Light Allocation' },
    description:
      locale === 'tr'
        ? 'Akıllı ve standart aydınlatma nesneleri: numaralı drop’lar ve sürekli satıştaki lambader, sarkıt, aplik ve masa lambaları.'
        : 'Smart and standard lighting objects: numbered drops and an always-available range of floor lamps, pendants, wall sconces and table lamps.',
    alternates: {
      canonical: `/${locale}`,
      languages: { tr: '/tr', en: '/en' },
    },
  }
}

/**
 * Anasayfa = Tahsis Bülteni (bkz. claude/DESIGN.md → "Anasayfa düzeni"):
 * Masthead → (yapışkan bölüm çubuğu) → §1 Sınırlı Tahsis (drop'lar) →
 * §2 Daimi Envanter (sınıf indeksi) → §3 Tüm Kayıtlar (tüm ürünler,
 * sayfa içi süzgeç) → §4 Özel Tahsis → §5 Kontrol Protokolü.
 * Tek sayfa: ziyaretçi tüm ürünleri anasayfadan ayrılmadan keşfeder.
 */
export default async function HomePage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'home' })
  const tr = locale === 'tr'

  const [allDropsRaw, standingDocs, panelBulletins, allProductsRaw, modelCards, heroWireframe, lampCollections] = await Promise.all([
    getAllDropsWithProducts(),
    getStandingInventory(),
    getPanelBulletins(),
    getAllProducts(),
    getModelStandingCards(),
    getHeroWireframes().catch(() => []),
    getAllLampCollections().catch(() => []) as Promise<Collection[]>,
  ])
  // Daimi Envanter = ürün belgeleri + Montajlı Modellerden otomatik kartlar.
  const standing = [...(standingDocs as ProductCard[]), ...modelCards]

  const allDrops = allDropsRaw as Array<
    DropWithProducts & { dropState: 'live' | 'upcoming'; scheduledAt?: string | null }
  >
  // (Demo/yer tutucular SADECE local önizlemede — bkz. lib/bulletinDemo.ts)
  const standingProducts = withDemoStanding(
    standing as ProductCard[],
    allDrops.flatMap((d) => d.products)
  )
  // §3 Tüm Kayıtlar: gerçek ürünler + (sadece local demo'da) yer tutucular.
  const realProducts = allProductsRaw as ProductCard[]
  const realIds = new Set(realProducts.map((p) => p._id))
  const registerProducts = [...realProducts, ...standingProducts.filter((p) => !realIds.has(p._id))]


  // Yayında olan drop'lar (ürünü olanlar) + zamanlanmış "yakında" drop'lar,
  // sortOrder sırasıyla tek listede. Ürünü olmayan CANLI drop'lar boş satır
  // olmasın diye elenir; "yakında" drop'ların ürünü zaten bilerek boştur.
  const visibleDrops = allDrops.filter((d) => d.dropState === 'upcoming' || d.products.length > 0)

  const bulletins = withDemoBulletins(
    panelBulletins as Bulletin[],
    visibleDrops.map((d) => ({
      dropNo: d.dropNo,
      name: d.name,
      plannedQuantity: d.plannedQuantity,
      active: d.dropState === 'live',
      scheduledAt: d.scheduledAt ?? null,
      soldCount: d.soldCount,
    }))
  )

  const live = visibleDrops.find((d) => d.dropState === 'live')
  const featureDrop = live ?? visibleDrops[0] ?? null
  const next = visibleDrops.find((d) => d.dropState === 'upcoming' && d.scheduledAt)
  const bulletin: BulletinData = {
    liveDrop: live
      ? {
          dropNo: live.dropNo,
          name: getLocalizedValue(live.name, locale, '') ?? '',
          planned: typeof live.plannedQuantity === 'number' ? live.plannedQuantity : null,
          remaining:
            typeof live.plannedQuantity === 'number' ? Math.max(0, live.plannedQuantity - live.soldCount) : null,
        }
      : null,
    nextDrop:
      next && next.scheduledAt
        ? { dropNo: next.dropNo, name: getLocalizedValue(next.name, locale, '') ?? '', scheduledAt: next.scheduledAt }
        : null,
    standingCount: standingProducts.length,
    standingClassCount: new Set(standingProducts.map((p) => p.category)).size,
  }

  return (
    <div className="border-t border-bureau-line-header dark:border-[rgb(var(--bureau-line-header))]">
      {/* İlk ekran (tek sayfalık "header") + açılan dizin panelleri: HomeIndex.
          3B tel kafes sahnesi ilk ekranın tamamına yayılır; dizin menüsü
          (A Drops · S Lambader · D Aplik · F Masa Lambası · G Sarkıt) içindedir. */}
        <HomeIndex
          intro={<MastheadIntro locale={locale} />}
          registerProducts={registerProducts}
          collections={lampCollections}
          registerContent={<RegisterSection products={registerProducts} locale={locale} />}
          side={
            <BulletinPanel
              locale={locale}
              today={new Date().toLocaleDateString(tr ? 'tr-TR' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              liveRows={buildLiveRows(locale, bulletin)}
              bulletins={bulletins}
            />
          }
          background={heroWireframe.length > 0 ? <HeroWireframe items={heroWireframe} locale={locale} /> : undefined}
          products={standingProducts}
          dropProducts={[
            ...(featureDrop?.products ?? []),
            ...visibleDrops.filter((d) => d !== featureDrop).flatMap((d) => d.products),
          ]}
          locale={locale}
          drops={{
            count: visibleDrops.length,
            feature: featureDrop
              ? {
                  dropNo: featureDrop.dropNo,
                  name: getLocalizedValue(featureDrop.name, locale, '') ?? '',
                  image: featureDrop.products.find((p) => p.image?.asset?.url)?.image ?? null,
                  planned: typeof featureDrop.plannedQuantity === 'number' ? featureDrop.plannedQuantity : null,
                  remaining:
                    typeof featureDrop.plannedQuantity === 'number'
                      ? Math.max(0, featureDrop.plannedQuantity - featureDrop.soldCount)
                      : null,
                  live: featureDrop.dropState === 'live',
                }
              : null,
          }}
          dropsContent={
            visibleDrops.length === 0 ? (
              <div className="flex h-40 items-center justify-center">
                <p className="font-mono text-[12px] uppercase tracking-wide text-bureau-muted">{t('noDrops')}</p>
              </div>
            ) : (
              visibleDrops.map((drop, i) => {
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
              })
            )
          }
        />

    </div>
  )
}
