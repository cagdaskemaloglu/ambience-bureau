'use client'

import { useCallback, useRef } from 'react'
import { Scene } from './Scene'
import { LampModel } from './LampModel'
import { LightSimulator } from './LightSimulator'
import { CameraFit } from './CameraFit'
import { LightControlsOverlay } from './LightControlsOverlay'
import { ScreenshotCapture } from './ScreenshotCapture'

interface ConfiguratorCanvasProps {
  onScreenshotReady?: (fn: () => string) => void
}

export function ConfiguratorCanvas({ onScreenshotReady }: ConfiguratorCanvasProps) {
  return (
    <div className="relative h-full w-full">
      <LightControlsOverlay />
      <Scene>
        <LampModel />
        <LightSimulator />
        <CameraFit />
        {onScreenshotReady && (
          <ScreenshotCapture onReady={onScreenshotReady} />
        )}
      </Scene>
    </div>
  )
}