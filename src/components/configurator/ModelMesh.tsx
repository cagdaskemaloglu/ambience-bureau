'use client'

import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSTLGeometry, useGLTFGeometry, isGLTFUrl } from '@/lib/hooks/useModelGeometry'

interface ModelMeshProps {
  url: string
  color: string
  roughness: number
  metalness: number
  position?: [number, number, number]
  onHeightCalculated?: (height: number) => void
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

function STLMesh({ url, color, roughness, metalness, position = [0, 0, 0], onHeightCalculated, opacity, glowColor, targetGlowIntensity }: ModelMeshProps) {
  const geometry = useSTLGeometry(url)
  useReportHeight(geometry, onHeightCalculated)
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

function GLTFMesh({ url, color, roughness, metalness, position = [0, 0, 0], onHeightCalculated, opacity, glowColor, targetGlowIntensity }: ModelMeshProps) {
  const geometry = useGLTFGeometry(url)
  useReportHeight(geometry, onHeightCalculated)
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