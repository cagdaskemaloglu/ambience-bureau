'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { ModelMesh } from './ModelMesh'
import type { PartDimensions } from './ModelMesh'
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
  onDimensionsCalculated,
  glowColor,
  targetGlowIntensity,
}: {
  item: ResolvedSlot & { yOffset: number }
  onDimensionsCalculated: (key: string, dimensions: PartDimensions) => void
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
        onDimensionsCalculated={(dimensions) => onDimensionsCalculated(item.key, dimensions)}
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

// Henüz ölçülmemiş (yükleniyor) bir parça için kullanılan tahminî
// yer tutucu — gerçek ölçüm geldiğinde otomatik güncellenir.
const FALLBACK_HEIGHT = 50
const FALLBACK_HALF_WIDTH = 25
const FALLBACK_HALF_DEPTH = 25

export function LampModel() {
  const slots = useResolvedSlots()
  const [dims, setDims] = useState<Record<string, PartDimensions>>({})
  const lightEnabled = useConfiguratorStore((s) => s.lightEnabled)
  const lightBrightness = useConfiguratorStore((s) => s.lightBrightness)
  const lightColor = useConfiguratorStore((s) => s.lightColor)

  const handleDimensionsCalculated = useCallback((key: string, dimensions: PartDimensions) => {
    setDims((prev) => {
      const existing = prev[key]
      if (
        existing &&
        existing.width === dimensions.width &&
        existing.height === dimensions.height &&
        existing.depth === dimensions.depth
      ) {
        return prev
      }
      return { ...prev, [key]: dimensions }
    })
  }, [])

  const positioned = useMemo(() => {
    let currentY = 0
    return slots.map((slot) => {
      const height = dims[slot.key]?.height ?? FALLBACK_HEIGHT
      const yOffset = currentY + height / 2
      currentY += height
      return { ...slot, yOffset }
    })
  }, [slots, dims])

  // CameraFit'in gerçek stack yüksekliğine göre doğru mesafeyi
  // hesaplayabilmesi, ve DimensionAnnotations'ın modelin gerçek toplam
  // en/boy/derinliğini (mm) gösterebilmesi için bu ölçüleri store'a bildir.
  const setStackMetrics = useConfiguratorStore((s) => s.setStackMetrics)
  useEffect(() => {
    const totalHeight = positioned.reduce((sum, slot) => sum + (dims[slot.key]?.height ?? FALLBACK_HEIGHT), 0)

    // Parçalar sadece Y ekseninde (yukarı/aşağı) kaydırılıyor — X/Z'de
    // hepsi kendi yerel orijininde durduğu için, tüm parçaların X/Z
    // min/max'larının kapsayıcısı (union'ı) doğrudan modelin toplam
    // en/derinliğini verir.
    let minX = Infinity
    let maxX = -Infinity
    let minZ = Infinity
    let maxZ = -Infinity
    for (const slot of positioned) {
      const d = dims[slot.key]
      minX = Math.min(minX, d?.minX ?? -FALLBACK_HALF_WIDTH)
      maxX = Math.max(maxX, d?.maxX ?? FALLBACK_HALF_WIDTH)
      minZ = Math.min(minZ, d?.minZ ?? -FALLBACK_HALF_DEPTH)
      maxZ = Math.max(maxZ, d?.maxZ ?? FALLBACK_HALF_DEPTH)
    }
    const totalWidth = positioned.length > 0 ? maxX - minX : 0
    const totalDepth = positioned.length > 0 ? maxZ - minZ : 0

    setStackMetrics(totalHeight, positioned.length, totalWidth, totalDepth)
  }, [positioned, dims, setStackMetrics])

  if (positioned.length === 0) return null

  return (
    <group>
      {positioned.map((item) => {
        const isHead = item.key === 'head'
        return (
          <SlotMesh
            key={item.key}
            item={item}
            onDimensionsCalculated={handleDimensionsCalculated}
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
  return slots.length * FALLBACK_HEIGHT
}