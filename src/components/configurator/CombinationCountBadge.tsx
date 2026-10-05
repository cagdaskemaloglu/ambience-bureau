'use client'

import { useMemo } from 'react'
import { useLocale } from 'next-intl'
import { useConfiguratorStore } from '@/lib/store/configurator'
import { computeCurrentModelCombinationCount, formatCombinationCount } from '@/lib/combinatorics'

/**
 * 3D viewer'ın sol üst köşesinde duran, müşterinin O AN eklediği
 * SPESİFİK gövde setinden kaç farklı tasarım çıkarılabileceğini gösteren
 * rozet — DİNAMİK: her gövde ekleme/çıkarma/yer değiştirmede yeniden
 * hesaplanır (bkz. src/lib/combinatorics.ts). Taban ve başlık sabit
 * kabul edilir, sadece gövde seti değişkendir.
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

  // Henüz gövde eklenmemişse gösterecek anlamlı bir şey yok (sonuç hep 1
  // olurdu — "tek olası tasarım: boş" demenin bir değeri yok).
  if (!collectionKey || body.length === 0 || total <= 0) return null

  return (
    <div className="pointer-events-none absolute left-3 top-3 z-10">
      <div
        className="border border-bureau-fixed-black bg-white/90 px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-widest text-bureau-fixed-black backdrop-blur-sm"
        title={
          locale === 'tr'
            ? 'Eklediğiniz gövde parçalarını yer değiştirerek veya bir kısmını çıkararak kaç farklı tasarım elde edebileceğiniz'
            : 'How many different designs you can get by rearranging or removing some of the body parts you\u2019ve added'
        }
      >
        <span className="font-semibold text-bureau-fixed-amber">
          {formatCombinationCount(total, locale)}
        </span>{' '}
        {locale === 'tr' ? 'Farklı Kombinasyon' : 'Different Combinations'}
      </div>
    </div>
  )
}
