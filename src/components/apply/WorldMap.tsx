'use client'

import { useMemo, useRef, useState } from 'react'
import { useLocale } from 'next-intl'
import { geoNaturalEarth1, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import worldData from 'world-atlas/countries-110m.json'
import { activeBureauCount } from '@/lib/bureauHubs'
import { countryName, flagEmoji, numericToAlpha2 } from '@/lib/countries'

interface MapCountry {
  key: string
  a2: string | null
  fallbackName: string
  d: string
}

interface MapGeometry {
  countries: MapCountry[]
  width: number
  height: number
  offsetX: number
  offsetY: number
}

const PAD = 4
const MAX_ZOOM = 8

/** Projeksiyon + path hesabı modül seviyesinde BİR KEZ yapılır. */
let cachedGeometry: MapGeometry | null = null
function buildGeometry(): MapGeometry {
  if (cachedGeometry) return cachedGeometry

  const fc = feature(worldData, worldData.objects.countries)
  // Antarktika haritayı gereksiz uzatıyor — çıkarıyoruz.
  const features = (fc.features as any[]).filter((f) => String(f.id) !== '010')

  const projection = geoNaturalEarth1().fitSize([960, 500], { type: 'Sphere' })
  const path = geoPath(projection).digits(1)

  const bounds = path.bounds({ type: 'FeatureCollection', features }) as [[number, number], [number, number]]
  const [[x0, y0], [x1, y1]] = bounds

  const list: MapCountry[] = []
  for (const f of features) {
    const d = path(f)
    if (!d) continue
    list.push({
      key: String(f.id ?? f.properties?.name ?? list.length),
      a2: numericToAlpha2(f.id),
      fallbackName: f.properties?.name ?? '—',
      d,
    })
  }

  cachedGeometry = {
    countries: list,
    width: x1 - x0 + PAD * 2,
    height: y1 - y0 + PAD * 2,
    offsetX: -x0 + PAD,
    offsetY: -y0 + PAD,
  }
  return cachedGeometry
}

export function WorldMap({
  selected,
  onSelect,
}: {
  selected: string | null
  onSelect: (alpha2: string) => void
}) {
  const locale = useLocale()
  const tr = locale === 'tr'
  const lang = tr ? 'tr' : 'en'
  const geo = useMemo(buildGeometry, [])

  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [hover, setHover] = useState<{ a2: string | null; name: string; x: number; y: number } | null>(null)
  const [view, setView] = useState({ k: 1, x: 0, y: 0 })
  const dragRef = useRef<{ startX: number; startY: number; vx: number; vy: number; moved: boolean } | null>(null)
  const justDraggedRef = useRef(false)

  function clamp(k: number, x: number, y: number) {
    return {
      k,
      x: Math.min(0, Math.max(geo.width * (1 - k), x)),
      y: Math.min(0, Math.max(geo.height * (1 - k), y)),
    }
  }

  function zoomBy(factor: number) {
    setView((v) => {
      const k = Math.min(MAX_ZOOM, Math.max(1, v.k * factor))
      const cx = geo.width / 2
      const cy = geo.height / 2
      const ratio = k / v.k
      return clamp(k, cx - (cx - v.x) * ratio, cy - (cy - v.y) * ratio)
    })
  }

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    dragRef.current = { startX: e.clientX, startY: e.clientY, vx: view.x, vy: view.y, moved: false }
  }

  function onPointerMove(e: React.PointerEvent) {
    const drag = dragRef.current
    if (drag && view.k > 1 && (e.buttons & 1 || e.pointerType === 'touch')) {
      const dx = e.clientX - drag.startX
      const dy = e.clientY - drag.startY
      if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true
      if (drag.moved) {
        const rect = svgRef.current?.getBoundingClientRect()
        const scale = rect ? geo.width / rect.width : 1
        setView((v) => clamp(v.k, drag.vx + dx * scale, drag.vy + dy * scale))
      }
    }
  }

  function onPointerUp() {
    if (dragRef.current?.moved) {
      justDraggedRef.current = true
      setTimeout(() => (justDraggedRef.current = false), 0)
    }
    dragRef.current = null
  }

  function showHover(e: React.MouseEvent, c: MapCountry) {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setHover({
      a2: c.a2,
      name: c.a2 ? countryName(c.a2, lang) : c.fallbackName,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  function handleClick(c: MapCountry) {
    if (justDraggedRef.current || !c.a2) return
    onSelect(c.a2)
  }

  const hoverCount = hover ? activeBureauCount(hover.a2) : 0

  return (
    <div ref={containerRef} className="relative select-none border border-bureau-black bg-bureau-surface">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${geo.width} ${geo.height}`}
        className="block h-auto w-full"
        style={{ touchAction: view.k > 1 ? 'none' : 'pan-y', cursor: view.k > 1 ? 'grab' : 'default' }}
        role="img"
        aria-label={tr ? 'Etkileşimli dünya haritası' : 'Interactive world map'}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => {
          onPointerUp()
          setHover(null)
        }}
      >
        <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
          <g transform={`translate(${geo.offsetX} ${geo.offsetY})`}>
            {geo.countries.map((c) => {
              const active = activeBureauCount(c.a2) > 0
              const isHover = hover?.a2 !== undefined && hover?.a2 === c.a2 && c.a2 !== null
              const isSelected = selected !== null && selected === c.a2
              const fill = active
                ? isHover || isSelected
                  ? 'rgb(var(--bureau-amber))'
                  : 'rgb(var(--bureau-amber) / 0.8)'
                : isHover || isSelected
                  ? 'rgb(var(--bureau-muted) / 0.55)'
                  : 'rgb(var(--bureau-rule))'
              return (
                <path
                  key={c.key}
                  d={c.d}
                  fill={fill}
                  stroke={isSelected ? 'rgb(var(--bureau-amber))' : 'rgb(var(--bureau-white))'}
                  strokeWidth={isSelected ? 1.6 : 0.5}
                  vectorEffect="non-scaling-stroke"
                  style={{ transition: 'fill 120ms ease-out', cursor: c.a2 ? 'pointer' : 'default' }}
                  onMouseEnter={(e) => showHover(e, c)}
                  onMouseMove={(e) => showHover(e, c)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => handleClick(c)}
                />
              )
            })}
          </g>
        </g>
      </svg>

      {/* Yakınlaştırma düğmeleri */}
      <div className="absolute right-2 top-2 flex flex-col border border-bureau-black bg-bureau-white font-mono text-[14px] leading-none">
        <button
          type="button"
          aria-label={tr ? 'Yakınlaştır' : 'Zoom in'}
          onClick={() => zoomBy(1.6)}
          className="h-7 w-7 border-b border-bureau-black hover:bg-bureau-surface"
        >
          +
        </button>
        <button
          type="button"
          aria-label={tr ? 'Uzaklaştır' : 'Zoom out'}
          onClick={() => zoomBy(1 / 1.6)}
          className="h-7 w-7 hover:bg-bureau-surface"
        >
          −
        </button>
      </div>

      {/* Hover bilgi kutusu: bayrak + ülke adı + aktif büro sayısı */}
      {hover && (
        <div
          className="pointer-events-none absolute z-10 whitespace-nowrap border border-bureau-black bg-bureau-white px-3 py-2 shadow-md"
          style={{
            left: Math.min(hover.x + 14, (containerRef.current?.clientWidth ?? 0) - 170),
            top: Math.max(hover.y - 52, 4),
          }}
        >
          <div className="text-[13px] font-semibold text-bureau-black">
            {hover.a2 && <span className="mr-1.5 text-[16px]">{flagEmoji(hover.a2)}</span>}
            {hover.name}
          </div>
          <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-bureau-muted">
            {tr ? 'Aktif büro' : 'Active bureaus'}:{' '}
            <span className={hoverCount > 0 ? 'text-bureau-amber' : ''}>{hoverCount}</span>
          </div>
        </div>
      )}

      {/* Gösterge */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-bureau-black px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-bureau-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 bg-bureau-amber" />
          {tr ? 'Aktif büro var' : 'Active bureau'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 bg-bureau-rule" />
          {tr ? 'Henüz büro yok (0)' : 'No bureau yet (0)'}
        </span>
        <span className="ml-auto hidden sm:inline">
          {tr ? 'Başvurmak için bir ülkeye tıklayın' : 'Click a country to apply'}
        </span>
      </div>
    </div>
  )
}
