'use client'

import { useEffect, useRef, useState } from 'react'

// ── Ofsetler (piksel) ─────────────────────────────────────────────
const LAMP_GAP_FROM_BRAND = 28 // lamba, marka yazısının bu kadar SOLUNA
const LADDER_X_OFFSET = 18 // merdiven, lamba 1'in bu kadar SAĞINDA konumlanır
const LADDER_STEPS = 8 // merdivenin toplam basamak sayısı (zeminden yazının üst kenarına kadar)
const LADDER_TOGGLE_STEP = 5 // bu basamakta durup lambayı yakar, sonra 3 basamak daha çıkar
const LADDER_RAIL_HALF_WIDTH = 4 // merdivenin iki yan ray'i arası mesafenin yarısı
const JUMP_LANDING_GAP = 10 // zıplama sonrası inilen nokta, yazının bittiği yerin bu kadar SAĞINDA
const GROUND_MARGIN = 6 // zemin çizgisi, header'ın alt kenarından bu kadar içeride
const ARCHIVE_LAMPS_GAP = 24 // "Arşiv" yanındaki iki lamba arası mesafe
const GAP_FROM_ARCHIVE = 22 // ilk ek lamba, Arşiv yazısının bittiği yerin bu kadar SAĞINDA
const ARCHIVE_LAMP_REACH_OFFSET = 12 // adamın bu lambaları yakmak için durduğu, lambanın bu kadar SOLUNDAKİ nokta

// ── Hız ────────────────────────────────────────────────────────────
// TÜM düz yürüyüş segmentleri AYNI px/sn hızını kullanır — böylece
// segmentler arasında yürüme hızı ile adım (bacak/kol) animasyonu
// birbirinden kopmuyor. Her segment için elle ayrı bir süre (ms)
// vermek, mesafe/süre oranı segmentler arasında farklı olduğu için
// "adımlar hıza göre yavaş/hızlı kalıyor" sorununa yol açıyordu.
const WALK_SPEED_PX_PER_SEC = 16
const CLIMB_SPEED_PX_PER_SEC = 10 // dikey tırmanma, yürümeden biraz daha yavaş/zahmetli
const STEP_CYCLE_PX = 24 // bir tam adım (bacak sallanma) döngüsünün kapsadığı mesafe
const STEP_CYCLE_MS = Math.round((STEP_CYCLE_PX / WALK_SPEED_PX_PER_SEC) * 1000)

const TOGGLE_HOLD_MS = 700
const PLACE_LADDER_MS = 550 // "cebinden merdiven çıkarma" duraklaması
const PACK_LADDER_MS = 500 // çıkış sonrası "merdiveni tekrar cebe koyma" duraklaması
const MIN_CLIMB_MS = 300
const JUMP_MS = 550
const SIT_TRANSITION_MS = 450

// Karakterin kendi yerel koordinat sistemi: Y=0, AYAKLARIN yere değdiği
// nokta. Bacaklar bu noktadan AŞAĞI (LEG_LENGTH kadar), gövde/kafa
// YUKARI uzanır. transform: translate(x, y) uygulanırken bu yüzden
// hedef Y'den LEG_LENGTH çıkarılır — aksi halde ayaklar hedef zeminin
// üstünde/altında kalır.
const LEG_LENGTH = 7

type Phase =
  | 'walking-to-ladder'
  | 'placing-ladder'
  | 'climbing-ladder-1'
  | 'toggling'
  | 'climbing-ladder-2'
  | 'packing-ladder'
  | 'walking-across-top'
  | 'jumping-down'
  | 'walking-to-lamp2'
  | 'toggling2'
  | 'walking-to-lamp3'
  | 'toggling3'
  | 'walking-to-desk'
  | 'sitting'
  | 'seated'

interface Anchors {
  headerWidth: number
  headerHeight: number
  groundY: number
  lampX: number
  lampY: number
  ladderX: number // merdivenin durduğu X — lamba 1'in sağında
  brandTopY: number // "Ambience Bureau" yazısının ÜST kenarı — merdivenin/yürüme hattının tepe noktası
  brandRightX: number // "Ambience Bureau" yazısının bittiği X
  jumpLandingX: number // yazının bitiminden sonra aşağı atlayıp indiği X
  archiveCenterX: number // "Arşiv" linkinin yatay ortası (referans olarak tutuluyor)
  archiveRightX: number // "Arşiv" linkinin bittiği X — iki lamba buradan başlar
  lamp2X: number // Arşiv'in yanındaki 1. ek lamba ("Yörüngesel Düzenleme" tarzı)
  lamp3X: number // Arşiv'in yanındaki 2. ek lamba ("Eritilmiş Boru" tarzı)
  reachLamp2X: number
  reachLamp3X: number
  deskX: number
}

/** Merdivenin `step` numaralı basamağının Y konumu (0=zemin, LADDER_STEPS=yazının üst kenarı). */
function ladderStepY(anchors: Anchors, step: number): number {
  return anchors.groundY - ((anchors.groundY - anchors.brandTopY) * step) / LADDER_STEPS
}

/**
 * Header'daki 3 sabit noktayı (marka yazısı, "BUREAU" kelimesi, "Arşiv" linki)
 * gerçek piksel cinsinden ölçer — hem X hem Y. data-stickman-anchor="..."
 * ile işaretlenmiş elemanları arar (bkz. Header.tsx). `locale` değişince
 * ve pencere yeniden boyutlandığında yeniden ölçer.
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
      const bureauWordEl = header.querySelector('[data-stickman-anchor="bureau-word"]')
      const arsivEl = header.querySelector('[data-stickman-anchor="arsiv"]')
      if (!brandEl || !bureauWordEl || !arsivEl) return

      const headerRect = header.getBoundingClientRect()
      const brandRect = brandEl.getBoundingClientRect()
      const bureauWordRect = bureauWordEl.getBoundingClientRect()
      const arsivRect = arsivEl.getBoundingClientRect()

      const headerWidth = headerRect.width
      const headerHeight = headerRect.height
      const groundY = headerHeight - GROUND_MARGIN
      const lampX = brandRect.left - headerRect.left - LAMP_GAP_FROM_BRAND
      const lampY = brandRect.top - headerRect.top + brandRect.height / 2
      const brandTopY = brandRect.top - headerRect.top
      const brandRightX = brandRect.right - headerRect.left
      const archiveCenterX = arsivRect.left - headerRect.left + arsivRect.width / 2
      const archiveRightX = arsivRect.right - headerRect.left
      const lamp2X = archiveRightX + GAP_FROM_ARCHIVE
      const lamp3X = lamp2X + ARCHIVE_LAMPS_GAP

      setAnchors({
        headerWidth,
        headerHeight,
        groundY,
        lampX,
        lampY,
        ladderX: lampX + LADDER_X_OFFSET,
        brandTopY,
        brandRightX,
        jumpLandingX: brandRightX + JUMP_LANDING_GAP,
        archiveCenterX,
        archiveRightX,
        lamp2X,
        lamp3X,
        reachLamp2X: lamp2X - ARCHIVE_LAMP_REACH_OFFSET,
        reachLamp3X: lamp3X - ARCHIVE_LAMP_REACH_OFFSET,
        deskX: bureauWordRect.left - headerRect.left + bureauWordRect.width / 2,
      })
    }

    measure()
    const settleTimeout = setTimeout(measure, 300)

    const header = container.closest('header')
    const targets = header
      ? [
          header,
          header.querySelector('[data-stickman-anchor="brand"]'),
          header.querySelector('[data-stickman-anchor="bureau-word"]'),
          header.querySelector('[data-stickman-anchor="arsiv"]'),
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
 * bindirme: çubuk adam zeminde lamba 1'in (marka yazısının solunda, bir
 * logo/marka işareti gibi duran) yanına yürür, cebinden bir merdiven
 * çıkarıp lambanın SAĞINA yerleştirir, merdivenin 5. basamağına kadar
 * çıkıp lambayı yakar, 3 basamak daha çıkıp "Ambience Bureau" yazısının
 * ÜST kenarına ulaşır, yazının ÜSTÜNDEN geçerek yürür, yazının bitiminde
 * aşağı zıplar, "Arşiv" linkinin yanındaki iki lambayı (ürünlerdeki
 * gerçek tasarımlara benzeyen) da yakar, sonra "Ambience Bureau"
 * yazısındaki masaya yürüyüp arkasına oturur.
 *
 * TÜM düz yürüyüş segmentleri aynı px/sn hızını kullanır — adım
 * animasyonunun süresi de bu hıza göre hesaplanır, böylece hangi
 * segmentte olursa olsun adımlar gerçek harekete göre senkronize kalır.
 *
 * Konumlar Header.tsx'teki data-stickman-anchor işaretli elemanlardan
 * GERÇEK piksel olarak ölçülüyor. Header'ın tamamını kapladığı için
 * bilerek pointer-events-none.
 */
export function HeaderStickman({ locale }: { locale: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const anchors = useAnchors(containerRef, locale)

  const [phase, setPhase] = useState<Phase>('walking-to-ladder')
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [durationMs, setDurationMs] = useState(0)
  const [timingFn, setTimingFn] = useState<'linear' | 'ease-in'>('linear')
  const [lamp1On, setLamp1On] = useState(false)
  const [lamp2On, setLamp2On] = useState(false)
  const [lamp3On, setLamp3On] = useState(false)
  const [ladderVisible, setLadderVisible] = useState(false)
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    if (!anchors) return
    timeouts.current.forEach(clearTimeout)
    timeouts.current = []
    setLamp1On(false)
    setLamp2On(false)
    setLamp3On(false)
    setLadderVisible(false)
    setPhase('walking-to-ladder')
    setTimingFn('linear')

    const startX = anchors.lampX - 60
    setPos({ x: startX, y: anchors.groundY })
    setDurationMs(0)

    let elapsed = 0

    const raf = requestAnimationFrame(() => {
      setDurationMs(walkDuration(startX, anchors.ladderX, anchors.groundY, anchors.groundY))
      setPos({ x: anchors.ladderX, y: anchors.groundY })
    })
    elapsed += walkDuration(startX, anchors.ladderX, anchors.groundY, anchors.groundY)

    // Merdivenin yanına varınca: cebinden merdiveni çıkarıp lamba 1'in
    // sağına yerleştirir (kısa bir duraklama + merdiven belirir).
    const t1 = setTimeout(() => setPhase('placing-ladder'), elapsed)
    const t1b = setTimeout(() => setLadderVisible(true), elapsed + PLACE_LADDER_MS * 0.5)
    elapsed += PLACE_LADDER_MS

    // Merdivenin 5. basamağına kadar çıkar.
    const toggleStepY = ladderStepY(anchors, LADDER_TOGGLE_STEP)
    const climb1Ms = Math.max(MIN_CLIMB_MS, walkDuration(anchors.ladderX, anchors.ladderX, anchors.groundY, toggleStepY))
    const t2 = setTimeout(() => {
      setPhase('climbing-ladder-1')
      setDurationMs(climb1Ms)
      setPos({ x: anchors.ladderX, y: toggleStepY })
    }, elapsed)
    elapsed += climb1Ms

    // 5. basamakta durup lambayı yakar.
    const t3 = setTimeout(() => setPhase('toggling'), elapsed)
    const t4 = setTimeout(() => setLamp1On(true), elapsed + TOGGLE_HOLD_MS * 0.4)
    elapsed += TOGGLE_HOLD_MS

    // Sonra 3 basamak daha çıkıp tam olarak yazının ÜST kenarı
    // (brandTopY = LADDER_STEPS'inci basamak) hizasına gelir.
    const climb2Ms = Math.max(
      MIN_CLIMB_MS,
      walkDuration(anchors.ladderX, anchors.ladderX, toggleStepY, anchors.brandTopY)
    )
    const t5 = setTimeout(() => {
      setPhase('climbing-ladder-2')
      setDurationMs(climb2Ms)
      setPos({ x: anchors.ladderX, y: anchors.brandTopY })
    }, elapsed)
    elapsed += climb2Ms

    // Çıkışı tamamlayınca: merdiveni tekrar cebine koyar, merdiven kaybolur.
    const t5b = setTimeout(() => setPhase('packing-ladder'), elapsed)
    const t5c = setTimeout(() => setLadderVisible(false), elapsed + PACK_LADDER_MS * 0.5)
    elapsed += PACK_LADDER_MS

    // Sonra: yazının ÜSTÜNDEN (aynı yükseklikte) geçerek yürür.
    const t6 = setTimeout(() => {
      setPhase('walking-across-top')
      setDurationMs(walkDuration(anchors.ladderX, anchors.jumpLandingX, anchors.brandTopY, anchors.brandTopY))
      setPos({ x: anchors.jumpLandingX, y: anchors.brandTopY })
    }, elapsed)
    elapsed += walkDuration(anchors.ladderX, anchors.jumpLandingX, anchors.brandTopY, anchors.brandTopY)

    // Yazının bitiminde aşağı zıplar.
    const t7 = setTimeout(() => {
      setPhase('jumping-down')
      setTimingFn('ease-in') // düşüş hissi için hızlanarak iner
      setDurationMs(JUMP_MS)
      setPos({ x: anchors.jumpLandingX, y: anchors.groundY })
    }, elapsed)
    elapsed += JUMP_MS

    // "Arşiv" yanındaki 1. ek lambaya yürür ve yakar.
    const t8 = setTimeout(() => {
      setPhase('walking-to-lamp2')
      setTimingFn('linear')
      setDurationMs(walkDuration(anchors.jumpLandingX, anchors.reachLamp2X, anchors.groundY, anchors.groundY))
      setPos({ x: anchors.reachLamp2X, y: anchors.groundY })
    }, elapsed)
    elapsed += walkDuration(anchors.jumpLandingX, anchors.reachLamp2X, anchors.groundY, anchors.groundY)

    const t9 = setTimeout(() => setPhase('toggling2'), elapsed)
    const t10 = setTimeout(() => setLamp2On(true), elapsed + TOGGLE_HOLD_MS * 0.4)
    elapsed += TOGGLE_HOLD_MS

    // 2. ek lambaya (Arşiv'in hemen yanındaki diğer lamba) yürür ve yakar.
    const t11 = setTimeout(() => {
      setPhase('walking-to-lamp3')
      setDurationMs(walkDuration(anchors.reachLamp2X, anchors.reachLamp3X, anchors.groundY, anchors.groundY))
      setPos({ x: anchors.reachLamp3X, y: anchors.groundY })
    }, elapsed)
    elapsed += walkDuration(anchors.reachLamp2X, anchors.reachLamp3X, anchors.groundY, anchors.groundY)

    const t12 = setTimeout(() => setPhase('toggling3'), elapsed)
    const t13 = setTimeout(() => setLamp3On(true), elapsed + TOGGLE_HOLD_MS * 0.4)
    elapsed += TOGGLE_HOLD_MS

    // Üç lamba da yandıktan sonra masaya ("BUREAU" kelimesi hizası) yürüyüp oturur.
    const t14 = setTimeout(() => {
      setPhase('walking-to-desk')
      setDurationMs(walkDuration(anchors.reachLamp3X, anchors.deskX, anchors.groundY, anchors.groundY))
      setPos({ x: anchors.deskX, y: anchors.groundY })
    }, elapsed)
    elapsed += walkDuration(anchors.reachLamp3X, anchors.deskX, anchors.groundY, anchors.groundY)

    const t15 = setTimeout(() => setPhase('sitting'), elapsed)
    elapsed += SIT_TRANSITION_MS
    const t16 = setTimeout(() => setPhase('seated'), elapsed)

    timeouts.current = [t1, t1b, t2, t3, t4, t5, t5b, t5c, t6, t7, t8, t9, t10, t11, t12, t13, t14, t15, t16]
    return () => {
      cancelAnimationFrame(raf)
      timeouts.current.forEach(clearTimeout)
    }
  }, [anchors])

  if (!anchors) return <div ref={containerRef} className="pointer-events-none absolute inset-0" />

  const isWalking =
    phase === 'walking-to-ladder' ||
    phase === 'walking-across-top' ||
    phase === 'walking-to-lamp2' ||
    phase === 'walking-to-lamp3' ||
    phase === 'walking-to-desk'
  const isClimbing = phase === 'climbing-ladder-1' || phase === 'climbing-ladder-2'
  const isStepping = isWalking || isClimbing
  const isPlacingLadder = phase === 'placing-ladder'
  const isPackingLadder = phase === 'packing-ladder'
  const isHandlingLadder = isPlacingLadder || isPackingLadder
  const isReachingLamp1 = phase === 'toggling'
  const isReachingLamp23 = phase === 'toggling2' || phase === 'toggling3'
  const isReaching = isReachingLamp1 || isReachingLamp23
  const isJumping = phase === 'jumping-down'
  const isSeated = phase === 'sitting' || phase === 'seated'

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0">
      <svg
        viewBox={`0 0 ${anchors.headerWidth} ${anchors.headerHeight}`}
        className="h-full w-full"
        role="img"
        aria-label="Prototip: lambaları açan, yazının üstünden geçip zıplayan ve masaya oturan çubuk adam animasyonu"
      >
        <defs>
          {/* Lamba glow'u için yumuşak, merkezden dışa doğru sönümlenen gradient */}
          <radialGradient id="stickmanLampGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FDEFCF" stopOpacity="0.95" />
            <stop offset="45%" stopColor="#F5D78E" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#F5D78E" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ── Lamba 1 (marka yazısının solunda, logo gibi) ── */}
        <g transform={`translate(${anchors.lampX} ${anchors.lampY})`}>
          <circle
            cx="0" cy="-3"
            r="15"
            fill="url(#stickmanLampGlow)"
            style={{ opacity: lamp1On ? 1 : 0, transition: 'opacity 800ms ease-out' }}
          />
          <line x1="0" y1="11" x2="0" y2="1.5" stroke="#141414" strokeWidth="1.6" />
          <path d="M -8.5 1.5 L 8.5 1.5 L 5 -10 L -5 -10 Z" fill="none" stroke="#141414" strokeWidth="1.6" strokeLinejoin="round" />
          <circle
            cx="0" cy="-3" r="2.8"
            className="transition-colors duration-500"
            fill={lamp1On ? '#F5D78E' : '#EDEDED'}
            stroke="#141414"
            strokeWidth="0.9"
          />
        </g>

        {/* ── Merdiven (lamba 1'in sağında) — adam "cebinden çıkarıp"
            yerleştirdikten sonra belirir, zeminden yazının üst kenarına
            kadar LADDER_STEPS basamaklı ── */}
        <g
          style={{ opacity: ladderVisible ? 1 : 0, transition: 'opacity 400ms ease-out' }}
          stroke="#141414" strokeWidth="1.1" fill="none"
        >
          <line
            x1={anchors.ladderX - LADDER_RAIL_HALF_WIDTH} y1={anchors.groundY}
            x2={anchors.ladderX - LADDER_RAIL_HALF_WIDTH} y2={anchors.brandTopY}
          />
          <line
            x1={anchors.ladderX + LADDER_RAIL_HALF_WIDTH} y1={anchors.groundY}
            x2={anchors.ladderX + LADDER_RAIL_HALF_WIDTH} y2={anchors.brandTopY}
          />
          {Array.from({ length: LADDER_STEPS }, (_, i) => i + 1).map((step) => {
            const y = ladderStepY(anchors, step)
            return (
              <line
                key={step}
                x1={anchors.ladderX - LADDER_RAIL_HALF_WIDTH} y1={y}
                x2={anchors.ladderX + LADDER_RAIL_HALF_WIDTH} y2={y}
              />
            )
          })}
        </g>

        {/* ── Lamba 2 ("Yörüngesel Düzenleme" tarzı — yeşil/mavi segmentli
            gövde + geniş konik abajur), Arşiv'in yanında ── */}
        <g transform={`translate(${anchors.lamp2X} ${anchors.groundY})`}>
          <circle
            cx="0" cy="-22" r="11"
            fill="url(#stickmanLampGlow)"
            style={{ opacity: lamp2On ? 1 : 0, transition: 'opacity 800ms ease-out' }}
          />
          <ellipse cx="0" cy="-1" rx="3.5" ry="1.2" fill="none" stroke="#141414" strokeWidth="1" />
          <ellipse cx="0" cy="-4" rx="3.2" ry="1.6" fill="#6B9B5E" stroke="#141414" strokeWidth="0.7" />
          <ellipse cx="0" cy="-7" rx="2.8" ry="1.4" fill="#4A6B96" stroke="#141414" strokeWidth="0.7" />
          <ellipse cx="0" cy="-10" rx="2.6" ry="1.3" fill="#6B9B5E" stroke="#141414" strokeWidth="0.7" />
          <ellipse cx="0" cy="-13" rx="2.2" ry="1.1" fill="#4A6B96" stroke="#141414" strokeWidth="0.7" />
          <path
            d="M -3.5 -15 L 3.5 -15 L 2 -18 L -2 -18 Z"
            fill={lamp2On ? '#FFFFFF' : '#EDEDED'}
            stroke="#141414" strokeWidth="0.9" strokeLinejoin="round"
            className="transition-colors duration-500"
          />
          <path
            d="M -7.5 -18 L 7.5 -18 L 3.8 -27 L -3.8 -27 Z"
            fill={lamp2On ? '#FFFFFF' : '#EDEDED'}
            stroke="#141414" strokeWidth="1.1" strokeLinejoin="round"
            className="transition-colors duration-500"
          />
        </g>

        {/* ── Lamba 3 ("Eritilmiş Boru" tarzı — turkuaz/turuncu bantlı
            silindir), Arşiv'in yanında ── */}
        <g transform={`translate(${anchors.lamp3X} ${anchors.groundY})`}>
          <circle
            cx="0" cy="-24" r="10"
            fill="url(#stickmanLampGlow)"
            style={{ opacity: lamp3On ? 1 : 0, transition: 'opacity 800ms ease-out' }}
          />
          <ellipse cx="0" cy="-1" rx="3" ry="1" fill="none" stroke="#141414" strokeWidth="1" />
          <rect x="-2.6" y="-11" width="5.2" height="9" rx="2.4" fill="#D97F4E" stroke="#141414" strokeWidth="0.8" />
          <rect x="-2.6" y="-18" width="5.2" height="7.2" fill="#7FC9B0" stroke="#141414" strokeWidth="0.8" />
          <rect
            x="-2.6" y="-28.5" width="5.2" height="10.7" rx="2.6"
            fill={lamp3On ? '#FFFFFF' : '#EDEDED'}
            stroke="#141414" strokeWidth="0.8"
            className="transition-colors duration-500"
          />
        </g>

        {/* ── Masa ("BUREAU" kelimesiyle hizalı) ── */}
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

            {/* Sol kol (omuz) — lamba 1'e (solunda) düz uzanır, lamba 2/3'e
                (sağında) yukarı-sağa uzanır */}
            <g transform="translate(0 -7)">
              <g
                className={isStepping && !isReaching ? 'stickman-arm-a-sm' : undefined}
                style={{
                  animationDuration: isStepping ? `${STEP_CYCLE_MS}ms` : undefined,
                  ...(isReachingLamp1
                    ? { transform: 'rotate(90deg)', transition: 'transform 350ms ease-out' }
                    : isReachingLamp23
                      ? { transform: 'rotate(-60deg)', transition: 'transform 350ms ease-out' }
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
                  ...(isHandlingLadder
                    ? { transform: 'rotate(35deg)', transition: 'transform 250ms ease-out' } // cebe uzanma jesti (çıkarma/koyma)
                    : isJumping
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