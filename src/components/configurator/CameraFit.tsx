'use client'

import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { useConfiguratorStore } from '@/lib/store/configurator'

const DEFAULT_DISTANCE = 350
const DEFAULT_TARGET_Y = 80

/**
 * SADECE koleksiyon değiştiğinde (yeni bir koleksiyon seçildiğinde)
 * kamerayı bir kere, genel/sabit bir başlangıç pozisyonuna getirir.
 *
 * Parça eklendiğinde/çıkarıldığında ARTIK kamera hareket etmez —
 * kullanıcı kontrolü tamamen OrbitControls'ta kalır. Bu, modeli
 * incelerken beklenmedik kamera sıçramalarını önler.
 */
export function CameraFit() {
  const collectionKey = useConfiguratorStore((s) => s.collectionKey)
  const { camera, controls } = useThree()
  const lastCollectionKey = useRef<string | null>(null)

  useEffect(() => {
    // Aynı koleksiyon için tekrar tetiklenmesin
    if (!collectionKey || collectionKey === lastCollectionKey.current) return
    lastCollectionKey.current = collectionKey

    // @ts-expect-error - drei'nin OrbitControls tipi target'ı destekler ama tip tanımı eksik olabilir
    if (controls?.target) {
      // @ts-expect-error - aynı sebep
      controls.target.set(0, DEFAULT_TARGET_Y, 0)
      // @ts-expect-error - aynı sebep
      controls.update?.()
    }

    camera.position.set(
      DEFAULT_DISTANCE * 0.6,
      DEFAULT_DISTANCE * 0.45,
      DEFAULT_DISTANCE * 0.6
    )
    camera.lookAt(0, DEFAULT_TARGET_Y, 0)
  }, [collectionKey, camera, controls])

  return null
}
