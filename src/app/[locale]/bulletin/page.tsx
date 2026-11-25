import type { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import { getAllBulletins, getAllDropsWithProducts } from '@/lib/queries'
import { getLocalizedValue } from '@/lib/sanity'
import { DEMO_ENABLED, withDemoBulletins } from '@/lib/bulletinDemo'
import { bulletinRows } from '@/lib/bulletinRows'
import type { Bulletin } from '@/types'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ kind?: string }>
}

const KINDS = [
  { value: undefined, tr: 'Tümü', en: 'All' },
  { value: 'drop', tr: 'Drop', en: 'Drop' },
  { value: 'inventory', tr: 'Envanter', en: 'Inventory' },
  { value: 'bureau', tr: 'Büro', en: 'Bureau' },
  { value: 'notice', tr: 'Duyuru', en: 'Notice' },
] as const

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === 'tr' ? 'Büro Bülteni Arşivi' : 'Bureau Bulletin Archive',
    description:
      locale === 'tr'
        ? 'Ambience Bureau duyuruları: drop’lar, envanter, büro haberleri.'
        : 'Ambience Bureau announcements: drops, inventory and bureau news.',
    alternates: {
      canonical: `/${locale}/bulletin`,
      languages: { tr: '/tr/bulletin', en: '/en/bulletin' },
    },
  }
}

/**
 * Bülten arşivi — tüm duyurular resmi bir kayıt defteri gibi listelenir
 * (no, tarih, tür, başlık, metin). ?kind= ile türe göre süzülür.
 */
export default async function BulletinArchivePage({ params, searchParams }: Props) {
  const { locale } = await params
  const { kind } = await searchParams
  const tr = locale === 'tr'
  const intl = tr ? 'tr-TR' : 'en-US'

  // Demo drop özeti SADECE local önizlemede gerekir (bkz. lib/bulletinDemo.ts).
  const demoDrops = DEMO_ENABLED
    ? ((await getAllDropsWithProducts()) as Array<{
        dropNo: string
        name: Bulletin['title']
        plannedQuantity?: number | null
        dropState: string
        scheduledAt?: string | null
        soldCount: number
      }>).map((d) => ({
        dropNo: d.dropNo,
        name: d.name,
        plannedQuantity: d.plannedQuantity,
        active: d.dropState === 'live',
        scheduledAt: d.scheduledAt ?? null,
        soldCount: d.soldCount,
      }))
    : []
  const all = withDemoBulletins((await getAllBulletins()) as Bulletin[], demoDrops)
  const list = kind ? all.filter((b) => b.kind === kind) : all
  const kindLabel = (k: string) => {
    const f = KINDS.find((x) => x.value === k)
    return f ? (tr ? f.tr : f.en) : k
  }

  return (
    <div className="border-t border-bureau-line-header dark:border-[rgb(var(--bureau-line-header))]">
      <header className="border-b border-bureau-rule px-5 pb-6 pt-8 md:px-9 md:pt-12">
        <p className="font-mono text-[10.5px] uppercase tracking-widest text-bureau-muted">
          {tr ? 'Form 003 · Bülten Defteri' : 'Form 003 · Bulletin Ledger'}
        </p>
        <h1 className="mt-3 text-[36px] font-semibold leading-none tracking-[-0.03em] text-bureau-black md:text-[64px]">
          {tr ? 'Büro Bülteni' : 'Bureau Bulletin'}
        </h1>
        <p className="mt-4 max-w-[56ch] text-[15px] leading-relaxed text-bureau-muted">
          {tr
            ? 'Büronun yayımladığı tüm duyurular, yeniden eskiye. Drop tarihleri, envanter açılışları ve büro haberleri burada kayıt altındadır.'
            : 'Every announcement the bureau has issued, newest first. Drop dates, inventory openings and bureau news are kept on record here.'}
        </p>
      </header>

      <nav
        aria-label={tr ? 'Türe göre süz' : 'Filter by kind'}
        className="flex flex-wrap items-center justify-between gap-3 border-b border-bureau-rule px-5 py-2 md:px-9"
      >
        <div className="flex flex-wrap gap-1.5">
          {KINDS.map((k) => {
            const active = (kind ?? undefined) === k.value
            return (
              <Link
                key={k.tr}
                href={k.value ? `/bulletin?kind=${k.value}` : '/bulletin'}
                aria-current={active ? 'page' : undefined}
                className={`focus-bureau border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider no-underline transition-colors ${
                  active
                    ? 'border-bureau-black bg-bureau-black text-bureau-white'
                    : 'border-bureau-rule text-bureau-muted hover:border-bureau-black hover:text-bureau-black'
                }`}
              >
                {tr ? k.tr : k.en}
              </Link>
            )
          })}
        </div>
        <span className="font-mono text-[10px] tabular-nums text-bureau-muted">
          {tr ? 'Kayıtlı bülten' : 'Bulletins on record'}: <span className="text-bureau-amber">{list.length}</span>
        </span>
      </nav>

      {list.length === 0 ? (
        <div className="flex h-48 items-center justify-center px-5">
          <span className="-rotate-3 border-2 border-bureau-amber px-4 py-2 font-mono text-[12px] font-semibold uppercase tracking-widest text-bureau-amber">
            {tr ? 'Henüz bülten yayımlanmadı' : 'No bulletins issued yet'}
          </span>
        </div>
      ) : (
        <ol className="divide-y divide-bureau-rule">
          {list.map((b) => {
            const title = getLocalizedValue(b.title, locale, '—')
            const text = getLocalizedValue(b.text, locale, '')
            const date = new Date(b.publishedAt).toLocaleDateString(intl, {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })
            return (
              <li
                key={b._id}
                className="grid gap-2 px-5 py-6 md:grid-cols-[140px_120px_minmax(0,1fr)_auto] md:items-baseline md:gap-6 md:px-9"
              >
                <span className="font-mono text-[11px] uppercase tabular-nums tracking-wider text-bureau-muted">
                  {tr ? 'Bülten' : 'Bulletin'} {String(b.bulletinNo).padStart(3, '0')}
                </span>
                <span className="font-mono text-[11px] tabular-nums text-bureau-muted">
                  {date} · <span className="text-bureau-amber">{kindLabel(b.kind)}</span>
                </span>
                <div>
                  <h2 className="text-[19px] font-semibold leading-snug tracking-[-0.01em] text-bureau-black md:text-[22px]">
                    {title}
                  </h2>
                  {text && <p className="mt-1.5 max-w-[70ch] text-[14px] leading-relaxed text-bureau-muted">{text}</p>}
                  {(() => {
                    const rows = bulletinRows(b, locale)
                    if (rows.length === 0) return null
                    return (
                      <dl className="mt-3 grid max-w-[640px] grid-cols-[140px_minmax(0,1fr)] border-t border-dashed border-bureau-rule">
                        {rows.map((r, i) => (
                          <div key={`${r.k}-${i}`} className="contents">
                            <dt className="border-b border-dashed border-bureau-rule py-2 font-mono text-[10.5px] uppercase tracking-wider text-bureau-muted">
                              {r.k}
                            </dt>
                            <dd className="border-b border-dashed border-bureau-rule py-2 font-mono text-[12px] tabular-nums text-bureau-black">
                              {r.href ? (
                                <Link href={`/${r.href}`} className="focus-bureau underline decoration-bureau-rule underline-offset-4 hover:decoration-bureau-amber">
                                  {r.v}
                                </Link>
                              ) : (
                                r.v
                              )}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    )
                  })()}
                </div>
                {b.href ? (
                  <Link href={b.href} className="btn-file focus-bureau !px-3 !py-2 md:self-center">
                    <span>{tr ? 'Ayrıntı' : 'Details'} →</span>
                  </Link>
                ) : (
                  <span aria-hidden="true" />
                )}
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
