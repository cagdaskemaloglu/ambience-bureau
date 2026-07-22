'use client'

import { useThree } from '@react-three/fiber'
import { useCallback } from 'react'

/**
 * R3F canvas'ından PNG screenshot alır ve base64 string döndürür.
 * preserveDrawingBuffer: true gerektirir — Scene.tsx'te Canvas gl prop'una eklendi.
 *
 * NOT: Bilerek `gl.render(scene, camera)` ile manuel bir yeniden render
 * YAPMIYORUZ. Scene.tsx'e Bloom post-processing (EffectComposer) eklendiği
 * için, manuel render çıplak sahneyi (Bloom atlanmış halde) çizip ekran
 * görüntüsünde ışık parıltısının kaybolmasına yol açardı. Canvas'ın
 * frameloop'u zaten sürekli çalıştığından (varsayılan "always"), tampon
 * her zaman EffectComposer'ın en güncel, Bloom uygulanmış son karesini
 * tutuyor — doğrudan onu yakalamak yeterli ve doğru olan budur.
 */
export function useScreenshot() {
  const { gl } = useThree()

  const takeScreenshot = useCallback((): string => {
    return gl.domElement.toDataURL('image/png')
  }, [gl])

  return takeScreenshot
}