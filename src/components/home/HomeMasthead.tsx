import { Link } from '@/i18n/navigation'
import { BulletinPanel, type LiveRow } from './BulletinPanel'
import type { Bulletin } from '@/types'
import type { HeroWireframeData } from '@/lib/queries'
import { HeroWireframe } from './HeroWireframe'

export interface BulletinData {
  /** Yayındaki ilk drop (yoksa null). */
  liveDrop: { dropNo: string; name: string; remaining: number | null; planned: number | null } | null
  /** Zamanlanmış ilk "yakında" drop (yoksa null). */
  nextDrop: { dropNo: string; name: string; scheduledAt: string } | null
  standingCount: number
  standingClassCount: number
}

/**
 * Anasayfa masthead'i: sitenin TEK <h1>'i + bir cümlelik "ne satıyoruz"
 * açıklaması + sağda Büro Bülteni (canlı tahsis durumu). Ziyaretçi 3
 * saniyede bunların lamba olduğunu anlamalı (bkz. claude/DESIGN.md).
 */
export function HomeMasthead({
  locale,
  bulletin,
  bulletins,
  wireframe,
}: {
  locale: string
  bulletin: BulletinData
  bulletins: Bulletin[]
  /** Ortadaki 3B tel kafes (yoksa iki sütunlu eski düzen). */
  wireframe?: HeroWireframeData | null
}) {
  const tr = locale === 'tr'
  const intl = tr ? 'tr-TR' : 'en-US'
  const today = new Date().toLocaleDateString(intl, { day: '2-digit', month: '2-digit', year: 'numeric' })
  const fmt = (n: number) => n.toLocaleString(intl)

  const rows = buildLiveRows(locale, bulletin)

  return (
    <section
      aria-labelledby="home-title"
      className={`grid items-center gap-5 border-b border-bureau-rule px-5 py-5 md:min-h-[300px] md:grid-cols-[minmax(0,1fr)_360px] md:gap-10 md:px-9 md:py-8 lg:min-h-[360px] ${
        wireframe ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)_340px] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_360px]' : ''
      }`}
    >
      {/* Kompakt masthead: ziyaretçi ilk ekranda ürünleri de görebilsin
          diye başlık tek satır, bölüm butonları yapışkan çubukta (SectionNav). */}
      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-bureau-muted">
          {tr ? 'Form 001 · Genel Tahsis Bülteni' : 'Form 001 · General Allocation Bulletin'}
        </p>
        <h1
          id="home-title"
          className="mt-1 text-[34px] font-semibold leading-[0.95] tracking-[-0.04em] text-bureau-black sm:text-[42px] lg:text-[48px] xl:text-[54px]"
        >
          {tr ? (
            <>
              Işık, tahsis <span className="text-bureau-amber">edilir.</span>
            </>
          ) : (
            <>
              Light is <span className="text-bureau-amber">allocated.</span>
            </>
          )}
        </h1>
        <p className="mt-3 max-w-[82ch] text-[13px] leading-relaxed text-bureau-muted md:text-[14px]">
          {tr
            ? 'Ambience Bureau, akıllı ve standart aydınlatma nesneleri üretir. Koleksiyon parçaları numaralı drop’larla sınırlı sayıda tahsis edilir; lambader, sarkıt, aplik ve masa lambaları daimi envanterde sürekli satıştadır.'
            : 'Ambience Bureau makes smart and standard lighting objects. Collection pieces are allocated in numbered, limited drops; floor lamps, pendants, wall sconces and table lamps are held in standing inventory, always available.'}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
          <Link href="/custom-registry" className="btn-file btn-file-amber focus-bureau !py-2">
            <span>{tr ? 'Kendi lambanı tasarla' : 'Design your own lamp'}</span>
          </Link>
          <a
            href="#tum-kayitlar"
            className="nav-underline focus-bureau py-1 font-mono text-[11px] uppercase tracking-wider text-bureau-black no-underline"
          >
            {tr ? 'Tüm kayıtları incele' : 'Browse the full register'} ↓
          </a>
        </div>
      </div>

      {wireframe && <HeroWireframe data={wireframe} locale={locale} />}

      {/* Büro Bülteni — masaüstünde masthead'de; telefonda §1'in altında
          (page.tsx), böylece telefonda da ürünler ilk ekrana yaklaşır. */}
      <div className="hidden md:block">
        <BulletinPanel locale={locale} today={today} liveRows={rows} bulletins={bulletins} />
      </div>
    </section>
  )
}

/** Büro Bülteni'nin 1. sayfası (canlı durum) satırları — masthead ve mobil panel ortak. */
export function buildLiveRows(locale: string, bulletin: BulletinData): LiveRow[] {
  const tr = locale === 'tr'
  const intl = tr ? 'tr-TR' : 'en-US'
  const fmt = (n: number) => n.toLocaleString(intl)
  return [
    {
      k: tr ? 'Aktif tahsis' : 'Active allocation',
      v: bulletin.liveDrop ? `DROP-${bulletin.liveDrop.dropNo} · ${bulletin.liveDrop.name}` : '—',
      href: bulletin.liveDrop ? `#drop-${bulletin.liveDrop.dropNo}` : undefined,
    },
    {
      k: tr ? 'Kalan adet' : 'Units remaining',
      v:
        bulletin.liveDrop && bulletin.liveDrop.remaining !== null && bulletin.liveDrop.planned !== null
          ? `${fmt(bulletin.liveDrop.remaining)} / ${fmt(bulletin.liveDrop.planned)}`
          : '—',
    },
    {
      k: tr ? 'Sıradaki drop' : 'Next drop',
      v: bulletin.nextDrop
        ? `DROP-${bulletin.nextDrop.dropNo} · ${new Date(bulletin.nextDrop.scheduledAt).toLocaleDateString(intl, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}`
        : tr
          ? 'Duyurulmadı'
          : 'Not announced',
    },
    {
      k: tr ? 'Daimi envanter' : 'Standing inventory',
      v:
        bulletin.standingCount > 0
          ? tr
            ? `${fmt(bulletin.standingCount)} kayıt · ${bulletin.standingClassCount} sınıf`
            : `${fmt(bulletin.standingCount)} records · ${bulletin.standingClassCount} classes`
          : tr
            ? 'Kayıt açılıyor'
            : 'Registration opening',
      href: '#daimi-envanter',
    },
  ]
}
