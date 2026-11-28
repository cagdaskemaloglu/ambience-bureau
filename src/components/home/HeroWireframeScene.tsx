'use client'

import { createContext, Suspense, useContext, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import * as THREE from 'three'
import type { HeroWireframeData } from '@/lib/queries'
import { normalizeUnits } from '@/lib/three/normalizeUnits'

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
/** Sahnenin çizdiği nesne: parçalar + yerleşim biçimi. */
export type SceneItem = { parts: Part[]; kind?: HeroWireframeData['kind']; hanging?: boolean }

const TILT: [number, number, number] = [0.38, -0.62, 0]

/** Odanın ölçüleri (lamba yüksekliğine oranlı, ızgara adımına yuvarlanmış). */
function roomDims(height: number, R = 0) {
  // Oda hem lambanın yüksekliğine hem de taban izine (R: eksenden en uzak
  // yatay nokta) göre büyür — geniş/kollu masa lambaları odadan taşmasın.
  const size = Math.max(height, R * 2)
  const step = Math.max(4, Math.round(size / 14))
  const snap = (v: number) => Math.max(step, Math.round(v / step) * step)
  return {
    step,
    half: snap(Math.max(height * 0.55, R * 1.5)),
    wallZ: -snap(Math.max(height * 0.38, R * 1.35)),
    front: snap(Math.max(height * 0.24, R * 1.25)),
    wallH: snap(Math.max(height * 1.08, R * 1.2)),
  }
}

/**
 * Oda (zemin + duvar) ve lamba bu açıyla döndürüldüğünde ekrandaki sınır
 * kutusu — kadraj tüm odayı içine alacak şekilde hesaplanır; duvar üstten
 * kesilip "ikinci bir ızgara" gibi görünmez.
 */
function projectedBounds(height: number, R: number, lampBase: number, lampTop: number, ceiling: boolean) {
  const { half, wallZ, front, wallH } = roomDims(height, R)
  const e = new THREE.Euler(...TILT)
  const raw: number[][] = [
    [-half, 0, wallZ], [half, 0, wallZ], [-half, 0, front], [half, 0, front],
    [-half, wallH, wallZ], [half, wallH, wallZ], [0, lampTop, 0],
  ]
  if (ceiling) raw.push([-half, wallH, front], [half, wallH, front])
  // Lambanın kendisi (dönerken kapladığı silindirin köşeleri) de kadrajda.
  for (const y of [lampBase, lampTop]) raw.push([-R, y, -R], [R, y, -R], [-R, y, R], [R, y, R])
  const pts = raw.map(([x, y, z]) => new THREE.Vector3(x, y, z).applyEuler(e))
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

function Room({ height, radius, hanging, lampTop }: { height: number; radius: number; hanging?: boolean; lampTop: number }) {
  const tone = useContext(ToneCtx)
  const geo = useMemo(() => {
    const { step, half, wallZ, front, wallH } = roomDims(height, radius)

    const floor = gridGeometry(-half, half, wallZ, front, step, (u, v) => [u, 0, v])
    const wall = gridGeometry(-half, half, 0, wallH, step, (u, v) => [u, v, wallZ])

    // Priz: duvarda, lambanın sağında, alçakta.
    // Priz lambanın taban izinin dışında kalsın.
    const sx = Math.round(Math.min(half * 0.9, Math.max(half * 0.55, radius * 1.25)))
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
    // Sarkıt: tavan ızgarası, tavan göbeği ve lambaya inen kordon.
    let ceiling: THREE.BufferGeometry | null = null
    let rose: THREE.BufferGeometry | null = null
    let cord: THREE.BufferGeometry | null = null
    if (hanging) {
      ceiling = gridGeometry(-half, half, wallZ, front, step, (u, v) => [u, wallH, v])
      rose = new THREE.EdgesGeometry(new THREE.CylinderGeometry(step * 0.45, step * 0.45, step * 0.18, 20))
      rose.translate(0, wallH - step * 0.09, 0)
      cord = new THREE.BufferGeometry()
      cord.setAttribute('position', new THREE.Float32BufferAttribute([0, wallH - step * 0.18, 0, 0, lampTop, 0], 3))
    }
    return { floor, wall, plate, plug, cable, edges, ceiling, rose, cord }
  }, [height, radius, tone, hanging, lampTop])

  return (
    <group>
      <Lines geometry={geo.floor} color="room" opacity={0.2} />
      <Lines geometry={geo.wall} color="room" opacity={0.15} />
      <Lines geometry={geo.edges} color="room" opacity={0.5} />
      {geo.ceiling && <Lines geometry={geo.ceiling} color="room" opacity={0.1} />}
      {geo.rose && <Lines geometry={geo.rose} color="edge" opacity={0.8} />}
      {geo.cord && <Lines geometry={geo.cord} color="edge" opacity={0.85} />}
      {!hanging && (
        <>
          <Lines geometry={geo.plate} color="edge" opacity={0.8} />
          <Lines geometry={geo.plug} color="edge" opacity={0.9} />
          <primitive object={geo.cable} />
        </>
      )}
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

/**
 * Bir parçanın halka + meridyen çizimi. `centered`: geometri tamamen
 * merkezlenir (üst üste istif). Aksi halde (Blender konumu) yalnızca
 * yatayda kendi ekseninde merkezlenir, yükseklik korunur.
 */
function buildPart(g0: THREE.BufferGeometry, ringStep: number, centered = true): PartDraw & { cx: number; cz: number; minY: number } {
  const g = g0.index ? g0.toNonIndexed() : g0.clone()
  g.computeBoundingBox()
  const b0 = g.boundingBox!
  const cx = (b0.min.x + b0.max.x) / 2
  const cz = (b0.min.z + b0.max.z) / 2
  const cy = (b0.min.y + b0.max.y) / 2
  g.translate(-cx, centered ? -cy : 0, -cz)
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
  return {
    rings,
    meridians,
    height: h,
    radius: Math.max(b.max.x - b.min.x, b.max.z - b.min.z) / 2,
    cx,
    cz,
    minY: b.min.y,
  }
}

type DrawItem = { key: string; glow: boolean; d: PartDraw; pos: [number, number, number] }

/** Sarkıtın kordon uzunluğu (lamba yüksekliğine oranla) ve oda yüksekliği çarpanı. */
const HANG_CORD = 0.35
const HANG_ROOM = 2.3

function Model({ item, animate }: { item: SceneItem; animate: boolean }) {
  const { parts, kind, hanging } = item
  const urls = useMemo(() => Array.from(new Set(parts.map((p) => p.url))), [parts])
  const raw = useLoader(STLLoader, urls)
  // Metre biriminde dışa aktarılmış dosyalar milimetreye çevrilir (bkz. normalizeUnits).
  const loaded = useMemo(() => raw.map((g) => normalizeUnits(g.clone())), [raw])

  const layout = useMemo(() => {
    const geoOf = (url: string) => loaded[urls.indexOf(url)]

    if (kind !== 'placed') {
      // ÜST ÜSTE: taban → gövdeler → başlık, her parça merkezlenip istiflenir.
      const totalH = parts.reduce((sum, p) => {
        const g = geoOf(p.url)
        g.computeBoundingBox()
        return sum + (g.boundingBox!.max.y - g.boundingBox!.min.y)
      }, 0)
      const step = Math.max(1, totalH / 15)
      const cache = new Map<string, PartDraw>()
      let y = 0
      let radius = 0
      const items: DrawItem[] = parts.map((p, i) => {
        let d = cache.get(p.url)
        if (!d) {
          d = buildPart(geoOf(p.url), step, true)
          cache.set(p.url, d)
        }
        const pos: [number, number, number] = [0, y + d.height / 2, 0]
        y += d.height
        radius = Math.max(radius, d.radius)
        return { key: `${i}-${p.slotType}`, glow: !!p.glow || p.slotType === 'head', d, pos }
      })
      return { items, H: y, radius }
    }

    // BLENDER KONUMU: parçalar Sanity'deki rotasyon + ofsetle yerleşir.
    const placed = parts.map((p) => {
      const g = geoOf(p.url).clone()
      const r = p.rot ?? [0, 0, 0]
      if (r[0] || r[1] || r[2]) {
        g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(
          THREE.MathUtils.degToRad(r[0]), THREE.MathUtils.degToRad(r[1]), THREE.MathUtils.degToRad(r[2])
        )))
      }
      const o = p.offset ?? [0, 0, 0]
      if (o[0] || o[1] || o[2]) g.translate(o[0], o[1], o[2])
      g.computeBoundingBox()
      return { p, g, b: g.boundingBox!.clone() }
    })
    const all = new THREE.Box3()
    placed.forEach(({ b }) => all.union(b))
    const H = all.max.y - all.min.y
    const gcx = (all.min.x + all.max.x) / 2
    const gcz = (all.min.z + all.max.z) / 2
    const step = Math.max(1, H / 15)
    let radius = 0
    const items: DrawItem[] = placed.map(({ p, g }, i) => {
      const d = buildPart(g, step, false)
      g.dispose()
      radius = Math.max(radius, Math.max(Math.abs(d.cx - gcx), Math.abs(d.cz - gcz)) + d.radius)
      // Lambanın tabanı y = 0'da (sarkıtta aşağıda yukarı kaydırılır).
      return { key: `${i}-part`, glow: !!p.glow, d, pos: [d.cx - gcx, -all.min.y, d.cz - gcz] }
    })
    return { items, H, radius }
  }, [parts, kind, urls, loaded])

  const spin = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    if (animate && spin.current) spin.current.rotation.y += delta * 0.25
  })

  // Oda: ayaklı lambada lamba boyunda; sarkıtta daha yüksek, lamba tavandan
  // kısa bir kordonla sarkar.
  const H = layout.H
  const roomH = hanging ? H * HANG_ROOM : H
  const R = layout.radius
  const wallH = roomDims(roomH, R).wallH
  const lampBase = hanging ? Math.max(0, wallH - H * (1 + HANG_CORD)) : 0
  const lampTop = lampBase + H

  // Oda (zemin + duvar [+ tavan]) dahil tüm sahneyi kutuya sığdır ve ortala.
  const { size, camera } = useThree()
  const b = useMemo(() => projectedBounds(roomH, R, lampBase, lampTop, !!hanging), [roomH, R, lampBase, lampTop, hanging])
  // Sahne header'a kadar uzanır: üstte yalnızca küçük bir pay, altta künye
  // satırları için yer. Yatayda kenarlar maskeyle eridiği için biraz taşabilir.
  const PAD_TOP = 10
  const PAD_BOTTOM = 64
  const zoom = Math.min(
    Math.max(1, size.height - PAD_TOP - PAD_BOTTOM) / (b.maxY - b.minY),
    (size.width * 1.1) / (b.maxX - b.minX)
  )
  const cx = (b.minX + b.maxX) / 2
  // Odanın en üst noktası ekranın üstünden PAD_TOP aşağıda dursun.
  const cy = b.maxY - (size.height / 2 - PAD_TOP) / zoom
  const ortho = camera as THREE.OrthographicCamera
  if (ortho.zoom !== zoom) {
    ortho.zoom = zoom
    ortho.updateProjectionMatrix()
  }

  return (
    // Hafif yukarıdan, köşeden bakış (aksonometrik çizim).
    <group position={[-cx, -cy, 0]}>
      <group rotation={TILT}>
        <Room height={roomH} radius={layout.radius} hanging={hanging} lampTop={lampTop} />
        <group ref={spin} position={[0, lampBase, 0]}>
          {layout.items.map(({ key, glow, d, pos }) => (
            <group key={key} position={pos}>
              <Lines geometry={d.rings} color={glow ? 'head' : 'edge'} opacity={glow ? 0.85 : 0.6} />
              <Lines geometry={d.meridians} color={glow ? 'head' : 'edge'} opacity={glow ? 0.7 : 0.45} />
            </group>
          ))}
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
  item,
  tone = 'night',
  preloadUrls,
  running,
  animate,
  onReady,
  onPreloaded,
}: {
  item: SceneItem
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
        <Model item={item} animate={animate} />
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
