import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { getAllDropsWithProducts, getAllProducts, getPanelBulletins, getStandingInventory } from '@/lib/queries'
import { withDemoBulletins, withDemoStanding } from '@/lib/bulletinDemo'
import { getLocalizedValue } from '@/lib/sanity'
import { DropRow } from '@/components/registry/DropRow'
import { UpcomingDropRow } from '@/components/registry/UpcomingDropRow'
import { HomeMasthead, buildLiveRows, type BulletinData } from '@/components/home/HomeMasthead'
import { BulletinPanel } from '@/components/home/BulletinPanel'
import { SectionHeading } from '@/components/home/SectionHeading'
import { StandingInventory } from '@/components/home/StandingInventory'
import { CustomAllocationBand, ControlProtocolBand } from '@/components/home/HomeBands'
import { RegisterSection } from '@/components/home/RegisterSection'
import { SectionNav, type SectionLink } from '@/components/home/SectionNav'
import { REGISTER_SECTION_ID } from '@/lib/registerFilter'
import type { Bulletin, DropWithProducts, ProductCard } from '@/types'

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
        ? 'Akıllı ve standart aydınlatma nesneleri: numaralı drop’lar ve sürekli satıştaki lambader, avize, aplik ve masa lambaları.'
        : 'Smart and standard lighting objects: numbered drops and an always-available range of floor lamps, chandeliers, wall sconces and table lamps.',
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

  const [allDropsRaw, standing, panelBulletins, allProductsRaw] = await Promise.all([
    getAllDropsWithProducts(),
    getStandingInventory(),
    getPanelBulletins(),
    getAllProducts(),
  ])

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

  const sections: SectionLink[] = [
    { id: 'sinirli-tahsis', number: '1', tr: 'Sınırlı Tahsis', en: 'Limited Allocation' },
    { id: 'daimi-envanter', number: '2', tr: 'Daimi Envanter', en: 'Standing Inventory' },
    { id: REGISTER_SECTION_ID, number: '3', tr: 'Tüm Kayıtlar', en: 'Full Register' },
    { id: 'ozel-tahsis', number: '4', tr: 'Özel Tahsis', en: 'Custom Allocation' },
    { id: 'kontrol-protokolu', number: '5', tr: 'Kontrol Protokolü', en: 'Control Protocol' },
  ]

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
    <div className="border-t border-bureau-line-header dark:border-black">
      <HomeMasthead locale={locale} bulletin={bulletin} bulletins={bulletins} />
      <SectionNav links={sections} locale={locale} />

      {/* §1 Sınırlı Tahsis */}
      <section aria-label={tr ? 'Sınırlı Tahsis' : 'Limited Allocation'}>
        <SectionHeading
          id="sinirli-tahsis"
          number="1"
          title={tr ? 'Sınırlı Tahsis' : 'Limited Allocation'}
          lede={
            tr
              ? 'Numaralı ve sonlu drop’lar. Her adet bir seri numarası taşır; drop kapandığında aynı nesne bir daha üretilmez.'
              : 'Numbered, finite drops. Every unit carries a serial number; once a drop closes, the same object is never made again.'
          }
          meta={
            tr
              ? `${visibleDrops.length} drop kayıtlı`
              : `${visibleDrops.length} ${visibleDrops.length === 1 ? 'drop' : 'drops'} on record`
          }
        />
        {visibleDrops.length === 0 ? (
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
        )}
      </section>

      {/* Telefonda Büro Bülteni burada (masaüstünde masthead'de) — ürünler ilk ekrana yaklaşsın. */}
      <div className="border-b border-bureau-rule px-5 py-6 md:hidden">
        <BulletinPanel
          locale={locale}
          today={new Date().toLocaleDateString(tr ? 'tr-TR' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          liveRows={buildLiveRows(locale, bulletin)}
          bulletins={bulletins}
        />
      </div>

      {/* §2 Daimi Envanter */}
      <section aria-label={tr ? 'Daimi Envanter' : 'Standing Inventory'}>
        <SectionHeading
          id="daimi-envanter"
          number="2"
          title={tr ? 'Daimi Envanter' : 'Standing Inventory'}
          lede={
            tr
              ? 'Sürekli satıştaki aydınlatma nesneleri, sınıflarına göre dosyalanmıştır: lambader, avize, aplik, masa lambası ve sarkıt.'
              : 'Lighting objects that are always available, filed by class: floor lamps, chandeliers, wall sconces, table lamps and pendants.'
          }
          meta={
            standingProducts.length > 0
              ? tr
                ? `${standingProducts.length} kayıt`
                : `${standingProducts.length} records`
              : tr
                ? 'Kayıt açılıyor'
                : 'Registration opening'
          }
        />
        <StandingInventory products={standingProducts} locale={locale} />
      </section>

      {/* §3 Tüm Kayıtlar — tüm ürünler, sayfadan ayrılmadan */}
      <section aria-label={tr ? 'Tüm Kayıtlar' : 'Full Register'}>
        <SectionHeading
          id={REGISTER_SECTION_ID}
          number="3"
          title={tr ? 'Tüm Kayıtlar' : 'Full Register'}
          lede={
            tr
              ? 'Sicildeki bütün nesneler tek dosyada: drop parçaları ve daimi envanter. Rejime, sınıfa ve fiyata göre süzün.'
              : 'Every object on the register in one file: drop pieces and standing inventory. Filter by regime, class and price.'
          }
          meta={tr ? `${registerProducts.length} kayıt` : `${registerProducts.length} records`}
        />
        <RegisterSection products={registerProducts} locale={locale} />
      </section>

      {/* §4 Özel Tahsis */}
      <section aria-label={tr ? 'Özel Tahsis' : 'Custom Allocation'}>
        <SectionHeading id="ozel-tahsis" number="4" title={tr ? 'Özel Tahsis' : 'Custom Allocation'} />
        <CustomAllocationBand locale={locale} />
      </section>

      {/* §5 Kontrol Protokolü */}
      <section aria-label={tr ? 'Kontrol Protokolü' : 'Control Protocol'} className="pb-6">
        <SectionHeading id="kontrol-protokolu" number="5" title={tr ? 'Kontrol Protokolü' : 'Control Protocol'} />
        <ControlProtocolBand locale={locale} />
      </section>
    </div>
  )
}
