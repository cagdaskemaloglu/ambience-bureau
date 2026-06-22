'use client'

import { useMemo } from 'react'
import { useLoader } from '@react-three/fiber'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as THREE from 'three'

/**
 * STL geometrisini yükler ve normalize eder (normal hesaplama + merkezleme).
 * Bounding box bilgisini de geometry.boundingBox üzerinden hesaplar,
 * böylece gerçek model boyutu Sanity'deki elle girilen değerden
 * bağımsız olarak da okunabilir.
 * Bu hook'u çağıran component Suspense ile sarılmalı (useLoader async'tir).
 */
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

/**
 * GLTF/GLB modelinden ilk mesh'in geometrisini çıkarır.
 * Bu hook'u çağıran component Suspense ile sarılmalı (useLoader async'tir).
 */
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
 * URL uzantısına göre STL veya GLTF olduğunu belirler.
 * Component seviyesinde hangi hook'un çağrılacağına karar vermek için kullanılır
 * (örn. <ModelMesh url={x}> component'i içinde if/else ile useSTLGeometry veya
 * useGLTFGeometry'den birini, koşulsuz tek bir branch'te çağırır).
 */
export function isGLTFUrl(url: string): boolean {
  return url.endsWith('.glb') || url.endsWith('.gltf')
}
