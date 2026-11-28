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
import { WireReveal, type RevealPhase } from './WireReveal'
import { StudioRoom } from './StudioRoom'

interface ConfiguratorCanvasProps {
  onScreenshotReady?: (fn: () => string) => void
  /**
   * Kombinasyon rozeti + kadraj düğmesi tuvalin köşelerinde. Anasayfaya gömülü
   * stüdyoda tuval tüm ilk ekrana yayılır; rozetler orta sütunda ayrıca çizilir.
   */
  showHud?: boolean
  /** Anasayfadaki gömülü açılış: tel kafesten alttan üste materyale geçiş. */
  reveal?: RevealPhase
}

export function ConfiguratorCanvas({ onScreenshotReady, showHud = true, reveal }: ConfiguratorCanvasProps) {
  return (
    <div className="relative h-full w-full">
      {showHud && (
        <>
          <CombinationCountBadge />
          <CameraFitButton />
        </>
      )}
      <Scene grid={!reveal}>
        <LampModel />
        <LightSimulator />
        <CameraFit />
        <SpinCaptureHook />
        <DimensionAnnotations />
        {reveal && <WireReveal phase={reveal} />}
        {reveal && <StudioRoom />}
        {onScreenshotReady && (
          <ScreenshotCapture onReady={onScreenshotReady} />
        )}
      </Scene>
    </div>
  )
}