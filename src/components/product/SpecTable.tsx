'use client'

import { useTranslations } from 'next-intl'
import type { ProductSpec, ControlCompatibility } from '@/types'

const COMPATIBILITY_LABEL: Record<ControlCompatibility, string> = {
  app: 'App Protocol',
  voice: 'Voice Module (Google / Alexa / Siri)',
  manual: 'Manual Override',
  schedule: 'Schedule Automation',
}

export function SpecTable({
  specs,
  compatibility,
  photonOutput,
}: {
  specs?: ProductSpec[]
  compatibility?: ControlCompatibility[]
  photonOutput?: string
}) {
  const t = useTranslations('product')

  const rows: Array<{ key: string; value: string }> = []

  if (photonOutput) {
    rows.push({ key: 'Photon Output', value: photonOutput })
  }
  if (specs) {
    specs.forEach((spec) => rows.push({ key: spec.key, value: spec.value }))
  }
  if (compatibility && compatibility.length > 0) {
    rows.push({
      key: 'Control Compatibility',
      value: compatibility.map((c) => COMPATIBILITY_LABEL[c]).join(', '),
    })
  }

  if (rows.length === 0) return null

  return (
    <div className="border border-bureau-black">
      <div className="border-b border-bureau-black bg-bureau-surface px-4 py-2.5">
        <span className="label-mono">{t('specifications')}</span>
      </div>
      <table className="w-full">
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={row.key}
              className={idx !== rows.length - 1 ? 'border-b border-dashed border-bureau-rule' : ''}
            >
              <td className="w-2/5 px-4 py-2.5 font-mono text-[11px] uppercase tracking-wide text-bureau-muted">
                {row.key}
              </td>
              <td className="px-4 py-2.5 text-[13px]">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
