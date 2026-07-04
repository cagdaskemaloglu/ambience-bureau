'use client'

import { useEffect } from 'react'
import { useScreenshot } from './useScreenshot'

/**
 * Scene içinde render edilen bu component, takeScreenshot fonksiyonunu
 * dışarıya (CustomRegistryClient'a) ref callback ile iletir.
 */
export function ScreenshotCapture({
  onReady,
}: {
  onReady: (fn: () => string) => void
}) {
  const takeScreenshot = useScreenshot()

  useEffect(() => {
    onReady(takeScreenshot)
  }, [takeScreenshot, onReady])

  return null
}
