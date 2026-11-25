'use client'

import { createContext, Suspense, useContext, useEffect, useMemo, useRef } from 'react'
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

/**
 * İki ton: "night" (karanlık = tel kafes teması: gece mavisi zeminde
 * parlayan açık mavi çizgiler, additive) ve "paper" (aydınlık tema: kırık
 * beyaz zeminde Space Blue mürekkep çizgiler, normal karışım).
 */
export type WireTone = 'night' | 'paper'
const TONES = {
  night: { edge: '#a9c8ff', head: '#f2a35e', room: '#6f9cff', blending: THREE.AdditiveBlending, k: 1 },
  paper: { edge: '#2f5d8a', head: '#c4611f', room: '#2f5d8a', blending: THREE.NormalBlending, k: 0.85 },
} as const
const ToneCtx = createContext<(typeof TONES)[WireTone]>(TONES.night)

type Part = HeroWireframeData['parts'][number]

const TILT: [number, number, number] = [0.38, -0.62, 0]

/** Odanın ölçüleri (lamba yüksekliğine oranlı, ızgara adımına yuvarlanmış). */
function roomDims(height: number, step = Math.max(8, Math.round(height / 14))) {
  const snap = (v: number) => Math.round(v / step) * step
  return { step, half: snap(height * 0.55), wallZ: -snap(height * 0.38), front: snap(height * 0.24), wallH: snap(height * 1.08) }
}

/**
 * Oda (zemin + duvar) ve lamba bu açıyla döndürüldüğünde ekrandaki sınır
 * kutusu — kadraj tüm odayı içine alacak şekilde hesaplanır; duvar üstten
 * kesilip "ikinci bir ızgara" gibi görünmez.
 */
function projectedBounds(height: number) {
  const { half, wallZ, front, wallH } = roomDims(height)
  const e = new THREE.Euler(...TILT)
  const pts = [
    [-half, 0, wallZ], [half, 0, wallZ], [-half, 0, front], [half, 0, front],
    [-half, wallH, wallZ], [half, wallH, wallZ], [0, height, 0],
  ].map(([x, y, z]) => new THREE.Vector3(x, y, z).applyEuler(e))
  const xs = pts.map((p) => p.x)
  const ys = pts.map((p) => p.y)
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) }
}

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

function Lines({ geometry, color, opacity }: { geometry: THREE.BufferGeometry; color: 'edge' | 'head' | 'room'; opacity: number }) {
  const t = useContext(ToneCtx)
  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={t[color]} transparent opacity={opacity * t.k} depthWrite={false} blending={t.blending} />
    </lineSegments>
  )
}

function Room({ height, radius }: { height: number; radius: number }) {
  const tone = useContext(ToneCtx)
  const geo = useMemo(() => {
    const step = Math.max(8, Math.round(height / 14))
    const { half, wallZ, front, wallH } = roomDims(height, step)

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
      new THREE.LineBasicMaterial({ color: tone.edge, transparent: true, opacity: 0.85, depthWrite: false, blending: tone.blending })
    )
    // Duvar–zemin köşesi ve duvar üst kenarı daha belirgin.
    const edges = new THREE.BufferGeometry()
    edges.setAttribute('position', new THREE.Float32BufferAttribute([
      -half, 0, wallZ, half, 0, wallZ,
      -half, wallH, wallZ, half, wallH, wallZ,
    ], 3))
    return { floor, wall, plate, plug, cable, edges }
  }, [height, radius, tone])

  return (
    <group>
      <Lines geometry={geo.floor} color="room" opacity={0.2} />
      <Lines geometry={geo.wall} color="room" opacity={0.15} />
      <Lines geometry={geo.edges} color="room" opacity={0.5} />
      <Lines geometry={geo.plate} color="edge" opacity={0.8} />
      <Lines geometry={geo.plug} color="edge" opacity={0.9} />
      <primitive object={geo.cable} />
    </group>
  )
}

/**
 * Bir parçayı y = c düzlemiyle keser: kesit çizgileri (segment çiftleri).
 * Üçgen ağı yerine bu "halkalar" çizilir;
 * organik formlarda bile temiz, teknik çizim gibi okunur.
 */
function sliceAt(pos: ArrayLike<number>, c: number, out: number[]) {
  const p: number[] = []
  for (let i = 0; i < pos.length; i += 9) {
    p.length = 0
    for (let k = 0; k < 3; k++) {
      const a = i + k * 3
      const b = i + ((k + 1) % 3) * 3
      const ya = pos[a + 1] - c
      const yb = pos[b + 1] - c
      if ((ya < 0) !== (yb < 0)) {
        const t = ya / (ya - yb)
        const x = pos[a] + (pos[b] - pos[a]) * t
        const z = pos[a + 2] + (pos[b + 2] - pos[a + 2]) * t
        p.push(x, z)
      }
    }
    if (p.length === 4) out.push(p[0], c, p[1], p[2], c, p[3])
  }
}

/**
 * Bir parçayı lambanın ekseninden (y) geçen dikey bir düzlemle keser
 * (normal = (nx, 0, nz)): parçanın o açıdaki gerçek dikey profili. Lambayla
 * birlikte döner; organik/yaylı formlarda da doğru dış hat verir.
 */
function sliceMeridian(pos: ArrayLike<number>, nx: number, nz: number, out: number[]) {
  const p: number[] = []
  for (let i = 0; i < pos.length; i += 9) {
    p.length = 0
    for (let k = 0; k < 3; k++) {
      const a = i + k * 3
      const b = i + ((k + 1) % 3) * 3
      const da = pos[a] * nx + pos[a + 2] * nz
      const db = pos[b] * nx + pos[b + 2] * nz
      if ((da < 0) !== (db < 0)) {
        const t = da / (da - db)
        p.push(
          pos[a] + (pos[b] - pos[a]) * t,
          pos[a + 1] + (pos[b + 1] - pos[a + 1]) * t,
          pos[a + 2] + (pos[b + 2] - pos[a + 2]) * t
        )
      }
    }
    if (p.length === 6) out.push(...p)
  }
}

/** Meridyen düzlemleri: 0°, 45°, 90°, 135° (her biri iki yan profil verir). */
const MERIDIANS = [0, 45, 90, 135].map((deg) => [Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180)] as const)

type PartDraw = { rings: THREE.BufferGeometry; meridians: THREE.BufferGeometry; height: number; radius: number }

function buildPart(src: THREE.BufferGeometry, ringStep: number): PartDraw {
  const g = src.clone().toNonIndexed()
  g.center()
  g.computeBoundingBox()
  const b = g.boundingBox!
  const pos = g.attributes.position.array
  const h = b.max.y - b.min.y
  const eps = h * 0.012
  // Halkalar: parçanın alt ve üst ağzı + aralarda eşit adımla.
  const n = Math.max(1, Math.round((h - 2 * eps) / ringStep))
  const segs: number[] = []
  for (let i = 0; i <= n; i++) sliceAt(pos, b.min.y + eps + ((h - 2 * eps) * i) / n, segs)
  const rings = new THREE.BufferGeometry()
  rings.setAttribute('position', new THREE.Float32BufferAttribute(segs, 3))
  const mer: number[] = []
  for (const [nx, nz] of MERIDIANS) sliceMeridian(pos, nx, nz, mer)
  const meridians = new THREE.BufferGeometry()
  meridians.setAttribute('position', new THREE.Float32BufferAttribute(mer, 3))
  g.dispose()
  return { rings, meridians, height: h, radius: Math.max(b.max.x - b.min.x, b.max.z - b.min.z) / 2 }
}

function Model({ parts, animate }: { parts: Part[]; animate: boolean }) {
  const urls = useMemo(() => Array.from(new Set(parts.map((p) => p.url))), [parts])
  const loaded = useLoader(STLLoader, urls)

  // Halka aralığı tüm lamba için ortak: toplam yüksekliğe göre (~15 halka).
  const totalH = useMemo(() => {
    const hs = new Map<string, number>()
    urls.forEach((u, i) => {
      loaded[i].computeBoundingBox()
      const bb = loaded[i].boundingBox!
      hs.set(u, bb.max.y - bb.min.y)
    })
    return parts.reduce((sum, p) => sum + (hs.get(p.url) ?? 0), 0)
  }, [parts, urls, loaded])

  const byUrl = useMemo(() => {
    const step = Math.max(1, totalH / 15)
    const map = new Map<string, PartDraw>()
    urls.forEach((url, i) => map.set(url, buildPart(loaded[i], step)))
    return map
  }, [urls, loaded, totalH])

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

  // Oda (zemin + duvar) dahil tüm sahneyi kutuya sığdır ve ortala. Yatayda
  // kenarlar maskeyle eridiği için genişlik biraz taşabilir.
  const H = layout.length
  const { size, camera } = useThree()
  const b = useMemo(() => projectedBounds(H), [H])
  const zoom = Math.min((size.height * 0.86) / (b.maxY - b.minY), (size.width * 1.1) / (b.maxX - b.minX))
  const cx = (b.minX + b.maxX) / 2
  const cy = (b.minY + b.maxY) / 2
  const ortho = camera as THREE.OrthographicCamera
  if (ortho.zoom !== zoom) {
    ortho.zoom = zoom
    ortho.updateProjectionMatrix()
  }

  return (
    // Hafif yukarıdan, köşeden bakış (aksonometrik çizim).
    <group position={[-cx, -cy, 0]}>
      <group rotation={TILT}>
        <Room height={H} radius={layout.radius} />
        <group ref={spin}>
          {layout.items.map(({ key, part, d, y }) => {
            const head = part.slotType === 'head'
            return (
              <group key={key} position={[0, y, 0]}>
                <Lines geometry={d.rings} color={head ? 'head' : 'edge'} opacity={head ? 0.85 : 0.6} />
                <Lines geometry={d.meridians} color={head ? 'head' : 'edge'} opacity={head ? 0.7 : 0.45} />
              </group>
            )
          })}
        </group>
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

/** Sıradaki ürünün STL'lerini görünmeden önbelleğe indirir; bitince haber verir. */
function Preload({ urls, onLoaded }: { urls: string[]; onLoaded?: () => void }) {
  useLoader(STLLoader, urls)
  useEffect(() => onLoaded?.(), [onLoaded])
  return null
}

/** Suspense çözülünce (STL'ler indi) bir kez haber verir. */
function Loaded({ onLoaded }: { onLoaded?: () => void }) {
  useEffect(() => onLoaded?.(), [onLoaded])
  return null
}

export default function HeroWireframeScene({
  parts,
  tone = 'night',
  preloadUrls,
  running,
  animate,
  onReady,
  onPreloaded,
}: {
  parts: Part[]
  /** Çizim tonu: karanlık temada "night", aydınlıkta "paper". */
  tone?: WireTone
  /** Sıradaki ürünün dosyaları: arka planda indirilir, sahneye girmez. */
  preloadUrls?: string[]
  onPreloaded?: () => void
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
      <ToneCtx.Provider value={TONES[tone]}>
      {running && animate && <Ticker />}
      <Suspense fallback={null}>
        <Model parts={parts} animate={animate} />
        <Loaded onLoaded={onReady} />
      </Suspense>
      {preloadUrls && preloadUrls.length > 0 && (
        <Suspense fallback={null}>
          <Preload key={preloadUrls.join('|')} urls={preloadUrls} onLoaded={onPreloaded} />
        </Suspense>
      )}
      </ToneCtx.Provider>
    </Canvas>
  )
}
