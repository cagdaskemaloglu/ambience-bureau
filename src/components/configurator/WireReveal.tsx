'use client'

import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { sliceLocal } from '@/lib/three/wireSlices'

export type RevealPhase = 'hidden' | 'reveal'

/** Malzemenin alttan üste açılma süresi. */
const SWEEP_MS = 1100
/** Süpürme bitince tel kafesin sönme süresi. */
const FADE_MS = 300
/** Tel kafes yanıp sönme adımı. */
const BLINK_MS = 85
const WIRE_COLOR = '#a9c8ff'
const SCAN_COLOR = '#f2a35e'

type Tracked = { mesh: THREE.Mesh; lines: THREE.LineSegments }

/**
 * Anasayfadaki gömülü stüdyonun açılışı: tel kafesten materyalli görünüme.
 *  - 'hidden': stüdyo hazırlanırken model kırpılıdır (görünmez), yalnızca
 *    halka + meridyen tel kafesi vardır (anasayfa sahnesindeki çizimin aynısı).
 *  - 'reveal': yatay bir kesme düzlemi tabandan tepeye çıkar; altında kalan
 *    parçalar materyalli açılır, üstünde kalan tel kafes yanıp söner. Düzlem
 *    tepeyi geçince tel kafes söner ve her şey normale döner.
 * Kırpma, malzeme başına (localClipping) uygulanır; zemin ızgarası etkilenmez.
 */
export function WireReveal({ phase }: { phase: RevealPhase }) {
  const { scene, gl, invalidate } = useThree()
  const below = useRef(new THREE.Plane(new THREE.Vector3(0, -1, 0), 0)) // y <= c kalır
  const above = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)) // y >= c kalır
  const tracked = useRef<Tracked[]>([])
  const wireMat = useRef(
    new THREE.LineBasicMaterial({
      color: WIRE_COLOR,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      clippingPlanes: [above.current],
    })
  )
  const scan = useRef<THREE.Mesh | null>(null)
  const startedAt = useRef<number | null>(null)
  const done = useRef(false)

  useEffect(() => {
    gl.localClippingEnabled = true
  }, [gl])

  // Yeni bir açılış: durum sıfırlanır.
  useEffect(() => {
    if (phase === 'hidden') {
      done.current = false
      startedAt.current = null
    }
    invalidate()
  }, [phase, invalidate])

  const cleanup = () => {
    for (const t of tracked.current) {
      t.mesh.remove(t.lines)
      t.lines.geometry.dispose()
      const m = t.mesh.material as THREE.Material
      if (m && m.clippingPlanes) {
        m.clippingPlanes = null
        m.needsUpdate = true
      }
      delete t.mesh.userData.wireReveal
    }
    tracked.current = []
    if (scan.current) {
      scan.current.parent?.remove(scan.current)
      scan.current.geometry.dispose()
      ;(scan.current.material as THREE.Material).dispose()
      scan.current = null
    }
  }
  useEffect(
    () => () => {
      cleanup()
      wireMat.current.dispose()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  useFrame(() => {
    if (done.current) return
    const group = scene.getObjectByName('lamp-model')
    if (!group) return

    // Modelin dünya sınırları (süpürme aralığı ve halka aralığı).
    const box = new THREE.Box3().setFromObject(group)
    if (box.isEmpty()) return
    const minY = box.min.y
    const maxY = box.max.y
    const height = Math.max(1, maxY - minY)

    // Yeni gelen her parça: malzemesi kırpılır, tel kafesi eklenir.
    group.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh || mesh.userData.wireReveal) return
      mesh.userData.wireReveal = true
      const m = mesh.material as THREE.Material
      m.clippingPlanes = [below.current]
      m.needsUpdate = true
      const pts = sliceLocal(mesh.geometry, height / 22 / Math.max(mesh.scale.y, 1e-6))
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
      const lines = new THREE.LineSegments(g, wireMat.current)
      lines.renderOrder = 2
      mesh.add(lines)
      tracked.current.push({ mesh, lines })
    })

    if (!scan.current) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.98, 1, 64),
        new THREE.MeshBasicMaterial({ color: SCAN_COLOR, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })
      )
      ring.rotation.x = -Math.PI / 2
      scene.add(ring)
      scan.current = ring
    }
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const r = Math.max(size.x, size.z) * 0.62 + 4
    scan.current.scale.set(r, r, 1)

    const now = performance.now()
    // Saat, model sahnede belirdiği ilk karede başlar (parçası geç yüklenen
    // modelde süpürme kaçmasın).
    if (phase === 'reveal' && startedAt.current === null) startedAt.current = now
    let c = minY - 1
    let wireOpacity = 0.9
    let scanOpacity = 0
    if (phase === 'reveal' && startedAt.current !== null) {
      const t = Math.min(1, (now - startedAt.current) / SWEEP_MS)
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
      c = minY - 1 + (height + 2) * eased
      const blink = Math.floor((now - startedAt.current) / BLINK_MS) % 2 === 0
      wireOpacity = blink ? 0.95 : 0.25
      scanOpacity = t < 1 ? 0.9 : 0
      if (t >= 1) {
        const f = Math.min(1, (now - startedAt.current - SWEEP_MS) / FADE_MS)
        wireOpacity = 0.9 * (1 - f)
        if (f >= 1) {
          cleanup()
          done.current = true
          return
        }
      }
    } else {
      // Hazırlanırken: tel kafes yavaşça nefes alır.
      wireOpacity = 0.55 + 0.35 * Math.sin(now / 240)
    }
    below.current.constant = c
    above.current.constant = -c
    wireMat.current.opacity = wireOpacity
    scan.current.position.set(center.x, c, center.z)
    ;(scan.current.material as THREE.MeshBasicMaterial).opacity = scanOpacity
  })

  return null
}
