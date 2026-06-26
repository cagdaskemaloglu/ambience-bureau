'use client'

import { Suspense, useCallback, useMemo, useState } from 'react'
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
}: {
  item: ResolvedSlot & { yOffset: number }
  onHeightCalculated: (key: string, height: number) => void
}) {
  return (
    <Suspense fallback={null}>
      <ModelMesh
        url={item.part.modelUrl}
        color={item.material.color}
        roughness={item.material.roughness}
        metalness={item.material.metalness}
        position={[0, item.yOffset, 0]}
        onHeightCalculated={(height) => onHeightCalculated(item.key, height)}
      />
    </Suspense>
  )
}

export function LampModel() {
  const slots = useResolvedSlots()
  const [heights, setHeights] = useState<Record<string, number>>({})

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

  if (positioned.length === 0) return null

  return (
    <group>
      {positioned.map((item) => (
        <SlotMesh
          key={item.key}
          item={item}
          onHeightCalculated={handleHeightCalculated}
        />
      ))}
    </group>
  )
}

export function useStackHeight(): number {
  const slots = useResolvedSlots()
  return slots.length * 50
}