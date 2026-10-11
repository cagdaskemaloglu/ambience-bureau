'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { getLocalizedValue } from '@/lib/sanity'
import { useAnimatedNumber } from '@/lib/useAnimatedNumber'
import { AnimatedCombinations, dropSectionId, type DropNavInfo } from './DropRow'
import type { LocalizedString } from '@/types'

const CARD_WIDTH = 263
const PLACEHOLDER_COUNT = 5

export interface UpcomingDrop {
  _id: string
  dropNo: string
  name: LocalizedString[]
  scheduledAt: string
  plannedQuantity?: number | null
  totalCombinations: number
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

/** Hedefe kalan süre (ms). SSR/hydration uyumu için ilk render'da null. */
function useRemainingMs(targetIso: string) {
  const [ms, setMs] = useState<number | null>(null)
  useEffect(() => {
    const target = new Date(targetIso).getTime()
    const tick = () => setMs(Math.max(0, target - Date.now()))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetIso])
  return ms
}

/**
 * Henüz yayınlanmamış (zamanlanmış) Drop'un anasayfa bölümü: ürün kartları
 * yerine "?" yer tutucular, panelde geri sayım + çıkacak adet + kombinasyon
 * sayısı. Süre dolunca sunucudan taze veri çekilir (router.refresh) — Drop
 * gerçek DropRow'a dönüşür.
 */
export function UpcomingDropRow({
  drop,
  index,
  prevDrop,
  nextDrop,
}: {
  drop: UpcomingDrop
  index: number
  prevDrop?: DropNavInfo | null
  nextDrop?: DropNavInfo | null
}) {
  const locale = useLocale()
  const tr = locale === 'tr'
  const router = useRouter()
  const name = getLocalizedValue(drop.name, locale, '—')
  const panelOnLeft = index % 2 === 1
  const remaining = useRemainingMs(drop.scheduledAt)

  // Süre dolunca: sayfayı yenile; Drop henüz canlı görünmüyorsa (ör. küçük
  // saat farkı) birkaç saniyede bir tekrar dene.
  useEffect(() => {
    if (remaining !== 0) return
    router.refresh()
    const id = setInterval(() => router.refresh(), 5000)
    return () => clearInterval(id)
  }, [remaining, router])

  const planned = typeof drop.plannedQuantity === 'number' ? drop.plannedQuantity : null
  const plannedAnim = useAnimatedNumber<HTMLDivElement>(planned ?? 0, { from: 0, duration: 2000 })

  const total = remaining === null ? null : Math.floor(remaining / 1000)
  const d = total === null ? null : Math.floor(total / 86400)
  const h = total === null ? null : Math.floor((total % 86400) / 3600)
  const m = total === null ? null : Math.floor((total % 3600) / 60)
  const s = total === null ? null : total % 60

  const units: Array<[string, number | null]> = [
    [tr ? 'GÜN' : 'DAYS', d],
    [tr ? 'SAAT' : 'HRS', h],
    [tr ? 'DK' : 'MIN', m],
    [tr ? 'SN' : 'SEC', s],
  ]

  return (
    <section id={dropSectionId(drop.dropNo)} className="border-b border-bureau-panel-edge">
      <div className="border-b border-dashed border-bureau-line-dashed px-5 py-2.5 md:px-9">
        <h2 className="flex flex-wrap items-baseline gap-x-2.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-bureau-fixed-black">
          <span>
            <span className="text-bureau-fixed-amber">DROP-{drop.dropNo}</span>
            <span className="ml-2 font-normal text-bureau-fixed-muted">{name}</span>
          </span>
          {drop.totalCombinations > 0 && (
            <AnimatedCombinations total={drop.totalCombinations} locale={locale} />
          )}
        </h2>
      </div>

      <div className={`flex flex-col ${panelOnLeft ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
        {/* Gizli ürünler — gerçek ürün verisi istemciye hiç gelmez. */}
        <div className="relative md:w-4/5">
          <div className="flex items-start gap-3 overflow-hidden px-5 py-6 md:px-9">
            {Array.from({ length: PLACEHOLDER_COUNT }).map((_, i) => (
              <div
                key={i}
                style={{ width: CARD_WIDTH, flexShrink: 0 }}
                className="flex aspect-[3/4] select-none items-center justify-center border border-dashed border-bureau-line-dashed bg-bureau-fixed-black/5"
                aria-hidden="true"
              >
                <span className="font-mono text-[84px] font-bold leading-none text-bureau-fixed-muted/40">
                  ?
                </span>
              </div>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="border border-bureau-fixed-black bg-bureau-fixed-black/85 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.25em] text-white backdrop-blur-sm">
              {tr ? 'Yakında' : 'Coming soon'}
            </span>
          </div>
        </div>

        <div className="relative flex w-full flex-shrink-0 flex-col items-center justify-center overflow-hidden border-t border-bureau-panel-edge bg-bureau-panel-edge p-6 text-center text-white md:w-1/5 md:border-t-0 md:border-l md:border-r-0">
          <div className="relative z-10 w-full">
            <div className="font-mono text-[20px] font-bold uppercase tracking-wider text-bureau-fixed-amber sm:text-[23px]">
              DROP-{drop.dropNo}
            </div>
            <div className="mt-2 font-mono text-[17px] font-semibold uppercase tracking-wider text-white sm:text-[19px]">
              {name}
            </div>

            <div className="mt-5 font-mono text-[9.5px] uppercase tracking-widest text-white/70">
              {tr ? 'Açılışa kalan süre' : 'Opens in'}
            </div>
            <div className="mt-2 flex justify-center gap-2">
              {units.map(([label, value]) => (
                <div key={label} className="min-w-[2.6rem]">
                  <div className="font-mono text-[22px] font-bold tabular-nums text-white">
                    {value === null ? '--' : pad(value)}
                  </div>
                  <div className="font-mono text-[8px] tracking-widest text-white/60">{label}</div>
                </div>
              ))}
            </div>

            {planned !== null && (
              <div ref={plannedAnim.ref} className="mt-5 font-mono text-[10.5px] uppercase tracking-wide text-white/80">
                <span className="text-[15px] font-bold tabular-nums text-bureau-fixed-amber">
                  {plannedAnim.value.toLocaleString(tr ? 'tr-TR' : 'en-US')}
                </span>{' '}
                {tr ? 'adet çıkacak' : 'pieces will drop'}
              </div>
            )}

            {(prevDrop || nextDrop) && (
              <div className="mt-8 space-y-3 border-t border-white/20 pt-4">
                {prevDrop && (
                  <button
                    onClick={() =>
                      document.getElementById(dropSectionId(prevDrop.dropNo))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                    className="block w-full font-mono text-[11px] uppercase tracking-wider text-white/70 transition-colors hover:text-bureau-fixed-amber"
                  >
                    ↑ {getLocalizedValue(prevDrop.name, locale, '—')}
                  </button>
                )}
                {nextDrop && (
                  <button
                    onClick={() =>
                      document.getElementById(dropSectionId(nextDrop.dropNo))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                    className="block w-full font-mono text-[11px] uppercase tracking-wider text-white/70 transition-colors hover:text-bureau-fixed-amber"
                  >
                    ↓ {getLocalizedValue(nextDrop.name, locale, '—')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
