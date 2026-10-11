'use client'

import { useEffect, useRef, useState } from 'react'

interface Options {
  /** Animasyonun başladığı değer (ilk görünüşte). Varsayılan: 0 */
  from?: number
  /** Süre (ms). Varsayılan: 1800 */
  duration?: number
  /**
   * true ise animasyon, `ref`'e bağlanan eleman EKRANDA görünür olunca
   * başlar (anasayfada drop satırı sayfanın aşağısındaysa, kullanıcı oraya
   * gelmeden animasyon bitip boşa gitmesin diye). Varsayılan: true
   */
  startWhenVisible?: boolean
  /** false ise animasyon beklemede kalır (başka bir sayacın görünürlüğüne bağlamak için). */
  enabled?: boolean
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

/**
 * Bir sayıyı `from` değerinden `target`'a TAM SAYI adımlarıyla (rakam rakam
 * artarak/azalarak) animasyonla götürür.
 *  - İlk görünüşte: from → target
 *  - Sonra target değişirse: o anki gösterilen değerden yeni target'a
 *  - Kullanıcı "hareketi azalt" tercih ediyorsa animasyonsuz direkt target.
 * Dönen `ref`'i, görünürlüğü izlenecek elemana bağlayın.
 */
export function useAnimatedNumber<T extends HTMLElement = HTMLElement>(
  target: number,
  options: Options = {}
) {
  const { from = 0, duration = 1800, startWhenVisible = true, enabled = true } = options
  const ref = useRef<T>(null)
  const [value, setValue] = useState<number>(from)
  const [visible, setVisible] = useState(!startWhenVisible)
  const currentRef = useRef<number>(from)

  // Görünürlük takibi (yalnızca ilk kez)
  useEffect(() => {
    if (!startWhenVisible || visible) return
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true)
          io.disconnect()
        }
      },
      { threshold: 0.2 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [startWhenVisible, visible])

  useEffect(() => {
    if (!visible || !enabled) return
    if (!Number.isFinite(target)) {
      currentRef.current = target
      setValue(target)
      return
    }
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const start = currentRef.current
    if (reduce || start === target) {
      currentRef.current = target
      setValue(target)
      return
    }

    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration)
      const v = Math.round(start + (target - start) * easeOutCubic(p))
      currentRef.current = v
      setValue(v)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, visible, enabled, duration])

  return { value, ref, started: visible }
}
