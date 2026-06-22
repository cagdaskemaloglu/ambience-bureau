'use client'

import { useLocale } from 'next-intl'
import { useConfiguratorStore } from '@/lib/store/configurator'

const COLOR_PRESETS = [
  { label: 'Warm', hex: '#F5D78E' },
  { label: 'Neutral', hex: '#FFF4E0' },
  { label: 'Cool', hex: '#D6E8FF' },
  { label: 'Amber', hex: '#E6792E' },
]

export function LightControls() {
  const locale = useLocale()
  const lightColor = useConfiguratorStore((s) => s.lightColor)
  const lightBrightness = useConfiguratorStore((s) => s.lightBrightness)
  const lightEnabled = useConfiguratorStore((s) => s.lightEnabled)
  const setLightColor = useConfiguratorStore((s) => s.setLightColor)
  const setLightBrightness = useConfiguratorStore((s) => s.setLightBrightness)
  const toggleLight = useConfiguratorStore((s) => s.toggleLight)

  return (
    <div className="border-t border-bureau-black pt-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[10.5px] uppercase tracking-wide text-bureau-muted">
          {locale === 'tr' ? 'Işık Simülasyonu' : 'Light Simulation'}
        </span>
        <button
          onClick={toggleLight}
          className={`border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide transition-colors ${
            lightEnabled
              ? 'border-bureau-amber bg-bureau-amber text-white'
              : 'border-bureau-rule text-bureau-muted'
          }`}
        >
          {lightEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Color presets */}
      <div className="mb-3 flex gap-2">
        {COLOR_PRESETS.map((preset) => (
          <button
            key={preset.hex}
            onClick={() => setLightColor(preset.hex)}
            className={`h-7 w-7 border-2 transition-transform ${
              lightColor === preset.hex ? 'border-bureau-black scale-110' : 'border-bureau-rule'
            }`}
            style={{ backgroundColor: preset.hex }}
            title={preset.label}
          />
        ))}
      </div>

      {/* Brightness slider */}
      <div>
        <div className="mb-1.5 flex justify-between font-mono text-[10px] uppercase tracking-wide text-bureau-muted">
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
  )
}
