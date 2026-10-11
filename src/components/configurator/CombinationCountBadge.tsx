'use client'

import { useMemo } from 'react'
import { useLocale } from 'next-intl'
import { useConfiguratorStore } from '@/lib/store/configurator'
import { computeCurrentModelCombinationCount, formatCombinationCount } from '@/lib/combinatorics'
import { useAnimatedNumber } from '@/lib/useAnimatedNumber'

/**
 * 3D viewer'ın sol üst köşesinde duran, müşterinin O AN eklediği
 * SPESİFİK gövde setinden kaç farklı tasarım çıkarılabileceğini gösteren
 * rozet — DİNAMİK ve ANİMASYONLU: ilk göründüğünde 0'dan hedef değere
 * sayarak artar; gövde ekleme/çıkarma/yer değiştirmede de eski değerden
 * yeni değere akar.
 */
export function CombinationCountBadge() {
  const locale = useLocale()
  const collectionKey = useConfiguratorStore((s) => s.collectionKey)
  const body = useConfiguratorStore((s) => s.body)
  const bodyLimits = useConfiguratorStore((s) => s.bodyLimits)

  const total = useMemo(
    () => computeCurrentModelCombinationCount(body, bodyLimits),
    [body, bodyLimits]
  )

  // Hook koşulsuz çağrılmalı (erken return'den ÖNCE).
  const { value } = useAnimatedNumber(total > 0 ? total : 0, {
    from: 0,
    duration: 1400,
    startWhenVisible: false,
  })

  if (!collectionKey || body.length === 0 || total <= 0) return null

  return (
    <div className="pointer-events-none absolute left-3 top-3 z-10">
      <div
        className="border border-bureau-fixed-black bg-white/90 px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-widest text-bureau-fixed-black backdrop-blur-sm"
        title={
          locale === 'tr'
            ? 'Eklediğiniz gövde parçalarını yer değiştirerek veya bir kısmını çıkararak kaç farklı tasarım elde edebileceğiniz'
            : 'How many different designs you can get by rearranging or removing some of the body parts you’ve added'
        }
      >
        <span className="inline-block min-w-[1ch] font-semibold tabular-nums text-bureau-fixed-amber">
          {formatCombinationCount(value, locale)}
        </span>{' '}
        {locale === 'tr' ? 'Farklı Kombinasyon' : 'Different Combinations'}
      </div>
    </div>
  )
}
