'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { ModelMesh } from './ModelMesh'
import { useConfiguratorStore } from '@/lib/store/configurator'
import type { LampPart } from '@/types'

interface ResolvedSlot {
  key: string
  part: LampPart
  material: LampPart['materials'][number]
}

function useResolvedSlots(): ResolvedSlot[] {
  const availableParts = useConfiguratorStore((s) => s.availableParts)
  const base = useConfiguratorStore((s) => s.base)
  const body = useConfiguratorStore((s) => s.body)
  const head = useConfiguratorStore((s) => s.head)

  return useMemo(() => {
    const slots: ResolvedSlot[] = []

    function resolve(
      key: string,
      selection: { partId: string | null; materialId: string | null }
    ) {
      if (!selection.partId) return
      const part = availableParts.find((p) => p.partId === selection.partId)
      if (!part) return
      const material =
        part.materials.find((m) => m.materialId === selection.materialId) ?? part.materials[0]
      if (!material) return
      slots.push({ key, part, material })
    }

    resolve('base', base)
    body.forEach((slot, idx) => resolve(`body-${idx}`, slot))
    resolve('head', head)

    return slots
  }, [availableParts, base, body, head])
}

/**
 * Her slot kendi Suspense bloğuna sahip — yeni parça eklenince
 * sadece o slot yükleme bekler, mevcut parçalar ekranda kalır.
 */
function SlotMesh({
  item,
  onHeightCalculated,
  glowColor,
  targetGlowIntensity,
}: {
  item: ResolvedSlot & { yOffset: number }
  onHeightCalculated: (key: string, height: number) => void
  glowColor?: string
  targetGlowIntensity?: number
}) {
  return (
    <Suspense fallback={null}>
      <ModelMesh
        url={item.part.modelUrl}
        color={item.material.color}
        roughness={item.material.roughness}
        metalness={item.material.metalness}
        opacity={item.material.isTranslucent ? (item.material.opacity ?? 0.6) : undefined}
        position={[0, item.yOffset, 0]}
        onHeightCalculated={(height) => onHeightCalculated(item.key, height)}
        glowColor={glowColor}
        targetGlowIntensity={targetGlowIntensity}
      />
    </Suspense>
  )
}

// Işık açıkken başlık (head) parçasının ne kadar parlayacağı — ACES tone
// mapping altında Bloom eşiğini (bkz. Scene.tsx) rahatça aşacak, ama rengi
// tamamen beyaza yıkamayacak ölçüde kalibre edildi.
const MAX_HEAD_GLOW = 2.5

export function LampModel() {
  const slots = useResolvedSlots()
  const [heights, setHeights] = useState<Record<string, number>>({})
  const lightEnabled = useConfiguratorStore((s) => s.lightEnabled)
  const lightBrightness = useConfiguratorStore((s) => s.lightBrightness)
  const lightColor = useConfiguratorStore((s) => s.lightColor)

  const handleHeightCalculated = useCallback((key: string, height: number) => {
    setHeights((prev) => {
      if (prev[key] === height) return prev
      return { ...prev, [key]: height }
    })
  }, [])

  const positioned = useMemo(() => {
    let currentY = 0
    return slots.map((slot) => {
      const height = heights[slot.key] ?? 50
      const yOffset = currentY + height / 2
      currentY += height
      return { ...slot, yOffset }
    })
  }, [slots, heights])

  // CameraFit'in gerçek stack yüksekliğine göre doğru mesafeyi
  // hesaplayabilmesi için ölçülen toplam yükseklik + parça sayısını
  // store'a bildir (50 birimlik tahminî yükseklik yerine gerçek değer).
  const setStackMetrics = useConfiguratorStore((s) => s.setStackMetrics)
  useEffect(() => {
    const totalHeight = positioned.reduce((sum, slot) => sum + (heights[slot.key] ?? 50), 0)
    setStackMetrics(totalHeight, positioned.length)
  }, [positioned, heights, setStackMetrics])

  if (positioned.length === 0) return null

  return (
    <group>
      {positioned.map((item) => {
        const isHead = item.key === 'head'
        return (
          <SlotMesh
            key={item.key}
            item={item}
            onHeightCalculated={handleHeightCalculated}
            glowColor={isHead ? lightColor : undefined}
            targetGlowIntensity={isHead ? (lightEnabled ? lightBrightness * MAX_HEAD_GLOW : 0) : undefined}
          />
        )
      })}
    </group>
  )
}

export function useStackHeight(): number {
  const slots = useResolvedSlots()
  return slots.length * 50
}