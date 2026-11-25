'use client'

import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import * as THREE from 'three'
import type { HeroWireframeData } from '@/lib/queries'

/**
 * Masthead'deki 3B tel kafes "oda": ürünün kayıtlı dizilimi (taban →
 * gövdeler → başlık) konfigüratördeki "üst üste" yerleşimle DİK istiflenir,
 * yere oturur; arkada bir duvar, duvarda priz, tabandan prize zemin
 * boyunca giden kablo ve fiş çizilir. Yalnızca çizgiler: kenarlar
 * (EdgesGeometry) + soluk üçgen ağı. Lamba kendi ekseninde yavaşça döner,
 * oda sabit kalır (kablo tabanın merkezinden çıktığı için kopmaz).
 */

const EDGE_COLOR = '#a9c8ff'
const MESH_COLOR = '#5f8dff'
const HEAD_COLOR = '#f2a35e'
const ROOM_COLOR = '#6f9cff'

type Part = HeroWireframeData['parts'][number]

/** Izgara çizgileri: düzlemde (u, v) aralığında, `step` aralıkla. */
function gridGeometry(
  uMin: number, uMax: number, vMin: number, vMax: number, step: number,
  toXYZ: (u: number, v: number) => [number, number, number]
) {
  const pts: number[] = []
  for (let u = uMin; u <= uMax + 1e-6; u += step) pts.push(...toXYZ(u, vMin), ...toXYZ(u, vMax))
  for (let v = vMin; v <= vMax + 1e-6; v += step) pts.push(...toXYZ(uMin, v), ...toXYZ(uMax, v))
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
  return g
}

function Lines({ geometry, color, opacity }: { geometry: THREE.BufferGeometry; color: string; opacity: number }) {
  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} />
    </lineSegments>
  )
}

function Room({ height, radius }: { height: number; radius: number }) {
  const geo = useMemo(() => {
    const step = Math.max(8, Math.round(height / 14))
    const half = Math.round((height * 0.62) / step) * step
    const wallZ = -Math.round((height * 0.42) / step) * step
    const front = Math.round((height * 0.28) / step) * step
    const wallH = Math.round((height * 1.12) / step) * step

    const floor = gridGeometry(-half, half, wallZ, front, step, (u, v) => [u, 0, v])
    const wall = gridGeometry(-half, half, 0, wallH, step, (u, v) => [u, v, wallZ])

    // Priz: duvarda, lambanın sağında, alçakta.
    const sx = Math.round(half * 0.55)
    const sy = step * 1.2
    const plateW = step * 1.1
    const plate = new THREE.EdgesGeometry(new THREE.BoxGeometry(plateW, plateW, 1.5))
    plate.translate(sx, sy, wallZ + 0.75)
    // Fiş: prize takılı küçük gövde + kablo girişi.
    const plugBox = new THREE.BoxGeometry(plateW * 0.55, plateW * 0.55, step * 0.55)
    const plug = new THREE.EdgesGeometry(plugBox)
    plug.translate(sx, sy, wallZ + 1.5 + step * 0.275)

    // Kablo: taban merkezinin altından zemin boyunca duvara, oradan prize.
    const plugBack = wallZ + 1.5 + step * 0.55
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.6, 0),
      new THREE.Vector3(radius * 1.6, 0.6, front * 0.25),
      new THREE.Vector3(sx * 0.7, 0.6, wallZ * 0.2),
      new THREE.Vector3(sx * 0.95, 0.6, wallZ * 0.75),
      new THREE.Vector3(sx, sy * 0.45, plugBack + step * 0.6),
      new THREE.Vector3(sx, sy - plateW * 0.1, plugBack),
    ], false, 'catmullrom', 0.4)
    const cable = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(curve.getPoints(120)),
      new THREE.LineBasicMaterial({ color: EDGE_COLOR, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending })
    )
    // Duvar–zemin köşesi ve duvar üst kenarı daha belirgin.
    const edges = new THREE.BufferGeometry()
    edges.setAttribute('position', new THREE.Float32BufferAttribute([
      -half, 0, wallZ, half, 0, wallZ,
      -half, wallH, wallZ, half, wallH, wallZ,
    ], 3))
    return { floor, wall, plate, plug, cable, edges }
  }, [height, radius])

  return (
    <group>
      <Lines geometry={geo.floor} color={ROOM_COLOR} opacity={0.2} />
      <Lines geometry={geo.wall} color={ROOM_COLOR} opacity={0.15} />
      <Lines geometry={geo.edges} color={ROOM_COLOR} opacity={0.5} />
      <Lines geometry={geo.plate} color={EDGE_COLOR} opacity={0.8} />
      <Lines geometry={geo.plug} color={EDGE_COLOR} opacity={0.9} />
      <primitive object={geo.cable} />
    </group>
  )
}

function Model({ parts, animate }: { parts: Part[]; animate: boolean }) {
  const urls = useMemo(() => Array.from(new Set(parts.map((p) => p.url))), [parts])
  const loaded = useLoader(STLLoader, urls)

  // Her benzersiz dosya için bir kez: merkezlenmiş geometri, kenarlar, tel ağı.
  const byUrl = useMemo(() => {
    const map = new Map<string, { edges: THREE.BufferGeometry; wire: THREE.BufferGeometry; height: number; radius: number }>()
    urls.forEach((url, i) => {
      const g = loaded[i].clone()
      g.center()
      g.computeBoundingBox()
      const b = g.boundingBox!
      map.set(url, {
        edges: new THREE.EdgesGeometry(g, 24),
        wire: new THREE.WireframeGeometry(g),
        height: b.max.y - b.min.y,
        radius: Math.max(b.max.x - b.min.x, b.max.z - b.min.z) / 2,
      })
      g.dispose()
    })
    return map
  }, [urls, loaded])

  const layout = useMemo(() => {
    let y = 0
    let radius = 0
    const items = parts.map((p, i) => {
      const d = byUrl.get(p.url)!
      const pos = y + d.height / 2
      y += d.height
      radius = Math.max(radius, d.radius)
      return { key: `${i}-${p.slotType}`, part: p, d, y: pos }
    })
    return { items, length: y, radius }
  }, [parts, byUrl])

  const spin = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    if (animate && spin.current) spin.current.rotation.y += delta * 0.25
  })

  // Oda (zemin + duvar) dahil sahne yüksekliğini kutuya sığdır.
  const H = layout.length
  const { size, camera } = useThree()
  const zoom = Math.min(size.height / (H * 1.3), size.width / (H * 1.5))
  const ortho = camera as THREE.OrthographicCamera
  if (ortho.zoom !== zoom) {
    ortho.zoom = zoom
    ortho.updateProjectionMatrix()
  }

  return (
    // Hafif yukarıdan, köşeden bakış (aksonometrik çizim).
    <group rotation={[0.38, -0.62, 0]} position={[0, -H * 0.5, 0]}>
      <Room height={H} radius={layout.radius} />
      <group ref={spin}>
        {layout.items.map(({ key, part, d, y }) => {
          const head = part.slotType === 'head'
          return (
            <group key={key} position={[0, y, 0]}>
              <Lines geometry={d.wire} color={head ? HEAD_COLOR : MESH_COLOR} opacity={head ? 0.16 : 0.1} />
              <Lines geometry={d.edges} color={head ? HEAD_COLOR : EDGE_COLOR} opacity={0.85} />
            </group>
          )
        })}
      </group>
    </group>
  )
}

/**
 * Sürekli 60 fps yerine ~30 fps: yavaş dönen bir tel kafes için yeterli,
 * ana iş parçacığını (sayfanın geri kalanını) rahat bırakır.
 */
function Ticker({ fps = 30 }: { fps?: number }) {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    const id = window.setInterval(() => invalidate(), 1000 / fps)
    return () => window.clearInterval(id)
  }, [invalidate, fps])
  return null
}

/** Suspense çözülünce (STL'ler indi) bir kez haber verir. */
function Loaded({ onLoaded }: { onLoaded?: () => void }) {
  useEffect(() => onLoaded?.(), [onLoaded])
  return null
}

export default function HeroWireframeScene({
  parts,
  running,
  animate,
  onReady,
}: {
  parts: Part[]
  /** Görünür değilse çizim tamamen durur. */
  running: boolean
  /** prefers-reduced-motion: model döndürülmez. */
  animate: boolean
  onReady?: () => void
}) {
  return (
    <Canvas
      orthographic
      dpr={[1, 1.5]}
      frameloop="demand"
      camera={{ position: [0, 0, 4000], near: 1, far: 10000, zoom: 0.2 }}
      gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
      style={{ background: 'transparent' }}
    >
      {running && animate && <Ticker />}
      <Suspense fallback={null}>
        <Model parts={parts} animate={animate} />
        <Loaded onLoaded={onReady} />
      </Suspense>
    </Canvas>
  )
}
