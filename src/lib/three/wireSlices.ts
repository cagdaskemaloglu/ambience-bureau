import type * as THREE from 'three'

/**
 * Bir parçayı y = c düzlemiyle keser: kesit çizgileri (segment çiftleri).
 * Üçgen ağı yerine bu "halkalar" çizilir;
 * organik formlarda bile temiz, teknik çizim gibi okunur.
 */
export function sliceAt(pos: ArrayLike<number>, c: number, out: number[]) {
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
export function sliceMeridian(pos: ArrayLike<number>, nx: number, nz: number, out: number[]) {
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
export const MERIDIANS = [0, 45, 90, 135].map((deg) => [Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180)] as const)

/**
 * Bir geometrinin halka + meridyen çizgileri, geometrinin KENDİ yerel
 * koordinatlarında (çizgiler mesh'in çocuğu olarak eklenirse birebir oturur).
 * Meridyenler parçanın yatay merkezinden geçer.
 */
export function sliceLocal(geometry: THREE.BufferGeometry, ringStep: number): number[] {
  const src = geometry.index ? geometry.toNonIndexed() : geometry
  const arr = src.attributes.position.array as ArrayLike<number>
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity
  for (let i = 0; i < arr.length; i += 3) {
    const x = arr[i], y = arr[i + 1], z = arr[i + 2]
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
    if (z < minZ) minZ = z
    if (z > maxZ) maxZ = z
  }
  const cx = (minX + maxX) / 2
  const cz = (minZ + maxZ) / 2
  const pos = new Float32Array(arr.length)
  for (let i = 0; i < arr.length; i += 3) {
    pos[i] = arr[i] - cx
    pos[i + 1] = arr[i + 1]
    pos[i + 2] = arr[i + 2] - cz
  }
  if (src !== geometry) src.dispose()
  const h = maxY - minY
  const out: number[] = []
  if (!(h > 0)) return out
  const eps = h * 0.012
  const n = Math.max(1, Math.round((h - 2 * eps) / Math.max(ringStep, 1e-6)))
  for (let i = 0; i <= n; i++) sliceAt(pos, minY + eps + ((h - 2 * eps) * i) / n, out)
  for (const [nx, nz] of MERIDIANS) sliceMeridian(pos, nx, nz, out)
  for (let i = 0; i < out.length; i += 3) {
    out[i] += cx
    out[i + 2] += cz
  }
  return out
}
