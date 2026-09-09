'use client'

import { useEffect, useRef, useState } from 'react'

// ── Ofsetler (piksel) ─────────────────────────────────────────────
const LAMP_GAP_FROM_BRAND = 28 // lamba, marka yazısının bu kadar SOLUNA
const REACH_OFFSET_X = 14 // adamın lambayı yakmak için durduğu nokta, lambanın bu kadar SAĞINDA (üst üste binmesin diye)
// Lamba grafiğinin kendi tabanı (yakma anında adamın bastığı "zemin"),
// lampY'nin (marka yazısının DİKEY ORTASI) bu kadar ALTINDA duruyor —
// aşağıdaki <path>/<line> çizimindeki taban y=11 değeriyle birebir
// eşleşmeli, aksi halde adam lambanın havada asılıymış gibi durduğu bir
// yükseklikte durur ve kol açısı yanlış hesaplanır.
const LAMP_PLATFORM_OFFSET_Y = 11
const JUMP_LANDING_GAP = 10 // zıplama sonrası inilen nokta, yazının bittiği yerin bu kadar SAĞINDA
const GROUND_MARGIN = 6 // zemin çizgisi, header'ın alt kenarından bu kadar içeride

// ── Hız ────────────────────────────────────────────────────────────
// TÜM düz yürüyüş segmentleri (girişten lambaya, yazının üstünden geçiş,
// masaya kadar) AYNI px/sn hızını kullanır — böylece segmentler arasında
// yürüme hızı ile adım (bacak/kol) animasyonu birbirinden kopmuyor.
// Önceki versiyonda her segment için elle ayrı bir süre (ms) verilmişti,
// bu da mesafe/süre oranı segmentler arasında farklı olduğu için "masaya
// yürürken adımlar hıza göre yavaş kalıyor" sorununa yol açıyordu.
const WALK_SPEED_PX_PER_SEC = 16
const CLIMB_SPEED_PX_PER_SEC = 10 // dikey tırmanma, yürümeden biraz daha yavaş/zahmetli
const STEP_CYCLE_PX = 24 // bir tam adım (bacak sallanma) döngüsünün kapsadığı mesafe
const STEP_CYCLE_MS = Math.round((STEP_CYCLE_PX / WALK_SPEED_PX_PER_SEC) * 1000)

const TOGGLE_HOLD_MS = 700
const EXTRA_CLIMB_MS_MIN = 350 // lambayı yaktıktan sonra yazının üstüne çıkan "bir adım daha"
const JUMP_MS = 550
const SIT_TRANSITION_MS = 450

// Karakterin kendi yerel koordinat sistemi: Y=0, AYAKLARIN yere değdiği
// nokta. Bacaklar bu noktadan AŞAĞI (LEG_LENGTH kadar), gövde/kafa
// YUKARI uzanır. transform: translate(x, y) uygulanırken bu yüzden
// hedef Y'den LEG_LENGTH çıkarılır — aksi halde ayaklar hedef zeminin
// üstünde/altında kalır.
const LEG_LENGTH = 7

type Phase =
  | 'walking-to-lamp'
  | 'climbing-up'
  | 'toggling'
  | 'climbing-to-text'
  | 'walking-across-top'
  | 'jumping-down'
  | 'walking-to-desk'
  | 'sitting'
  | 'seated'

interface Anchors {
  headerWidth: number
  headerHeight: number
  groundY: number
  lampX: number
  lampY: number
  lampPlatformY: number // adamın lambayı yakmak için bastığı zemin (lambanın tabanı)
  brandTopY: number // "Ambience Bureau" yazısının ÜST kenarı — yazının üstünden yürüme hattı
  reachX: number // adamın lambayı yakmak için durduğu X
  brandRightX: number // "Ambience Bureau" yazısının bittiği X
  jumpLandingX: number // yazının bitiminden sonra aşağı atlayıp indiği X
  deskX: number
}

/**
 * Header'daki 2 sabit noktayı (marka yazısı, "Büro" linki) gerçek piksel
 * cinsinden ölçer — hem X hem Y. data-stickman-anchor="..." ile
 * işaretlenmiş elemanları arar (bkz. Header.tsx). `locale` değişince ve
 * pencere yeniden boyutlandığında yeniden ölçer.
 */
function useAnchors(containerRef: React.RefObject<HTMLDivElement | null>, locale: string): Anchors | null {
  const [anchors, setAnchors] = useState<Anchors | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    function measure() {
      const containerEl = containerRef.current
      if (!containerEl) return
      const header = containerEl.closest('header')
      if (!header) return

      const brandEl = header.querySelector('[data-stickman-anchor="brand"]')
      const buroEl = header.querySelector('[data-stickman-anchor="buro"]')
      if (!brandEl || !buroEl) return

      const headerRect = header.getBoundingClientRect()
      const brandRect = brandEl.getBoundingClientRect()
      const buroRect = buroEl.getBoundingClientRect()

      const headerWidth = headerRect.width
      const headerHeight = headerRect.height
      const groundY = headerHeight - GROUND_MARGIN
      const lampX = brandRect.left - headerRect.left - LAMP_GAP_FROM_BRAND
      const lampY = brandRect.top - headerRect.top + brandRect.height / 2
      const brandTopY = brandRect.top - headerRect.top
      const brandRightX = brandRect.right - headerRect.left

      setAnchors({
        headerWidth,
        headerHeight,
        groundY,
        lampX,
        lampY,
        lampPlatformY: lampY + LAMP_PLATFORM_OFFSET_Y,
        brandTopY,
        reachX: lampX + REACH_OFFSET_X,
        brandRightX,
        jumpLandingX: brandRightX + JUMP_LANDING_GAP,
        deskX: buroRect.left - headerRect.left + buroRect.width / 2,
      })
    }

    measure()
    const settleTimeout = setTimeout(measure, 300)

    const header = container.closest('header')
    const targets = header
      ? [
          header,
          header.querySelector('[data-stickman-anchor="brand"]'),
          header.querySelector('[data-stickman-anchor="buro"]'),
        ].filter((el): el is Element => el !== null)
      : []

    const observer = new ResizeObserver(() => measure())
    targets.forEach((el) => observer.observe(el))
    window.addEventListener('resize', measure)

    return () => {
      clearTimeout(settleTimeout)
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- locale
    // değişince yeniden ölçmek için bilerek dependency'e ekliyoruz.
  }, [containerRef, locale])

  return anchors
}

/** İki nokta arasındaki mesafeye göre, SABİT hızda ne kadar süreceğini hesaplar. */
function walkDuration(fromX: number, toX: number, fromY: number, toY: number) {
  const dist = Math.hypot(toX - fromX, toY - fromY)
  const speed = fromY === toY ? WALK_SPEED_PX_PER_SEC : CLIMB_SPEED_PX_PER_SEC
  return Math.max(300, Math.round((dist / speed) * 1000))
}

/**
 * PROTOTİP. Header'ın TAMAMINI kaplayan (pointer-events-none) bir
 * bindirme: çubuk adam zeminde lambaya (marka yazısının solunda, bir
 * logo/marka işareti gibi duran) yürür, yükselip yakar, sonra "Ambience
 * Bureau" yazısının ÜSTÜNDEN geçerek yürür, yazının bitiminde aşağı
 * zıplayıp zemine iner ve "Büro" linkinin hizasındaki masaya yürüyüp
 * arkasına oturur.
 *
 * TÜM düz yürüyüş segmentleri aynı px/sn hızını kullanır (bkz.
 * WALK_SPEED_PX_PER_SEC) — adım animasyonunun süresi de bu hıza göre
 * hesaplanır, böylece hangi segmentte olursa olsun adımlar gerçek
 * harekete göre senkronize kalır.
 *
 * Konumlar Header.tsx'teki data-stickman-anchor işaretli elemanlardan
 * GERÇEK piksel olarak ölçülüyor. Header'ın tamamını kapladığı için
 * bilerek pointer-events-none.
 */
export function HeaderStickman({ locale }: { locale: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const anchors = useAnchors(containerRef, locale)

  const [phase, setPhase] = useState<Phase>('walking-to-lamp')
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [durationMs, setDurationMs] = useState(0)
  const [timingFn, setTimingFn] = useState<'linear' | 'ease-in'>('linear')
  const [lampsOn, setLampsOn] = useState(false)
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    if (!anchors) return
    timeouts.current.forEach(clearTimeout)
    timeouts.current = []
    setLampsOn(false)
    setPhase('walking-to-lamp')
    setTimingFn('linear')

    const startX = anchors.lampX - 60
    setPos({ x: startX, y: anchors.groundY })
    setDurationMs(0)

    let elapsed = 0

    const raf = requestAnimationFrame(() => {
      const d = walkDuration(startX, anchors.lampX, anchors.groundY, anchors.groundY)
      setDurationMs(d)
      setPos({ x: anchors.lampX, y: anchors.groundY })
    })
    elapsed += walkDuration(startX, anchors.lampX, anchors.groundY, anchors.groundY)

    const t1 = setTimeout(() => {
      setPhase('climbing-up')
      setDurationMs(walkDuration(anchors.lampX, anchors.reachX, anchors.groundY, anchors.lampPlatformY))
      setPos({ x: anchors.reachX, y: anchors.lampPlatformY })
    }, elapsed)
    elapsed += walkDuration(anchors.lampX, anchors.reachX, anchors.groundY, anchors.lampPlatformY)

    const t2 = setTimeout(() => setPhase('toggling'), elapsed)
    const t3 = setTimeout(() => setLampsOn(true), elapsed + TOGGLE_HOLD_MS * 0.4)
    elapsed += TOGGLE_HOLD_MS

    // Lambayı yaktıktan sonra: "bir adım daha" yukarı çıkıp tam olarak
    // yazının ÜST kenarı (brandTopY) hizasına gelir.
    const t4a = setTimeout(() => {
      setPhase('climbing-to-text')
      const d = Math.max(
        EXTRA_CLIMB_MS_MIN,
        walkDuration(anchors.reachX, anchors.reachX, anchors.lampPlatformY, anchors.brandTopY)
      )
      setDurationMs(d)
      setPos({ x: anchors.reachX, y: anchors.brandTopY })
    }, elapsed)
    elapsed += Math.max(
      EXTRA_CLIMB_MS_MIN,
      walkDuration(anchors.reachX, anchors.reachX, anchors.lampPlatformY, anchors.brandTopY)
    )

    // Sonra: yazının ÜSTÜNDEN (aynı yükseklikte) geçerek yürür.
    const t4 = setTimeout(() => {
      setPhase('walking-across-top')
      setDurationMs(walkDuration(anchors.reachX, anchors.jumpLandingX, anchors.brandTopY, anchors.brandTopY))
      setPos({ x: anchors.jumpLandingX, y: anchors.brandTopY })
    }, elapsed)
    elapsed += walkDuration(anchors.reachX, anchors.jumpLandingX, anchors.brandTopY, anchors.brandTopY)

    // Yazının bitiminde aşağı zıplar.
    const t5 = setTimeout(() => {
      setPhase('jumping-down')
      setTimingFn('ease-in') // düşüş hissi için hızlanarak iner
      setDurationMs(JUMP_MS)
      setPos({ x: anchors.jumpLandingX, y: anchors.groundY })
    }, elapsed)
    elapsed += JUMP_MS

    const t6 = setTimeout(() => {
      setPhase('walking-to-desk')
      setTimingFn('linear')
      setDurationMs(walkDuration(anchors.jumpLandingX, anchors.deskX, anchors.groundY, anchors.groundY))
      setPos({ x: anchors.deskX, y: anchors.groundY })
    }, elapsed)
    elapsed += walkDuration(anchors.jumpLandingX, anchors.deskX, anchors.groundY, anchors.groundY)

    const t7 = setTimeout(() => setPhase('sitting'), elapsed)
    elapsed += SIT_TRANSITION_MS
    const t8 = setTimeout(() => setPhase('seated'), elapsed)

    timeouts.current = [t1, t2, t3, t4a, t4, t5, t6, t7, t8]
    return () => {
      cancelAnimationFrame(raf)
      timeouts.current.forEach(clearTimeout)
    }
  }, [anchors])

  if (!anchors) return <div ref={containerRef} className="pointer-events-none absolute inset-0" />

  const isWalking = phase === 'walking-to-lamp' || phase === 'walking-across-top' || phase === 'walking-to-desk'
  const isClimbing = phase === 'climbing-up' || phase === 'climbing-to-text'
  const isStepping = isWalking || isClimbing
  const isReaching = phase === 'toggling'
  const isJumping = phase === 'jumping-down'
  const isSeated = phase === 'sitting' || phase === 'seated'

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0">
      <svg
        viewBox={`0 0 ${anchors.headerWidth} ${anchors.headerHeight}`}
        className="h-full w-full"
        role="img"
        aria-label="Prototip: lambayı açan, yazının üstünden geçip zıplayan ve masaya oturan çubuk adam animasyonu"
      >
        <defs>
          {/* Lamba glow'u için yumuşak, merkezden dışa doğru sönümlenen gradient */}
          <radialGradient id="stickmanLampGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FDEFCF" stopOpacity="0.95" />
            <stop offset="45%" stopColor="#F5D78E" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#F5D78E" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ── Lamba (marka yazısının solunda, logo gibi — büyütülmüş) ── */}
        <g transform={`translate(${anchors.lampX} ${anchors.lampY})`}>
          <circle
            cx="0" cy="-3"
            r="15"
            fill="url(#stickmanLampGlow)"
            style={{ opacity: lampsOn ? 1 : 0, transition: 'opacity 800ms ease-out' }}
          />
          <line x1="0" y1="11" x2="0" y2="1.5" stroke="#141414" strokeWidth="1.6" />
          <path d="M -8.5 1.5 L 8.5 1.5 L 5 -10 L -5 -10 Z" fill="none" stroke="#141414" strokeWidth="1.6" strokeLinejoin="round" />
          <circle
            cx="0" cy="-3" r="2.8"
            className="transition-colors duration-500"
            fill={lampsOn ? '#F5D78E' : '#EDEDED'}
            stroke="#141414"
            strokeWidth="0.9"
          />
        </g>

        {/* ── Masa ("Büro" ile hizalı) ── */}
        <g transform={`translate(${anchors.deskX} ${anchors.groundY - 34})`}>
          <line x1="-11" y1="24" x2="11" y2="24" stroke="#141414" strokeWidth="1.6" />
          <line x1="-9" y1="24" x2="-9" y2="34" stroke="#141414" strokeWidth="1.4" />
          <line x1="9" y1="24" x2="9" y2="34" stroke="#141414" strokeWidth="1.4" />
        </g>

        {/* ── Çubuk adam ── */}
        <g
          style={{
            transform: `translate(${pos.x}px, ${pos.y - LEG_LENGTH}px)`,
            transitionProperty: 'transform',
            transitionDuration: `${durationMs}ms`,
            transitionTimingFunction: timingFn,
          }}
        >
          <g
            className={phase === 'seated' ? 'stickman-seated-bob-sm' : undefined}
            style={
              phase === 'seated'
                ? undefined
                : {
                    transform: isSeated
                      ? 'translateY(3px)'
                      : isJumping
                        ? 'translateY(-2px)' // zıplarken hafif "havada" hissi
                        : 'translateY(0px)',
                    transition: `transform ${isJumping ? JUMP_MS : SIT_TRANSITION_MS}ms ease-out`,
                  }
            }
          >
            {/* Kafa */}
            <circle cx="0" cy="-13" r="4" fill="none" stroke="#141414" strokeWidth="1.4" />
            {/* Gövde */}
            <line x1="0" y1="-9" x2="0" y2="0" stroke="#141414" strokeWidth="1.4" />

            {/* Sol kol (omuz) */}
            <g transform="translate(0 -7)">
              <g
                className={isStepping && !isReaching ? 'stickman-arm-a-sm' : undefined}
                style={{
                  animationDuration: isStepping ? `${STEP_CYCLE_MS}ms` : undefined,
                  ...(isReaching
                    ? { transform: 'rotate(90deg)', transition: 'transform 350ms ease-out' }
                    : isJumping
                      ? { transform: 'rotate(-40deg)', transition: 'transform 200ms ease-out' }
                      : !isStepping
                        ? { transform: 'rotate(8deg)', transition: 'transform 250ms ease-out' }
                        : {}),
                }}
              >
                <line x1="0" y1="0" x2="0" y2="8" stroke="#141414" strokeWidth="1.4" strokeLinecap="round" />
              </g>
            </g>

            {/* Sağ kol (omuz) */}
            <g transform="translate(0 -7)">
              <g
                className={isStepping && !isReaching ? 'stickman-arm-b-sm' : undefined}
                style={{
                  animationDuration: isStepping ? `${STEP_CYCLE_MS}ms` : undefined,
                  ...(isJumping
                    ? { transform: 'rotate(40deg)', transition: 'transform 200ms ease-out' }
                    : !isStepping
                      ? { transform: 'rotate(-8deg)', transition: 'transform 250ms ease-out' }
                      : {}),
                }}
              >
                <line x1="0" y1="0" x2="0" y2="8" stroke="#141414" strokeWidth="1.4" strokeLinecap="round" />
              </g>
            </g>

            {/* Bacaklar — masaya oturunca (arkasında kaldığı için) gösterilmez */}
            {!isSeated && (
              <>
                <g transform="translate(0 0)">
                  <g
                    className={isStepping ? 'stickman-leg-a-sm' : undefined}
                    style={{
                      animationDuration: isStepping ? `${STEP_CYCLE_MS}ms` : undefined,
                      ...(isJumping ? { transform: 'rotate(-14deg)', transition: 'transform 200ms ease-out' } : {}),
                    }}
                  >
                    <line x1="0" y1="0" x2="0" y2="7" stroke="#141414" strokeWidth="1.4" strokeLinecap="round" />
                  </g>
                </g>
                <g transform="translate(0 0)">
                  <g
                    className={isStepping ? 'stickman-leg-b-sm' : undefined}
                    style={{
                      animationDuration: isStepping ? `${STEP_CYCLE_MS}ms` : undefined,
                      ...(isJumping ? { transform: 'rotate(14deg)', transition: 'transform 200ms ease-out' } : {}),
                    }}
                  >
                    <line x1="0" y1="0" x2="0" y2="7" stroke="#141414" strokeWidth="1.4" strokeLinecap="round" />
                  </g>
                </g>
              </>
            )}
          </g>
        </g>
      </svg>
    </div>
  )
}