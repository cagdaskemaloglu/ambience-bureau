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

export function useSTLGeometry(url: string): THREE.BufferGeometry {
  const geometry = useLoader(STLLoader, url)
  return useMemo(() => {
    const cloned = geometry.clone()
    cloned.computeVertexNormals()
    cloned.computeBoundingBox()
    cloned.center()
    return cloned
  }, [geometry])
}

export function useGLTFGeometry(url: string): THREE.BufferGeometry {
  const gltf = useLoader(GLTFLoader, url)
  return useMemo(() => {
    let foundGeometry: THREE.BufferGeometry | null = null
    gltf.scene.traverse((child) => {
      if (!foundGeometry && (child as THREE.Mesh).isMesh) {
        foundGeometry = (child as THREE.Mesh).geometry.clone()
      }
    })
    return foundGeometry ?? new THREE.BoxGeometry(1, 1, 1)
  }, [gltf])
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