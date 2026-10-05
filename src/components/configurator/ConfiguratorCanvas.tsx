'use client'

import { useCallback, useRef } from 'react'
import { Scene } from './Scene'
import { LampModel } from './LampModel'
import { LightSimulator } from './LightSimulator'
import { CameraFit } from './CameraFit'
import { CameraFitButton } from './CameraFitButton'
import { SpinCaptureHook } from './SpinCaptureHook'
import { DimensionAnnotations } from './DimensionAnnotations'
import { ScreenshotCapture } from './ScreenshotCapture'
import { CombinationCountBadge } from './CombinationCountBadge'

interface ConfiguratorCanvasProps {
  onScreenshotReady?: (fn: () => string) => void
}

export function ConfiguratorCanvas({ onScreenshotReady }: ConfiguratorCanvasProps) {
  return (
    <div className="relative h-full w-full">
      <CombinationCountBadge />
      <CameraFitButton />
      <Scene>
        <LampModel />
        <LightSimulator />
        <CameraFit />
        <SpinCaptureHook />
        <DimensionAnnotations />
        {onScreenshotReady && (
          <ScreenshotCapture onReady={onScreenshotReady} />
        )}
      </Scene>
    </div>
  )
}