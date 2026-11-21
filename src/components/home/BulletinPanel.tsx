'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from '@/i18n/navigation'
import { getLocalizedValue } from '@/lib/sanity'
import { bulletinRows, type InfoRow } from '@/lib/bulletinRows'
import type { Bulletin } from '@/types'

/** Canlı durum satırı — bülten satırlarıyla aynı biçim. */
export type LiveRow = InfoRow

/** Etiket → değer satırları; canlı durum ve bülten sayfaları AYNI düzeni kullanır. */
function InfoRows({ rows }: { rows: InfoRow[] }) {
  return (
    <dl className="divide-y divide-dashed divide-bureau-rule">
      {rows.map((r, i) => (
        <div key={`${r.k}-${i}`} className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 px-4 py-2">
          <dt className="font-mono text-[10.5px] uppercase tracking-wider text-bureau-muted">{r.k}</dt>
          <dd className="font-mono text-[12px] tabular-nums text-bureau-black">
            {r.href ? (
              <a
                href={r.href}
                className="focus-bureau underline decoration-bureau-rule underline-offset-4 hover:decoration-bureau-amber"
              >
                {r.v}
              </a>
            ) : (
              r.v
            )}
          </dd>
        </div>
      ))}
    </dl>
  )
}

const KIND_LABEL: Record<string, { tr: string; en: string }> = {
  drop: { tr: 'Drop', en: 'Drop' },
  inventory: { tr: 'Envanter', en: 'Inventory' },
  bureau: { tr: 'Büro', en: 'Bureau' },
  notice: { tr: 'Duyuru', en: 'Notice' },
}

const AUTO_ADVANCE_MS = 7000

/**
 * Büro Bülteni — anasayfa masthead'indeki duyuru paneli.
 * Sayfa 1: canlı tahsis durumu (veriden otomatik). Sonraki sayfalar:
 * Sanity'deki "Bülten" kayıtları (sabitlenenler önce). Sayfa geçişi
 * dosya kartı gibi kayar; otomatik ilerleme yavaştır, panelin üstüne
 * gelince/odaklanınca durur, kullanıcı bir kez gezinince tamamen kapanır
 * ve "hareketi azalt" ayarında hiç çalışmaz.
 */
export function BulletinPanel({
  locale,
  today,
  liveRows,
  bulletins,
}: {
  locale: string
  today: string
  liveRows: LiveRow[]
  bulletins: Bulletin[]
}) {
  const tr = locale === 'tr'
  const intl = tr ? 'tr-TR' : 'en-US'
  const pageCount = 1 + bulletins.length
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [userNavigated, setUserNavigated] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const regionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const onChange = () => setReducedMotion(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (pageCount < 2 || paused || userNavigated || reducedMotion) return
    const id = window.setTimeout(() => setIndex((i) => (i + 1) % pageCount), AUTO_ADVANCE_MS)
    return () => window.clearTimeout(id)
  }, [index, pageCount, paused, userNavigated, reducedMotion])

  const go = useCallback(
    (delta: number) => {
      setUserNavigated(true)
      setIndex((i) => (i + delta + pageCount) % pageCount)
    },
    [pageCount]
  )

  const pad = (n: number) => String(n).padStart(2, '0')
  const current = index === 0 ? null : bulletins[index - 1]
  const currentRows = current ? bulletinRows(current, locale) : []

  return (
    <aside
      ref={regionRef}
      aria-roledescription={tr ? 'bülten panosu' : 'bulletin board'}
      aria-label={tr ? 'Büro bülteni' : 'Bureau bulletin'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!regionRef.current?.contains(e.relatedTarget as Node)) setPaused(false)
      }}
      onKeyDown={(e) => {
        if (pageCount < 2) return
        if (e.key === 'ArrowRight') go(1)
        if (e.key === 'ArrowLeft') go(-1)
      }}
      className="border border-bureau-black bg-bureau-surface/60"
    >
      {/* Başlık + gezinme */}
      <div className="flex items-center justify-between border-b border-bureau-black px-4 py-2">
        <span className="font-mono text-[10.5px] uppercase tracking-widest text-bureau-black">
          {tr ? 'Büro Bülteni' : 'Bureau Bulletin'}
        </span>
        {pageCount > 1 && (
          <div className="flex items-center gap-1 font-mono text-[11px] tabular-nums text-bureau-muted">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label={tr ? 'Önceki bülten' : 'Previous bulletin'}
              className="focus-bureau flex h-7 w-7 items-center justify-center border border-transparent transition-colors hover:border-bureau-black hover:bg-bureau-black hover:text-bureau-white"
            >
              ‹
            </button>
            <span aria-live="polite" className="min-w-[46px] text-center">
              {pad(index + 1)} / {pad(pageCount)}
            </span>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label={tr ? 'Sonraki bülten' : 'Next bulletin'}
              className="focus-bureau flex h-7 w-7 items-center justify-center border border-transparent transition-colors hover:border-bureau-black hover:bg-bureau-black hover:text-bureau-white"
            >
              ›
            </button>
          </div>
        )}
      </div>

      {/* Sayfa — sabit minimum yükseklik: sayfa değişince düzen zıplamasın */}
      <div className="min-h-[232px] overflow-hidden">
        <div key={index} className="animate-drawer-in">
          {current === null ? (
            <>
              <p className="flex items-center gap-2 px-4 pb-1 pt-3 font-mono text-[10.5px] tabular-nums text-bureau-muted">
                <span aria-hidden="true" className="bureau-lamp h-[7px] w-[7px] rounded-full bg-bureau-amber" />
                {tr ? 'Büro açık' : 'Bureau open'} · {today}
              </p>
              <InfoRows rows={liveRows} />
            </>
          ) : (
            <article className="flex min-h-[232px] flex-col">
              <div className="px-4 pt-3">
                <p className="font-mono text-[10.5px] uppercase tabular-nums tracking-wider text-bureau-muted">
                  {tr ? 'Bülten' : 'Bulletin'} {String(current.bulletinNo).padStart(3, '0')} ·{' '}
                  <span className="text-bureau-amber">{KIND_LABEL[current.kind]?.[tr ? 'tr' : 'en'] ?? current.kind}</span> ·{' '}
                  {new Date(current.publishedAt).toLocaleDateString(intl, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  {current.pinned && <span className="ml-1">· {tr ? 'Sabit' : 'Pinned'}</span>}
                </p>
                <h2 className="mt-1.5 text-[16px] font-semibold leading-tight tracking-[-0.01em] text-bureau-black">
                  {getLocalizedValue(current.title, locale, '—')}
                </h2>
                {current.text && (
                  <p className="mt-1.5 text-[13px] leading-relaxed text-bureau-muted">
                    {getLocalizedValue(current.text, locale, '')}
                  </p>
                )}
              </div>
              {currentRows.length > 0 && (
                <div className="mt-2 border-t border-dashed border-bureau-rule">
                  <InfoRows rows={currentRows} />
                </div>
              )}
              {current.href && (
                <div className="mt-auto px-4 pb-3 pt-3">
                  {current.href.startsWith('/#') ? (
                    <a href={current.href.slice(1)} className="btn-file focus-bureau !px-3 !py-2">
                      <span>{tr ? 'Ayrıntı' : 'Details'} →</span>
                    </a>
                  ) : (
                    <Link href={current.href} className="btn-file focus-bureau !px-3 !py-2">
                      <span>{tr ? 'Ayrıntı' : 'Details'} →</span>
                    </Link>
                  )}
                </div>
              )}
            </article>
          )}
        </div>
      </div>

      {/* Alt şerit: sayfa göstergesi + arşiv */}
      <div className="flex items-center justify-between gap-4 border-t border-bureau-black px-4 py-2.5">
        {pageCount > 1 ? (
          <div className="flex flex-1 gap-1" aria-hidden="true">
            {Array.from({ length: pageCount }).map((_, i) => (
              <span
                key={i}
                className={`h-[2px] flex-1 transition-colors ${i === index ? 'bg-bureau-amber' : 'bg-bureau-rule'}`}
              />
            ))}
          </div>
        ) : (
          <span className="font-mono text-[10px] uppercase tracking-wider text-bureau-subtle">
            {tr ? 'Her nesne sicile işlenir.' : 'Every object is registered.'}
          </span>
        )}
        <Link
          href="/bulletin"
          className="nav-underline focus-bureau whitespace-nowrap py-1 font-mono text-[10.5px] uppercase tracking-wider text-bureau-black no-underline"
        >
          {tr ? 'Tüm bültenler' : 'All bulletins'} →
        </Link>
      </div>
    </aside>
  )
}
