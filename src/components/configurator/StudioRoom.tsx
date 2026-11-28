'use client'

import { Room } from '@/components/home/HeroWireframeScene'
import { useConfiguratorStore } from '@/lib/store/configurator'

/** Model henüz ölçülmeden odanın varsayılan yüksekliği (mm). */
const DEFAULT_HEIGHT = 420

/**
 * Anasayfaya gömülü stüdyonun odası: header'daki tel kafes sahnesinin
 * aynısı — zemin + duvar ızgarası, priz, fiş ve lambadan prize kablo
 * (sarkıtta tavan ızgarası, göbek ve kordon). Oda, modelin ölçüsüne göre
 * büyür; teknik zemin ızgarasının yerine çizilir.
 */
export function StudioRoom() {
  const height = useConfiguratorStore((s) => s.stackTotalHeight)
  const width = useConfiguratorStore((s) => s.stackWidth)
  const depth = useConfiguratorStore((s) => s.stackDepth)
  const hanging = useConfiguratorStore((s) => s.layoutMode === 'model' && s.hangFromCeiling)

  const h = height > 0 ? height : DEFAULT_HEIGHT
  const radius = Math.max(width, depth, h * 0.12) / 2
  return <Room height={h} radius={radius} hanging={hanging} lampTop={h} />
}
