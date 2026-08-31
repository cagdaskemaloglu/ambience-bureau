'use client'

import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { useConfiguratorStore } from '@/lib/store/configurator'

const DEFAULT_DISTANCE = 350
const DEFAULT_TARGET_Y = 80

// İlk 3 parça (taban + gövde + başlık gibi standart bir kombinasyon) bu
// mesafede rahatça ekrana sığıyor — bu yüzden eşik altında hiç yeniden
// konumlama yapılmaz (gereksiz kamera sıçramalarından kaçınmak için).
const AUTO_FIT_PART_THRESHOLD = 4

// Kamera dikey görüş açısı — Scene.tsx'teki <Canvas camera={{ fov: 40 }}
// ile birebir aynı tutulmalı, aksi halde sığdırma hesaplaması yanlış çıkar.
const VERTICAL_FOV_DEG = 40
// Modelin üstünde/altında rahat bir boşluk payı bıraksın diye çarpan.
const FIT_MARGIN = 1.35

function distanceForHeight(totalHeight: number): number {
  if (totalHeight <= 0) return DEFAULT_DISTANCE
  const halfHeight = (totalHeight * FIT_MARGIN) / 2
  const halfFovRad = (VERTICAL_FOV_DEG * Math.PI) / 180 / 2
  const raw = halfHeight / Math.tan(halfFovRad)
  return Math.max(DEFAULT_DISTANCE, raw)
}

/**
 * Kamerayı, verilen mesafeye göre sabit izometrik açıyla (mevcut tasarımla
 * aynı 0.6/0.45/0.6 oranı) konumlandırır ve stack'in dikey ortasına bakar.
 */
function positionCamera(
  camera: { position: { set: (x: number, y: number, z: number) => void }; lookAt: (x: number, y: number, z: number) => void },
  controls: { target?: { set: (x: number, y: number, z: number) => void }; update?: () => void } | null,
  distance: number,
  targetY: number
) {
  if (controls?.target) {
    controls.target.set(0, targetY, 0)
    controls.update?.()
  }
  camera.position.set(distance * 0.6, distance * 0.45, distance * 0.6)
  camera.lookAt(0, targetY, 0)
}

/**
 * Kamera konumlandırma üç durumda tetiklenir:
 *  1. Koleksiyon değiştiğinde — sabit, genel bir başlangıç pozisyonuna döner.
 *  2. Parça sayısı AUTO_FIT_PART_THRESHOLD'a (4) ulaştığında/aştığında ve
 *     her yeni parça eklendiğinde — gerçek ölçülen stack yüksekliğine göre
 *     kamera otomatik olarak geriye gidip modeli tekrar ekrana sığdırır.
 *     3 parçaya kadar kamera hareket ETMEZ (mevcut mesafe zaten yeterli).
 *  3. Kullanıcı "Kamerayı Sığdır" butonuna bastığında (cameraFitRequestId
 *     artınca) — parça sayısından bağımsız olarak, doğru başlangıç açısıyla
 *     ANINDA yeniden sığdırır.
 */
export function CameraFit() {
  const collectionKey = useConfiguratorStore((s) => s.collectionKey)
  const stackTotalHeight = useConfiguratorStore((s) => s.stackTotalHeight)
  const stackPartCount = useConfiguratorStore((s) => s.stackPartCount)
  const cameraFitRequestId = useConfiguratorStore((s) => s.cameraFitRequestId)
  const { camera, controls } = useThree()

  const lastCollectionKey = useRef<string | null>(null)
  const lastAutoFitPartCount = useRef<number>(0)
  const lastFitRequestId = useRef<number>(0)

  // 1) Koleksiyon değişince: sabit başlangıç pozisyonu
  useEffect(() => {
    if (!collectionKey || collectionKey === lastCollectionKey.current) return
    lastCollectionKey.current = collectionKey
    lastAutoFitPartCount.current = 0
    // @ts-expect-error - drei'nin OrbitControls tipi eksik olabilir
    positionCamera(camera, controls, DEFAULT_DISTANCE, DEFAULT_TARGET_Y)
  }, [collectionKey, camera, controls])

  // 2) 4. parçadan itibaren, her parça eklendiğinde otomatik yeniden sığdır
  useEffect(() => {
    if (stackPartCount < AUTO_FIT_PART_THRESHOLD) {
      lastAutoFitPartCount.current = stackPartCount
      return
    }
    if (stackPartCount === lastAutoFitPartCount.current) return
    lastAutoFitPartCount.current = stackPartCount

    const distance = distanceForHeight(stackTotalHeight)
    const targetY = stackTotalHeight > 0 ? stackTotalHeight / 2 : DEFAULT_TARGET_Y
    // @ts-expect-error - drei'nin OrbitControls tipi eksik olabilir
    positionCamera(camera, controls, distance, targetY)
  }, [stackPartCount, stackTotalHeight, camera, controls])

  // 3) Manuel "Kamerayı Sığdır" butonu — parça sayısından bağımsız olarak
  // her zaman doğru mesafeyi/açıyı uygular.
  useEffect(() => {
    if (cameraFitRequestId === lastFitRequestId.current) return
    lastFitRequestId.current = cameraFitRequestId

    const distance = distanceForHeight(stackTotalHeight)
    const targetY = stackTotalHeight > 0 ? stackTotalHeight / 2 : DEFAULT_TARGET_Y
    // @ts-expect-error - drei'nin OrbitControls tipi eksik olabilir
    positionCamera(camera, controls, distance, targetY)
  }, [cameraFitRequestId, stackTotalHeight, camera, controls])

  return null
}