'use client'

import { useThree } from '@react-three/fiber'
import { useCallback } from 'react'

/**
 * R3F canvas'ından PNG screenshot alır ve base64 string döndürür.
 * preserveDrawingBuffer: true gerektirir — Scene.tsx'te Canvas gl prop'una eklendi.
 */
export function useScreenshot() {
  const { gl, scene, camera } = useThree()

  const takeScreenshot = useCallback((): string => {
    // Son frame'i render et
    gl.render(scene, camera)
    // Canvas'ı PNG olarak base64'e çevir
    return gl.domElement.toDataURL('image/png')
  }, [gl, scene, camera])

  return takeScreenshot
}
