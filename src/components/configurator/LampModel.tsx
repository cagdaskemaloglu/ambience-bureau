'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { ModelMesh } from './ModelMesh'
import type { PartDimensions } from './ModelMesh'
import { useConfiguratorStore } from '@/lib/store/configurator'
import type { LampPart } from '@/types'

interface ResolvedSlot {
  key: string
  part: LampPart
  material: Pick<LampPart['materials'][number], 'color' | 'roughness' | 'metalness' | 'isTranslucent' | 'opacity'>
  /** Sabit parça (ör. kablo): müşteri seçmez, sabit renkli, parlamaz. */
  fixed?: boolean
}

/** Sabit parçalar için malzeme — Sanity'deki sabit renk, mat yüzey. */
function fixedMaterial(part: LampPart): ResolvedSlot['material'] {
  return { color: part.fixedColor ?? '#1A1A1A', roughness: 0.6, metalness: 0.1, isTranslucent: false, opacity: 1 }
}

function useResolvedSlots(): ResolvedSlot[] {
  const availableParts = useConfiguratorStore((s) => s.availableParts)
  const fixedParts = useConfiguratorStore((s) => s.fixedParts)
  const base = useConfiguratorStore((s) => s.base)
  const body = useConfiguratorStore((s) => s.body)
  const head = useConfiguratorStore((s) => s.head)
  // Montajlı modelde anahtar parçaya özgü: model değişince önceki modelin
  // ölçüleri yeni parçaya karışmasın.
  const modelMode = useConfiguratorStore((s) => s.layoutMode === 'model')

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

    // Sabit parçalar kendi slot türlerinin önüne eklenir (üst üste
    // yerleşimde: sabit taban → seçili taban → ...). "Blender konumu"
    // yerleşiminde sıra önemsizdir, her parça dosyadaki yerinde durur.
    const addFixed = (slotType: LampPart['slotType']) => {
      fixedParts
        .filter((p) => p.slotType === slotType)
        .forEach((part) => slots.push({ key: `fixed-${part.partId}`, part, material: fixedMaterial(part), fixed: true }))
    }

    addFixed('base')
    resolve('base', base)
    addFixed('body')
    body.forEach((slot, idx) => resolve(modelMode ? `body-${idx}-${slot.partId}` : `body-${idx}`, slot))
    addFixed('head')
    resolve('head', head)

    return slots
  }, [availableParts, fixedParts, base, body, head, modelMode])
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
  item: ResolvedSlot & { position: [number, number, number]; rotation?: [number, number, number]; centered: boolean }
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
        position={item.position}
        rotation={item.rotation}
        centered={item.centered}
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

interface DisplayDimensions {
  width: number
  height: number
  depth: number
}

/**
 * SADECE 3D viewer'daki ölçü ETİKETLERİNDE (DimensionAnnotations)
 * gösterilecek en/boy/derinlik. İstifleme mekaniği bunu KULLANMAZ — o
 * her zaman gerçek geometriden hesaplanır (aşağıdaki `positioned` ve
 * stack metrikleri). Öncelik sırası:
 *   1) Sanity Studio'da o parça için elle girilen Dimensions (mm) —
 *      "Bilgi amaçlı kayıt" alanı; istifleme için değil, sadece bu
 *      etiketler için kaynak olarak kullanılır.
 *   2) Studio'da alan boşsa: GLB/STL geometrisinden otomatik ölçülen
 *      bounding box'a düşer (böylece etiket hep bir şey gösterir).
 *   3) İkisi de yoksa (model daha yüklenmedi): sabit yer tutucu.
 */
function getDisplayDimensions(
  part: LampPart,
  measured: PartDimensions | undefined
): DisplayDimensions {
  const manual = part.dimensions
  return {
    width: manual?.width ?? (measured ? measured.maxX - measured.minX : FALLBACK_HALF_WIDTH * 2),
    height: manual?.height ?? measured?.height ?? FALLBACK_HEIGHT,
    depth: manual?.depth ?? (measured ? measured.maxZ - measured.minZ : FALLBACK_HALF_DEPTH * 2),
  }
}

export function LampModel() {
  const slots = useResolvedSlots()
  const [dims, setDims] = useState<Record<string, PartDimensions>>({})
  const lightEnabled = useConfiguratorStore((s) => s.lightEnabled)
  const lightBrightness = useConfiguratorStore((s) => s.lightBrightness)
  const lightColor = useConfiguratorStore((s) => s.lightColor)

  const layoutMode = useConfiguratorStore((s) => s.layoutMode)
  const hangFromCeiling = useConfiguratorStore((s) => s.hangFromCeiling)
  // 'model' (Montajlı model) de parçaları Blender konumunda yerleştirir.
  const assembled = layoutMode !== 'stack'
  const modelMode = layoutMode === 'model'

  const handleDimensionsCalculated = useCallback((key: string, dimensions: PartDimensions) => {
    setDims((prev) => {
      const existing = prev[key]
      // minX/minY/minZ da karşılaştırılır: yerleşim değişince (merkezli ↔
      // Blender konumu) boyut aynı kalıp konum değişebilir.
      if (
        existing &&
        existing.width === dimensions.width &&
        existing.height === dimensions.height &&
        existing.depth === dimensions.depth &&
        existing.minX === dimensions.minX &&
        existing.minY === dimensions.minY &&
        existing.minZ === dimensions.minZ
      ) {
        return prev
      }
      return { ...prev, [key]: dimensions }
    })
  }, [])

  // ── Yerleşim ────────────────────────────────────────────────
  // stack     : parçalar kendi merkezlerinden dikey olarak istiflenir (eski davranış).
  // assembled : her parça dosyadaki (Blender, ortak orijin) konumunda durur
  //             (+ Sanity'deki ofset/rotasyon). Tüm model sonra bir bütün
  //             olarak zemine oturtulur ya da tavandan asılır.
  const layout = useMemo(() => {
    if (!assembled) {
      let currentY = 0
      const items = slots.map((slot) => {
        const height = dims[slot.key]?.height ?? FALLBACK_HEIGHT
        const position: [number, number, number] = [0, currentY + height / 2, 0]
        currentY += height
        return { ...slot, position, rotation: undefined, centered: true }
      })
      return { items, groupPos: [0, 0, 0] as [number, number, number], bounds: null as null | { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number } }
    }

    const deg = (v?: number) => ((v ?? 0) * Math.PI) / 180
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity
    const items = slots.map((slot) => {
      const o = slot.part.offsetMm
      const r = slot.part.rotationDeg
      const position: [number, number, number] = [o?.x ?? 0, o?.y ?? 0, o?.z ?? 0]
      const rotation: [number, number, number] | undefined = r ? [deg(r.x), deg(r.y), deg(r.z)] : undefined
      const d = dims[slot.key]
      if (d) {
        // Rotasyon düzeltmesi sınırlara yaklaşık yansır (nadiren kullanılır).
        minX = Math.min(minX, d.minX + position[0]); maxX = Math.max(maxX, d.maxX + position[0])
        minY = Math.min(minY, d.minY + position[1]); maxY = Math.max(maxY, d.maxY + position[1])
        minZ = Math.min(minZ, d.minZ + position[2]); maxZ = Math.max(maxZ, d.maxZ + position[2])
      }
      return { ...slot, position, rotation, centered: false }
    })
    const bounds = Number.isFinite(minY) ? { minX, maxX, minY, maxY, minZ, maxZ } : null
    const groupPos: [number, number, number] = [0, 0, 0]
    if (bounds) {
      const h = bounds.maxY - bounds.minY
      // X/Z'de ortala (kamera ve ölçü çizgileri modeli orijinde varsayar).
      groupPos[0] = -(bounds.minX + bounds.maxX) / 2
      groupPos[2] = -(bounds.minZ + bounds.maxZ) / 2
      // Asılı: modelin en üst noktası, model yüksekliğinin 1.6 katı
      // yükseklikte durur (altında ~0.6h boşluk kalır). Değilse zemine oturur.
      groupPos[1] = hangFromCeiling ? h * 1.6 - bounds.maxY : -bounds.minY
    }
    return { items, groupPos, bounds }
  }, [slots, dims, assembled, hangFromCeiling])

  // CameraFit'in gerçek yüksekliğe göre doğru mesafeyi hesaplayabilmesi ve
  // DimensionAnnotations'ın modelin toplam en/boy/derinliğini (mm)
  // gösterebilmesi için ölçüleri store'a bildir.
  const setStackMetrics = useConfiguratorStore((s) => s.setStackMetrics)
  const setDisplayMetrics = useConfiguratorStore((s) => s.setDisplayMetrics)
  useEffect(() => {
    if (assembled) {
      const b = layout.bounds
      if (!b) return
      const h = b.maxY - b.minY
      // Asılı modelde kamera, havadaki modelin tepesini de kapsamalı.
      const fitHeight = hangFromCeiling ? h * 1.6 : h
      setStackMetrics(fitHeight, layout.items.length, b.maxX - b.minX, b.maxZ - b.minZ)
      setDisplayMetrics(b.maxX - b.minX, h, b.maxZ - b.minZ)
      return
    }

    const totalHeight = layout.items.reduce((sum, slot) => sum + (dims[slot.key]?.height ?? FALLBACK_HEIGHT), 0)
    // Parçalar sadece Y ekseninde kaydırılıyor — X/Z'de hepsi kendi yerel
    // orijininde durduğu için X/Z min/max'larının birleşimi toplam en/derinliktir.
    let minX = Infinity
    let maxX = -Infinity
    let minZ = Infinity
    let maxZ = -Infinity
    for (const slot of layout.items) {
      const d = dims[slot.key]
      minX = Math.min(minX, d?.minX ?? -FALLBACK_HALF_WIDTH)
      maxX = Math.max(maxX, d?.maxX ?? FALLBACK_HALF_WIDTH)
      minZ = Math.min(minZ, d?.minZ ?? -FALLBACK_HALF_DEPTH)
      maxZ = Math.max(maxZ, d?.maxZ ?? FALLBACK_HALF_DEPTH)
    }
    const totalWidth = layout.items.length > 0 ? maxX - minX : 0
    const totalDepth = layout.items.length > 0 ? maxZ - minZ : 0
    setStackMetrics(totalHeight, layout.items.length, totalWidth, totalDepth)

    // Ölçü ETİKETLERİ için Sanity'deki Dimensions (mm) önceliklidir.
    let labelHeight = 0
    let labelWidth = 0
    let labelDepth = 0
    for (const slot of layout.items) {
      const { width, height, depth } = getDisplayDimensions(slot.part, dims[slot.key])
      labelHeight += height
      labelWidth = Math.max(labelWidth, width)
      labelDepth = Math.max(labelDepth, depth)
    }
    setDisplayMetrics(labelWidth, labelHeight, labelDepth)
  }, [layout, dims, assembled, hangFromCeiling, setStackMetrics, setDisplayMetrics])

  if (layout.items.length === 0) return null

  return (
    <group position={layout.groupPos}>
      {layout.items.map((item) => {
        // Işık mekanizması başlıkta: seçilen başlık parlar; sabit parçalar parlamaz.
        // Montajlı modelde ise Studio'da "Işık yayar" işaretli parça parlar.
        const isHead = modelMode ? !!item.part.emitsLight && !item.fixed : item.key === 'head'
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