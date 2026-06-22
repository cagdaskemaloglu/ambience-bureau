'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useSTLGeometry, useGLTFGeometry, isGLTFUrl } from '@/lib/hooks/useModelGeometry'

interface ModelMeshProps {
  url: string
  color: string
  roughness: number
  metalness: number
  position?: [number, number, number]
  onHeightCalculated?: (height: number) => void
}

function useReportHeight(
  geometry: THREE.BufferGeometry,
  onHeightCalculated?: (height: number) => void
) {
  useEffect(() => {
    if (!onHeightCalculated) return
    if (!geometry.boundingBox) geometry.computeBoundingBox()
    const box = geometry.boundingBox
    if (!box) return
    const height = box.max.y - box.min.y
    onHeightCalculated(height)
  }, [geometry, onHeightCalculated])
}

function STLMesh({ url, color, roughness, metalness, position = [0, 0, 0], onHeightCalculated }: ModelMeshProps) {
  const geometry = useSTLGeometry(url)
  const meshRef = useRef<THREE.Mesh>(null)
  useReportHeight(geometry, onHeightCalculated)

  return (
    <mesh ref={meshRef} geometry={geometry} position={position} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
    </mesh>
  )
}

function GLTFMesh({ url, color, roughness, metalness, position = [0, 0, 0], onHeightCalculated }: ModelMeshProps) {
  const geometry = useGLTFGeometry(url)
  const meshRef = useRef<THREE.Mesh>(null)
  useReportHeight(geometry, onHeightCalculated)

  return (
    <mesh ref={meshRef} geometry={geometry} position={position} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
    </mesh>
  )
}

/**
 * URL'in uzantısına göre doğru mesh component'ini (STL veya GLTF) render eder.
 * Hangi component'in render edileceği JSX seviyesinde seçildiği için
 * React Hooks kurallarını ihlal etmez.
 *
 * onHeightCalculated: geometri yüklendiğinde gerçek bounding box yüksekliğini
 * (Three.js birimlerinde, STL/GLB dosyasındaki ham ölçek) bildirir.
 * LampModel bu değeri kullanarak parçaları doğru aralıkla istifler —
 * Sanity'deki elle girilen `dimensions.height` alanına bağımlı kalınmaz.
 */
export function ModelMesh(props: ModelMeshProps) {
  return isGLTFUrl(props.url) ? <GLTFMesh {...props} /> : <STLMesh {...props} />
}
