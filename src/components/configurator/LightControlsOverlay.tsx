'use client'

import { useLocale } from 'next-intl'
import { useConfiguratorStore } from '@/lib/store/configurator'

const COLOR_PRESETS = [
  { label: 'Warm', hex: '#F5D78E' },
  { label: 'Neutral', hex: '#FFF4E0' },
  { label: 'Cool', hex: '#D6E8FF' },
  { label: 'Amber', hex: '#E6792E' },
]

/**
 * 3D viewer'ın sol üst köşesinde duran kompakt ışık kontrol overlay'i.
 * absolute konumlanıyor — ConfiguratorCanvas'ın relative wrapper'ı içinde.
 */
export function LightControlsOverlay() {
  const locale = useLocale()
  const lightColor = useConfiguratorStore((s) => s.lightColor)
  const lightBrightness = useConfiguratorStore((s) => s.lightBrightness)
  const lightEnabled = useConfiguratorStore((s) => s.lightEnabled)
  const setLightColor = useConfiguratorStore((s) => s.setLightColor)
  const setLightBrightness = useConfiguratorStore((s) => s.setLightBrightness)
  const toggleLight = useConfiguratorStore((s) => s.toggleLight)

  return (
    <div className="pointer-events-none absolute left-3 top-3 z-10 w-[160px]">
      <div className="pointer-events-auto border border-bureau-black bg-white/90 p-2.5 backdrop-blur-sm">
        {/* Header row */}
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-[9px] uppercase tracking-widest text-bureau-muted">
            {locale === 'tr' ? 'Işık' : 'Light'}
          </span>
          <button
            onClick={toggleLight}
            className={`border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide transition-colors ${
              lightEnabled
                ? 'border-bureau-amber bg-bureau-amber text-white'
                : 'border-bureau-rule text-bureau-muted hover:border-bureau-black'
            }`}
          >
            {lightEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Color presets */}
        <div className="mb-2 flex gap-1.5">
          {COLOR_PRESETS.map((preset) => (
            <button
              key={preset.hex}
              onClick={() => setLightColor(preset.hex)}
              className={`h-5 w-5 border transition-transform ${
                lightColor === preset.hex ? 'scale-110 border-bureau-black' : 'border-bureau-rule'
              }`}
              style={{ backgroundColor: preset.hex }}
              title={preset.label}
            />
          ))}
        </div>

        {/* Brightness */}
        <div>
          <div className="mb-1 flex justify-between font-mono text-[9px] uppercase text-bureau-muted">
            <span>{locale === 'tr' ? 'Parlaklık' : 'Brightness'}</span>
            <span>{Math.round(lightBrightness * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={lightBrightness}
            onChange={(e) => setLightBrightness(Number(e.target.value))}
            className="w-full accent-bureau-amber"
          />
        </div>
      </div>
    </div>
  )
}
