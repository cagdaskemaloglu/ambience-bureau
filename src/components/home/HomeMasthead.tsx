import type { LiveRow } from './BulletinPanel'

export interface BulletinData {
  /** Yayındaki ilk drop (yoksa null). */
  liveDrop: { dropNo: string; name: string; remaining: number | null; planned: number | null } | null
  /** Zamanlanmış ilk "yakında" drop (yoksa null). */
  nextDrop: { dropNo: string; name: string; scheduledAt: string } | null
  standingCount: number
  standingClassCount: number
}

/**
 * İlk ekranın sol üstü: sitenin TEK <h1>'i + bir cümlelik "ne satıyoruz"
 * açıklaması + eylemler. Ziyaretçi 3 saniyede bunların lamba olduğunu
 * anlamalı (bkz. claude/DESIGN.md). Yerleşim HomeIndex'in ilk ekranında.
 */
export function MastheadIntro({ locale }: { locale: string }) {
  const tr = locale === 'tr'
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-bureau-muted">
        {tr ? 'Form 001 · Genel Tahsis Bülteni' : 'Form 001 · General Allocation Bulletin'}
      </p>
      <h1
        id="home-title"
        className="mt-1 text-[34px] font-semibold leading-[0.95] tracking-[-0.04em] text-bureau-black sm:text-[42px] lg:text-[46px] xl:text-[52px]"
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
      <p className="mt-3 max-w-[60ch] text-[13px] leading-relaxed text-bureau-muted md:text-[14px]">
        {tr
          ? 'Ambience Bureau, akıllı ve standart aydınlatma nesneleri üretir. Koleksiyon parçaları numaralı drop’larla sınırlı sayıda tahsis edilir; lambader, sarkıt, aplik ve masa lambaları daimi envanterde sürekli satıştadır.'
          : 'Ambience Bureau makes smart and standard lighting objects. Collection pieces are allocated in numbered, limited drops; floor lamps, pendants, wall sconces and table lamps are held in standing inventory, always available.'}
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
        <a href="#ozel-tahsis" className="btn-file btn-file-amber focus-bureau !px-8 !py-4 !text-[13px] md:!px-10 md:!py-5 md:!text-[14px]">
          <span>{tr ? 'Kendi lambanı tasarla' : 'Design your own lamp'}</span>
        </a>
        <a
          href="#tum-kayitlar"
          className="nav-underline focus-bureau py-1 font-mono text-[11px] uppercase tracking-wider text-bureau-black no-underline"
        >
          {tr ? 'Tüm kayıtları incele' : 'Browse the full register'} ↓
        </a>
      </div>
    </div>
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
