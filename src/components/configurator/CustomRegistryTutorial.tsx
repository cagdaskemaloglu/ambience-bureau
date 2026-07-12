'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useConfiguratorStore } from '@/lib/store/configurator'

interface TutorialStep {
  selector: string // data-tutorial değeri (#tutorial-scope içinde aranır)
  titleTr: string
  titleEn: string
  descTr: string
  descEn: string
}

const STEPS: TutorialStep[] = [
  {
    selector: 'picker-base',
    titleTr: 'Adım 1 — Taban',
    titleEn: 'Step 1 — Base',
    descTr: 'Başlamak için bir TABAN modeli seçin.',
    descEn: 'Select a BASE model to begin.',
  },
  {
    selector: 'material-base',
    titleTr: 'Adım 2 — Renk',
    titleEn: 'Step 2 — Color',
    descTr: 'Şimdi bu taban için bir renk/malzeme seçin.',
    descEn: 'Now choose a color/material for this base.',
  },
  {
    selector: 'picker-body',
    titleTr: 'Adım 3 — Gövde',
    titleEn: 'Step 3 — Body',
    descTr: 'Bir GÖVDE modeli ekleyin. İstediğiniz kadar (en az 2 önerilir) ekleyerek tasarımınızın boyunu ayarlayabilirsiniz.',
    descEn: 'Add a BODY model. Add as many as you like (2+ recommended) to adjust the height of your design.',
  },
  {
    selector: 'remove-body-0',
    titleTr: 'Adım 4 — Kaldırma',
    titleEn: 'Step 4 — Removal',
    descTr: 'Şimdi de eklediğiniz bir gövde modelini tasarımdan çıkarmayı deneyin.',
    descEn: 'Now try removing a body model you just added.',
  },
  {
    selector: 'picker-head',
    titleTr: 'Adım 5 — Başlık',
    titleEn: 'Step 5 — Head',
    descTr: 'Bir BAŞLIK modeli ekleyerek tasarımınızı tamamlayın.',
    descEn: 'Add a HEAD model to complete your design.',
  },
  {
    selector: 'register-design-btn',
    titleTr: 'Adım 6 — Sicile Kayıt',
    titleEn: 'Step 6 — Registration',
    descTr: 'Tasarımınız tamamlandı. Sipariş onay adımlarına geçmek için kaydedin.',
    descEn: 'Your design is complete. Register it to proceed to order confirmation.',
  },
]

const SCOPE_ID_DESKTOP = 'tutorial-scope'
const SCOPE_ID_MOBILE = 'tutorial-scope-mobile'
const PAD = 6 // hedefin etrafındaki spot ışığı boşluğu (px)

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

function MouseClickIcon() {
  return (
    <svg width="22" height="30" viewBox="0 0 22 30" fill="none" className="flex-shrink-0">
      <rect x="1" y="1" width="20" height="28" rx="10" stroke="currentColor" strokeWidth="1.6" />
      <line x1="11" y1="1" x2="11" y2="12" stroke="currentColor" strokeWidth="1.6" />
      <path d="M1 11 A10 10 0 0 1 11 1 V11 Z" fill="currentColor" fillOpacity="0.85" />
    </svg>
  )
}

function TapIcon() {
  return (
    <svg width="26" height="30" viewBox="0 0 26 30" fill="none" className="flex-shrink-0">
      <circle cx="13" cy="14" r="7" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="13" cy="14" r="2.2" fill="currentColor" />
      <path d="M13 24 L13 29 M8 27 L18 27" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function CustomRegistryTutorial({
  locale,
  active,
}: {
  locale: 'tr' | 'en'
  active: boolean
}) {
  const collectionKey = useConfiguratorStore((s) => s.collectionKey)
  const [stepIndex, setStepIndex] = useState(0)
  const [dismissed, setDismissed] = useState(false)
  const [isDesktop, setIsDesktop] = useState(true)
  const [rect, setRect] = useState<Rect | null>(null)
  const rafRef = useRef<number | null>(null)
  const attachedElRef = useRef<Element | null>(null)

  // Tutorial açıkça mouse/sol-tık etkileşimi içeriyor — sadece masaüstü
  // (lg breakpoint) düzeninde çalışır; mobilde her iki panel de (gizli
  // olsa da) DOM'da bulunduğu için hedef seçimi çakışabilir.
  useEffect(() => {
    function check() {
      setIsDesktop(window.innerWidth >= 1024)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const findTarget = useCallback((selector: string): HTMLElement | null => {
    const scope = document.getElementById(isDesktop ? SCOPE_ID_DESKTOP : SCOPE_ID_MOBILE)
    if (!scope) return null
    const el = scope.querySelector<HTMLElement>(`[data-tutorial="${selector}"]`)
    if (!el) return null
    // display:none / henüz DOM'a girmemiş elemanları ele
    if (el.offsetParent === null && el.getClientRects().length === 0) return null
    return el
  }, [isDesktop])

  const advance = useCallback(() => {
    setStepIndex((i) => {
      const next = i + 1
      if (next >= STEPS.length) {
        setDismissed(true)
        return i
      }
      return next
    })
  }, [])

  // Aktif adımın hedefini bul, boyutunu takip et, tıklayınca ilerlet.
  useEffect(() => {
    if (!active || dismissed || !collectionKey) return

    const step = STEPS[stepIndex]
    let cancelled = false

    function poll() {
      if (cancelled) return
      const el = findTarget(step.selector)
      if (el) {
        const r = el.getBoundingClientRect()
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
        if (attachedElRef.current !== el) {
          attachedElRef.current = el
          el.addEventListener('click', advance, { once: true })
        }
      } else {
        setRect(null)
      }
      rafRef.current = requestAnimationFrame(poll)
    }
    poll()

    return () => {
      cancelled = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (attachedElRef.current) {
        attachedElRef.current.removeEventListener('click', advance)
        attachedElRef.current = null
      }
    }
  }, [active, dismissed, collectionKey, stepIndex, findTarget, advance])

  if (!active || dismissed || !collectionKey || !rect) return null

  const step = STEPS[stepIndex]
  const title = locale === 'tr' ? step.titleTr : step.titleEn
  const desc = locale === 'tr' ? step.descTr : step.descEn

  const holeTop = rect.top - PAD
  const holeLeft = rect.left - PAD
  const holeWidth = rect.width + PAD * 2
  const holeHeight = rect.height + PAD * 2

  return (
    <>
      {/* Spot ışığının etrafındaki 4 karartma paneli — sadece delik dışını kaplar */}
      <div style={{ position: 'fixed', zIndex: 9998, top: 0, left: 0, right: 0, height: Math.max(holeTop, 0), background: 'rgba(0,0,0,0.55)' }} />
      <div style={{ position: 'fixed', zIndex: 9998, top: holeTop + holeHeight, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.55)' }} />
      <div style={{ position: 'fixed', zIndex: 9998, top: holeTop, left: 0, width: Math.max(holeLeft, 0), height: holeHeight, background: 'rgba(0,0,0,0.55)' }} />
      <div style={{ position: 'fixed', zIndex: 9998, top: holeTop, left: holeLeft + holeWidth, right: 0, height: holeHeight, background: 'rgba(0,0,0,0.55)' }} />

      {/* Hedefi çerçeveleyen amber halka */}
      <div
        style={{
          position: 'fixed',
          zIndex: 9999,
          top: holeTop,
          left: holeLeft,
          width: holeWidth,
          height: holeHeight,
          border: '2px solid #E6792E',
          borderRadius: 4,
          boxShadow: '0 0 0 4px rgba(230,121,46,0.25)',
          pointerEvents: 'none',
        }}
      />

      {/* Alt bilgi çubuğu */}
      <div
        style={{ position: 'fixed', zIndex: 9999 }}
        className="bottom-6 left-1/2 w-[min(92vw,480px)] -translate-x-1/2 border border-bureau-black bg-white shadow-lg"
      >
        <div className="flex items-center justify-between border-b border-bureau-rule bg-bureau-black px-4 py-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/70">
            FORM 300 // {locale === 'tr' ? 'OPERATÖR EĞİTİMİ' : 'OPERATOR TRAINING'}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-bureau-amber">
            {stepIndex + 1} / {STEPS.length}
          </span>
        </div>

        <div className="px-4 py-3.5">
          <p className="mb-1 font-mono text-[9.5px] uppercase tracking-wide text-bureau-amber">{title}</p>
          <p className="mb-3 text-[13px] leading-snug text-bureau-black">{desc}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-bureau-muted">
              {isDesktop ? <MouseClickIcon /> : <TapIcon />}
              <span className="font-mono text-[9.5px] uppercase tracking-wide">
                {isDesktop
                  ? (locale === 'tr' ? 'İşaretli alana tıklayın' : 'Click the highlighted area')
                  : (locale === 'tr' ? 'İşaretli alana dokunun' : 'Tap the highlighted area')}
              </span>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="font-mono text-[9.5px] uppercase tracking-wider text-bureau-subtle hover:text-bureau-black"
            >
              {locale === 'tr' ? 'Atla ✕' : 'Skip ✕'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}