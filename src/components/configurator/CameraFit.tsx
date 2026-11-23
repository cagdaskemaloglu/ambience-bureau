'use client'

import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { useConfiguratorStore } from '@/lib/store/configurator'

export const DEFAULT_DISTANCE = 350
export const DEFAULT_TARGET_Y = 80

// İlk 3 parça (taban + gövde + başlık gibi standart bir kombinasyon) bu
// mesafede rahatça ekrana sığıyor — bu yüzden eşik altında hiç yeniden
// konumlama yapılmaz (gereksiz kamera sıçramalarından kaçınmak için).
const AUTO_FIT_PART_THRESHOLD = 4

// Kamera dikey görüş açısı — Scene.tsx'teki <Canvas camera={{ fov: 40 }}
// ile birebir aynı tutulmalı, aksi halde sığdırma hesaplaması yanlış çıkar.
const VERTICAL_FOV_DEG = 40
// Modelin üstünde/altında rahat bir boşluk payı bıraksın diye çarpan.
const FIT_MARGIN = 1.35
const MODEL_FIT_MARGIN = 1.8

// Orijinal sabit izometrik kamera açısı (position = d*0.6, d*0.45, d*0.6)
// azimuth=45° / elevation≈27.94°'ye karşılık gelir. Bunu azimuth'u
// parametreleştirerek koruyoruz (product spin kareleri için farklı
// açılara ihtiyaç var — bkz. SpinCaptureHook.tsx) — azimuthDeg=45
// verildiğinde eski davranışla BİREBİR aynı sonucu üretir.
export const ISO_AZIMUTH_DEG = 45
const ISO_ELEVATION_RAD = Math.atan2(0.45, Math.sqrt(0.6 ** 2 + 0.6 ** 2))

export function distanceForHeight(totalHeight: number): number {
  if (totalHeight <= 0) return DEFAULT_DISTANCE
  const halfHeight = (totalHeight * FIT_MARGIN) / 2
  const halfFovRad = (VERTICAL_FOV_DEG * Math.PI) / 180 / 2
  const raw = halfHeight / Math.tan(halfFovRad)
  return Math.max(DEFAULT_DISTANCE, raw)
}

/**
 * Montajlı model için kadraj: modelin TÜM boyutlarını (en/boy/derinlik)
 * kapsayan küre ekrana sığacak mesafe + modelin gerçek dikey merkezi.
 * Sadece yüksekliğe bakmak geniş/basık modellerde (abajur, masa lambası)
 * kamerayı fazla yaklaştırıyordu. Dar (dikey) ekranlarda yatay görüş açısı
 * daraldığı için o da hesaba katılır.
 *  - Asılı modelde store'daki yükseklik h*1.6'dır (bkz. LampModel): model
 *    tepesi 1.6h'de, merkezi 1.1h'de durur.
 */
export function fitAssembledModel(
  fitHeight: number,
  width: number,
  depth: number,
  hanging: boolean,
  aspect: number
): { distance: number; targetY: number } {
  if (fitHeight <= 0) return { distance: DEFAULT_DISTANCE, targetY: DEFAULT_TARGET_Y }
  const h = hanging ? fitHeight / 1.6 : fitHeight
  const radius = 0.5 * Math.sqrt(h * h + width * width + depth * depth)
  const vHalf = (VERTICAL_FOV_DEG * Math.PI) / 180 / 2
  const hHalf = Math.atan(Math.tan(vHalf) * Math.max(0.2, aspect))
  // Montajlı modellerde daha geniş pay: model kadrajın ~yarısını kaplasın.
  const distance = (radius * MODEL_FIT_MARGIN) / Math.sin(Math.min(vHalf, hHalf))
  return { distance: Math.max(120, distance), targetY: hanging ? h * 1.1 : h / 2 }
}

/**
 * Kamerayı, verilen mesafe + azimuth açısına göre (sabit izometrik
 * yükseklik açısıyla) konumlandırır ve stack'in dikey ortasına bakar.
 * azimuthDeg varsayılanı (45°) mevcut/orijinal sabit görünümle birebir
 * aynıdır — SpinCaptureHook farklı açılar geçerek 360° kare üretir.
 */
export function positionCamera(
  camera: { position: { set: (x: number, y: number, z: number) => void }; lookAt: (x: number, y: number, z: number) => void },
  controls: { target?: { set: (x: number, y: number, z: number) => void }; update?: () => void } | null,
  distance: number,
  targetY: number,
  azimuthDeg: number = ISO_AZIMUTH_DEG
) {
  const azimuthRad = (azimuthDeg * Math.PI) / 180
  const horizontal = distance * Math.cos(ISO_ELEVATION_RAD)
  const y = distance * Math.sin(ISO_ELEVATION_RAD)
  const x = horizontal * Math.cos(azimuthRad)
  const z = horizontal * Math.sin(azimuthRad)

  if (controls?.target) {
    controls.target.set(0, targetY, 0)
    controls.update?.()
  }
  camera.position.set(x, y, z)
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
  const modelMode = useConfiguratorStore((s) => s.layoutMode === 'model')
  const modelId = useConfiguratorStore((s) => s.modelId)
  const stackWidth = useConfiguratorStore((s) => s.stackWidth)
  const stackDepth = useConfiguratorStore((s) => s.stackDepth)
  const hanging = useConfiguratorStore((s) => s.hangFromCeiling)
  const { camera, controls, size } = useThree()
  const aspect = size.height > 0 ? size.width / size.height : 1

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

    if (modelMode) {
      const fit = fitAssembledModel(stackTotalHeight, stackWidth, stackDepth, hanging, aspect)
      // @ts-expect-error - drei'nin OrbitControls tipi eksik olabilir
      positionCamera(camera, controls, fit.distance, fit.targetY)
      return
    }
    const distance = distanceForHeight(stackTotalHeight)
    const targetY = stackTotalHeight > 0 ? stackTotalHeight / 2 : DEFAULT_TARGET_Y
    // @ts-expect-error - drei'nin OrbitControls tipi eksik olabilir
    positionCamera(camera, controls, distance, targetY)
  }, [cameraFitRequestId, stackTotalHeight, stackWidth, stackDepth, hanging, aspect, modelMode, camera, controls])

  // 4) Montajlı model: model seçilince/değişince ve geometri ölçülünce
  // modeli bütün olarak sığdır (parça eklenmediği için 2. kural tetiklenmez;
  // asılı modeller de varsayılan kadraja sığmaz).
  useEffect(() => {
    if (!modelMode || !modelId || stackTotalHeight <= 0) return
    const fit = fitAssembledModel(stackTotalHeight, stackWidth, stackDepth, hanging, aspect)
    // @ts-expect-error - drei'nin OrbitControls tipi eksik olabilir
    positionCamera(camera, controls, fit.distance, fit.targetY)
    // aspect bilerek bağımlılık değil: pencere boyutu değişince kullanıcının
    // çevirdiği kamera sıfırlanmasın ("Sığdır" butonu yeniden hesaplar).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelMode, modelId, stackTotalHeight, stackWidth, stackDepth, hanging, camera, controls])

  return null
}