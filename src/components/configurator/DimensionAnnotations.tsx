'use client'

import { Line, Html } from '@react-three/drei'
import { useConfiguratorStore } from '@/lib/store/configurator'

// TechnicalGrid'in (Scene.tsx) rengiyle uyumlu, sahneyi boğmayan soluk
// mavi-gri — ölçü çizgileri dekoratif değil bilgilendirici olmalı.
const DIM_COLOR = '#5A6B8C'
const DASH_SIZE = 6 // mm
const GAP_SIZE = 4 // mm
const ARROW_SIZE = 10 // mm — ok başının uzunluğu
const ARROW_SPREAD = 4 // mm — ok başının açıklığı
const MARGIN = 40 // mm — ölçü çizgisinin modelden ne kadar dışarıda duracağı

type Vec3 = [number, number, number]

function Chevron({ points }: { points: [Vec3, Vec3, Vec3] }) {
  return <Line points={points} color={DIM_COLOR} lineWidth={1.5} />
}

function Label({ position, mm }: { position: Vec3; mm: number }) {
  return (
    <Html position={position} center distanceFactor={220} zIndexRange={[10, 0]}>
      <div className="whitespace-nowrap rounded-[2px] border border-bureau-black/30 bg-white/90 px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-bureau-ink">
        {Math.round(mm)} mm
      </div>
    </Html>
  )
}

/**
 * Custom Registry 3D viewer'ında, o an inşa edilen modelin GERÇEK
 * (ölçülen, mm cinsinden) toplam en/derinlik/boy değerlerini gösteren
 * kesikli ölçü çizgileri:
 *  - Modelin ÖNÜNDE (alt/zemin seviyesinde): EN (X ekseni)
 *  - Modelin SAĞINDA (alt/zemin seviyesinde): DERİNLİK (Z ekseni)
 *  - Modelin SOLUNDA (dikey): BOY (Y ekseni)
 *
 * SADECE interaktif Custom Registry'de gösterilir. Product card spin
 * kareleri üretilirken (?capture=1) HİÇ render edilmez — kamera her
 * kareyi farklı açıdan çektiği için, sahneye "yakılan" bir ölçü de
 * modelle birlikte dönüyormuş gibi görünürdü. Boy ölçüsü product
 * card'da bunun yerine sabit bir HTML rozeti olarak gösteriliyor (bkz.
 * ProductCardMedia.tsx + scripts/generate-spin-frames.ts'in ürettiği
 * meta.json) — asla dönmez.
 */
export function DimensionAnnotations() {
  const partCount = useConfiguratorStore((s) => s.stackPartCount)
  const width = useConfiguratorStore((s) => s.stackWidth)
  const depth = useConfiguratorStore((s) => s.stackDepth)
  const height = useConfiguratorStore((s) => s.stackTotalHeight)

  const isCaptureMode =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('capture') === '1'

  if (isCaptureMode || partCount === 0 || width <= 0 || depth <= 0 || height <= 0) return null

  const halfW = width / 2
  const halfD = depth / 2

  // ── EN (width) — modelin ÖNÜNDE, zemin seviyesinde, X ekseni boyunca ──
  const widthZ = halfD + MARGIN
  const widthLine: [Vec3, Vec3] = [
    [-halfW, 0, widthZ],
    [halfW, 0, widthZ],
  ]
  const widthArrowLeft: [Vec3, Vec3, Vec3] = [
    [-halfW + ARROW_SIZE, ARROW_SPREAD, widthZ],
    [-halfW, 0, widthZ],
    [-halfW + ARROW_SIZE, -ARROW_SPREAD, widthZ],
  ]
  const widthArrowRight: [Vec3, Vec3, Vec3] = [
    [halfW - ARROW_SIZE, ARROW_SPREAD, widthZ],
    [halfW, 0, widthZ],
    [halfW - ARROW_SIZE, -ARROW_SPREAD, widthZ],
  ]

  // ── DERİNLİK (depth) — modelin SAĞINDA, zemin seviyesinde, Z ekseni boyunca ──
  const depthX = halfW + MARGIN
  const depthLine: [Vec3, Vec3] = [
    [depthX, 0, -halfD],
    [depthX, 0, halfD],
  ]
  const depthArrowNear: [Vec3, Vec3, Vec3] = [
    [depthX + ARROW_SPREAD, 0, -halfD + ARROW_SIZE],
    [depthX, 0, -halfD],
    [depthX - ARROW_SPREAD, 0, -halfD + ARROW_SIZE],
  ]
  const depthArrowFar: [Vec3, Vec3, Vec3] = [
    [depthX + ARROW_SPREAD, 0, halfD - ARROW_SIZE],
    [depthX, 0, halfD],
    [depthX - ARROW_SPREAD, 0, halfD - ARROW_SIZE],
  ]

  // ── BOY (height) — modelin SOLUNDA, dikey, Y ekseni boyunca ──
  const heightX = -halfW - MARGIN
  const heightLine: [Vec3, Vec3] = [
    [heightX, 0, 0],
    [heightX, height, 0],
  ]
  const heightArrowBottom: [Vec3, Vec3, Vec3] = [
    [heightX + ARROW_SPREAD, ARROW_SIZE, 0],
    [heightX, 0, 0],
    [heightX - ARROW_SPREAD, ARROW_SIZE, 0],
  ]
  const heightArrowTop: [Vec3, Vec3, Vec3] = [
    [heightX + ARROW_SPREAD, height - ARROW_SIZE, 0],
    [heightX, height, 0],
    [heightX - ARROW_SPREAD, height - ARROW_SIZE, 0],
  ]

  return (
    <group>
      {/* EN */}
      <Line points={widthLine} color={DIM_COLOR} lineWidth={1.5} dashed dashSize={DASH_SIZE} gapSize={GAP_SIZE} />
      <Chevron points={widthArrowLeft} />
      <Chevron points={widthArrowRight} />
      <Label position={[0, 0, widthZ]} mm={width} />

      {/* DERİNLİK */}
      <Line points={depthLine} color={DIM_COLOR} lineWidth={1.5} dashed dashSize={DASH_SIZE} gapSize={GAP_SIZE} />
      <Chevron points={depthArrowNear} />
      <Chevron points={depthArrowFar} />
      <Label position={[depthX, 0, 0]} mm={depth} />

      {/* BOY */}
      <Line points={heightLine} color={DIM_COLOR} lineWidth={1.5} dashed dashSize={DASH_SIZE} gapSize={GAP_SIZE} />
      <Chevron points={heightArrowBottom} />
      <Chevron points={heightArrowTop} />
      <Label position={[heightX, height / 2, 0]} mm={height} />
    </group>
  )
}