'use client'

import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSTLGeometry, useGLTFGeometry, isGLTFUrl } from '@/lib/hooks/useModelGeometry'

export interface PartDimensions {
  width: number
  height: number
  depth: number
  // Model, kendi yerel orijinine göre X/Z eksenlerinde ille de ortalanmış
  // olmayabilir — toplam model bounding box'ını (LampModel.tsx'te) doğru
  // hesaplayabilmek için ham min/max değerleri de taşıyoruz.
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

interface ModelMeshProps {
  url: string
  color: string
  roughness: number
  metalness: number
  position?: [number, number, number]
  onDimensionsCalculated?: (dimensions: PartDimensions) => void
  /**
   * Yarı saydam filament malzemeleri için (bkz. material.ts'teki
   * isTranslucent/opacity alanları). Verilmezse (opak malzeme) tamamen
   * dolgun render edilir.
   */
  opacity?: number
  /**
   * Bu parçanın kendi ışık mekanizmasını barındırdığını (başlık/head)
   * belirtir — verilirse malzeme, hedef yoğunluğa doğru yumuşakça
   * (useFrame damp ile) parlayıp sönen bir "emissive" kazanır. Mesafeye
   * bağlı gerçek ışık (LightSimulator) fiziksel olarak çok zayıf kaldığı
   * için, "ışığın görünür etkisi" burada garanti ediliyor — ayrı bir
   * obje eklemeden, parçanın kendi malzemesi parlıyor.
   */
  glowColor?: string
  targetGlowIntensity?: number
}

function useReportDimensions(
  geometry: THREE.BufferGeometry,
  onDimensionsCalculated?: (dimensions: PartDimensions) => void
) {
  useEffect(() => {
    if (!onDimensionsCalculated) return
    if (!geometry.boundingBox) geometry.computeBoundingBox()
    const box = geometry.boundingBox
    if (!box) return
    onDimensionsCalculated({
      width: box.max.x - box.min.x,
      height: box.max.y - box.min.y,
      depth: box.max.z - box.min.z,
      minX: box.min.x,
      maxX: box.max.x,
      minZ: box.min.z,
      maxZ: box.max.z,
    })
  }, [geometry, onDimensionsCalculated])
}

function useGlowMaterial(
  materialRef: React.RefObject<THREE.MeshStandardMaterial | null>,
  glowColor: string | undefined,
  targetGlowIntensity: number | undefined
) {
  const currentIntensity = useRef(0)

  useFrame((_, delta) => {
    const material = materialRef.current
    if (!material) return
    const target = targetGlowIntensity ?? 0
    currentIntensity.current = THREE.MathUtils.damp(currentIntensity.current, target, 6, delta)
    material.emissiveIntensity = currentIntensity.current
    if (glowColor) material.emissive.set(glowColor)
  })
}

function STLMesh({ url, color, roughness, metalness, position = [0, 0, 0], onDimensionsCalculated, opacity, glowColor, targetGlowIntensity }: ModelMeshProps) {
  const geometry = useSTLGeometry(url)
  useReportDimensions(geometry, onDimensionsCalculated)
  const materialRef = useRef<THREE.MeshStandardMaterial>(null)
  useGlowMaterial(materialRef, glowColor, targetGlowIntensity)

  return (
    <mesh geometry={geometry} position={position} castShadow receiveShadow>
      <meshStandardMaterial
        ref={materialRef}
        color={color}
        roughness={roughness}
        metalness={metalness}
        emissive="#000000"
        emissiveIntensity={0}
        opacity={opacity ?? 1}
        transparent={opacity !== undefined && opacity < 1}
      />
    </mesh>
  )
}

function GLTFMesh({ url, color, roughness, metalness, position = [0, 0, 0], onDimensionsCalculated, opacity, glowColor, targetGlowIntensity }: ModelMeshProps) {
  const geometry = useGLTFGeometry(url)
  useReportDimensions(geometry, onDimensionsCalculated)
  const materialRef = useRef<THREE.MeshStandardMaterial>(null)
  useGlowMaterial(materialRef, glowColor, targetGlowIntensity)

  return (
    <mesh geometry={geometry} position={position} castShadow receiveShadow>
      <meshStandardMaterial
        ref={materialRef}
        color={color}
        roughness={roughness}
        metalness={metalness}
        emissive="#000000"
        emissiveIntensity={0}
        opacity={opacity ?? 1}
        transparent={opacity !== undefined && opacity < 1}
      />
    </mesh>
  )
}

export function ModelMesh(props: ModelMeshProps) {
  return isGLTFUrl(props.url) ? <GLTFMesh {...props} /> : <STLMesh {...props} />
}