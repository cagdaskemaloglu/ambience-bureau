'use client'

import { Scene } from './Scene'
import { LampModel } from './LampModel'
import { LightSimulator } from './LightSimulator'
import { CameraFit } from './CameraFit'
import { LightControlsOverlay } from './LightControlsOverlay'

/**
 * Konfigüratörün tüm 3D sahnesini birleştiren ana component.
 * Bu component'in kendisi 'use client' olsa da, içindeki Canvas/Three.js
 * kodu yine de tarayıcı API'lerine (WebGL context vb.) ihtiyaç duyar.
 * Bu yüzden bu component'i kullanan sayfa tarafında dynamic import +
 * { ssr: false } kullanılmalı (örn. custom-registry/page.tsx içinde).
 *
 * NOT: Suspense sarmalaması artık Scene.tsx içinde yapılıyor (children
 * kendi ayrı Suspense bloğunda) — burada tekrar sarmaya gerek yok.
 */

export function ConfiguratorCanvas() {
  return (
    <div className="relative h-full w-full">
      <LightControlsOverlay />
      <Scene>
        <LampModel />
        <LightSimulator />
        <CameraFit />
      </Scene>
    </div>
  )
}