'use client'

import { Scene } from './Scene'
import { LampModel } from './LampModel'
import { LightSimulator } from './LightSimulator'
import { CameraFit } from './CameraFit'
import { CameraFitButton } from './CameraFitButton'
import { SpinCaptureHook } from './SpinCaptureHook'
import { LightControlsOverlay } from './LightControlsOverlay'
import { ScreenshotCapture } from './ScreenshotCapture'

interface ConfiguratorCanvasProps {
  onScreenshotReady?: (fn: () => string) => void
}

export function ConfiguratorCanvas({ onScreenshotReady }: ConfiguratorCanvasProps) {
  return (
    <div className="relative h-full w-full">
      <LightControlsOverlay />
      <CameraFitButton />
      <Scene>
        <LampModel />
        <LightSimulator />
        <CameraFit />
        <SpinCaptureHook />
        {onScreenshotReady && (
          <ScreenshotCapture onReady={onScreenshotReady} />
        )}
      </Scene>
    </div>
  )
}