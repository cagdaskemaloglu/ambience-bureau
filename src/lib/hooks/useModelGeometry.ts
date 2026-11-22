'use client'

import { useMemo } from 'react'
import { useLoader } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as THREE from 'three'

export function isGLTFUrl(url: string): boolean {
  return url.endsWith('.glb') || url.endsWith('.gltf')
}

/**
 * `centered` (varsayılan): geometri kendi merkezine taşınır — "üst üste"
 * yerleşimde parçalar bu merkezden istiflenir.
 * `centered: false`: Blender'dan ortak orijinle aktarılan konum KORUNUR
 * ("Blender konumu" yerleşimi — masa lambası, aplik, sarkıt...).
 */
export function useSTLGeometry(url: string, centered = true): THREE.BufferGeometry {
  const geometry = useLoader(STLLoader, url)
  return useMemo(() => {
    const cloned = geometry.clone()
    cloned.computeVertexNormals()
    if (centered) cloned.center()
    cloned.computeBoundingBox()
    return cloned
  }, [geometry, centered])
}

export function useGLTFGeometry(url: string, centered = true): THREE.BufferGeometry {
  const gltf = useLoader(GLTFLoader, url)
  return useMemo(() => {
    // "Blender konumu" yerleşiminde düğümün dünya dönüşümü (konum/rotasyon)
    // geometriye işlenir; aksi halde GLB'deki konum kaybolurdu.
    if (!centered) gltf.scene.updateMatrixWorld(true)
    let foundGeometry: THREE.BufferGeometry | null = null
    gltf.scene.traverse((child) => {
      if (!foundGeometry && (child as THREE.Mesh).isMesh) {
        const g = (child as THREE.Mesh).geometry.clone()
        if (!centered) g.applyMatrix4(child.matrixWorld)
        foundGeometry = g
      }
    })
    const result: THREE.BufferGeometry = foundGeometry ?? new THREE.BoxGeometry(1, 1, 1)
    result.computeBoundingBox()
    return result
  }, [gltf, centered])
}

/**
 * Koleksiyon seçilince tüm part URL'lerini Three.js cache'ine önceden yükler.
 * Böylece kullanıcı parçaya tıkladığında model zaten hazırdır — Suspense
 * fallback'i tetiklenmez, model yanıp sönmez.
 */
export function preloadModelUrls(urls: string[]): void {
  for (const url of urls) {
    if (isGLTFUrl(url)) {
      useGLTF.preload(url)
    } else {
      // STL için Three.js'in built-in FileLoader cache'ini kullan
      useLoader.preload(STLLoader, url)
    }
  }
}