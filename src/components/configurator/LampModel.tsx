'use client'

import { useCallback, useMemo, useState } from 'react'
import { ModelMesh } from './ModelMesh'
import { useConfiguratorStore } from '@/lib/store/configurator'
import type { LampPart } from '@/types'

interface ResolvedSlot {
  key: string // base | body-0 | body-1 | ... | head
  part: LampPart
  material: LampPart['materials'][number]
}

/**
 * Seçili tüm slotları (base → body[] → head) sırayla çözümler.
 * Bu, henüz pozisyon/yükseklik içermez — sadece "hangi parça/malzeme
 * hangi sırada" bilgisini verir.
 */
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
 * Lambayı dikey olarak istifler. Her parçanın GERÇEK yüksekliği,
 * 3D model yüklendiğinde ModelMesh'in onHeightCalculated callback'i
 * üzerinden ölçülür (Sanity'deki elle girilen dimensions.height alanına
 * bağımlı kalınmaz — bu alan artık sadece bilgi amaçlı/referans).
 *
 * Henüz yüklenmemiş (yüksekliği bilinmeyen) parçalar için varsayılan
 * 50 birim kullanılır; model yüklenince gerçek değer state'e yazılır
 * ve istifleme otomatik yeniden hesaplanır.
 */
export function LampModel() {
  const slots = useResolvedSlots()
  const [heights, setHeights] = useState<Record<string, number>>({})

  const handleHeightCalculated = useCallback((key: string, height: number) => {
    setHeights((prev) => {
      // Aynı değer zaten kayıtlıysa gereksiz re-render'ı önle
      if (prev[key] === height) return prev
      return { ...prev, [key]: height }
    })
  }, [])

  const positioned = useMemo(() => {
    let currentY = 0
    return slots.map((slot) => {
      const height = heights[slot.key] ?? 50 // ölçülene kadar varsayılan
      const yOffset = currentY + height / 2
      currentY += height
      return { ...slot, yOffset }
    })
  }, [slots, heights])

  if (positioned.length === 0) return null

  return (
    <group>
      {positioned.map((item) => (
        <ModelMesh
          key={item.key}
          url={item.part.modelUrl}
          color={item.material.color}
          roughness={item.material.roughness}
          metalness={item.material.metalness}
          position={[0, item.yOffset, 0]}
          onHeightCalculated={(height) => handleHeightCalculated(item.key, height)}
        />
      ))}
    </group>
  )
}

/**
 * Toplam yığın yüksekliğini döndürür (kamera otomatik kadrajlama, ışık
 * konumlandırma için kullanılır). LampModel ile aynı hesaplamayı
 * tekrar yapar çünkü height state'i bu component'lerin dışında.
 */
export function useStackHeight(): number {
  const slots = useResolvedSlots()
  // NOT: Bu fonksiyon kendi `heights` state'ine sahip değil, bu yüzden
  // sadece slot SAYISI üzerinden kabaca tahmin eder (varsayılan 50/parça).
  // Daha kesin değer gerekiyorsa (örn. kamera fit için), heights state'i
  // bir Zustand store'a taşınmalı — bu, Faz 6.5/7 sırasında değerlendirilebilir.
  return slots.length * 50
}
