'use client'

import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { useConfiguratorStore } from '@/lib/store/configurator'
import { distanceForHeight, positionCamera, DEFAULT_TARGET_Y } from './CameraFit'

declare global {
  interface Window {
    __spinCapture?: {
      setAngle: (azimuthDeg: number) => Promise<void>
      captureFrame: () => string
      getMetrics: () => { partCount: number; totalHeight: number }
    }
  }
}

/**
 * SADECE `scripts/generate-spin-frames.ts` tarafından kullanılır — URL'de
 * `?capture=1` yoksa hiçbir şey yapmaz (tek bir ucuz useEffect dışında),
 * normal ziyaretçi deneyimini/performansını ETKİLEMEZ.
 *
 * `window.__spinCapture` üzerinden dışarıya (Puppeteer'a) üç şey sunar:
 *  - setAngle(azimuthDeg): kamerayı verilen açıda, gerçek stack yüksekliğine
 *    göre doğru mesafede konumlandırır ve en az bir render karesi geçmesini
 *    bekleyip Promise'i resolve eder.
 *  - captureFrame(): canvas'ın o anki halini WebP data URL olarak döndürür.
 *  - getMetrics(): script'in "model tamamen yüklendi mi?" diye
 *    stabilite kontrolü yapabilmesi için parça sayısı + toplam yükseklik.
 */
export function SpinCaptureHook() {
  const { camera, controls, gl } = useThree()
  const stackTotalHeight = useConfiguratorStore((s) => s.stackTotalHeight)
  const stackPartCount = useConfiguratorStore((s) => s.stackPartCount)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (new URLSearchParams(window.location.search).get('capture') !== '1') return

    window.__spinCapture = {
      setAngle: (azimuthDeg: number) =>
        new Promise<void>((resolve) => {
          const distance = distanceForHeight(stackTotalHeight)
          const targetY = stackTotalHeight > 0 ? stackTotalHeight / 2 : DEFAULT_TARGET_Y
          // @ts-expect-error - drei'nin OrbitControls tipi eksik olabilir
          positionCamera(camera, controls, distance, targetY, azimuthDeg)
          // En az bir tam render döngüsü (EffectComposer/Bloom dahil)
          // geçsin diye çift rAF bekliyoruz.
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        }),
      captureFrame: () => gl.domElement.toDataURL('image/webp', 0.97),
      getMetrics: () => ({ partCount: stackPartCount, totalHeight: stackTotalHeight }),
    }

    return () => {
      delete window.__spinCapture
    }
  }, [camera, controls, gl, stackTotalHeight, stackPartCount])

  return null
}