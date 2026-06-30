'use client'

import { useLocale } from 'next-intl'
import { getLocalizedValue, formatPrice } from '@/lib/sanity'
import { useConfiguratorStore } from '@/lib/store/configurator'
import type { LampPart } from '@/types'

export function ConfigSummary({ onRegister }: { onRegister: () => void }) {
  const locale = useLocale()
  const base = useConfiguratorStore((s) => s.base)
  const body = useConfiguratorStore((s) => s.body)
  const head = useConfiguratorStore((s) => s.head)
  const availableParts = useConfiguratorStore((s) => s.availableParts)
  const getTotalPrice = useConfiguratorStore((s) => s.getTotalPrice)
  const isComplete = useConfiguratorStore((s) => s.isComplete)
  const removeBodyLayer = useConfiguratorStore((s) => s.removeBodyLayer)
  const iotEnabled = useConfiguratorStore((s) => s.iotEnabled)

  const total = getTotalPrice(locale as 'tr' | 'en')
  const complete = isComplete()
  const currency = locale === 'tr' ? 'TRY' : 'USD'
  const intlLocale = locale === 'tr' ? 'tr-TR' : 'en-US'

  function resolveSlot(selection: { partId: string | null; materialId: string | null }) {
    if (!selection.partId) {
      return { label: locale === 'tr' ? 'Seçilmedi' : 'Not selected', price: null as number | null }
    }
    const part = availableParts.find((p) => p.partId === selection.partId)
    if (!part) return { label: '—', price: null }

    const partName = getLocalizedValue(part.name, locale, '—')
    const material = part.materials.find((m) => m.materialId === selection.materialId)
    const materialLabel = material ? getLocalizedValue(material.label, locale, material.materialId) : ''
    const price = priceFor(part, material)

    return {
      label: `${partName}${materialLabel ? ` — ${materialLabel}` : ''}`,
      price,
    }
  }

  function priceFor(part: LampPart, material?: LampPart['materials'][number]) {
    const base = locale === 'tr' ? part.basePriceTRY : part.basePriceUSD
    const modifier = material
      ? locale === 'tr'
        ? material.priceModifierTRY
        : material.priceModifierUSD
      : 0
    return base + modifier
  }

  const baseResolved = resolveSlot(base)
  const headResolved = resolveSlot(head)

  return (
    <div className="border border-bureau-black">
      <div className="border-b border-bureau-black bg-bureau-surface px-4 py-2.5">
        <span className="label-mono">FORM 104-B: DEVICE REGISTRY</span>
      </div>

      <div className="divide-y divide-dashed divide-bureau-rule">
        <div className="flex items-center justify-between px-4 py-2.5 text-[12px]">
          <span className="text-bureau-muted">{locale === 'tr' ? 'Taban' : 'Base'}</span>
          <div className="flex items-center gap-3 text-right">
            <span>{baseResolved.label}</span>
            {baseResolved.price !== null && (
              <span className="font-mono text-[11px] text-bureau-subtle">
                {formatPrice(baseResolved.price, currency, intlLocale)}
              </span>
            )}
          </div>
        </div>

        {body.map((slot, idx) => {
          const resolved = resolveSlot(slot)
          return (
            <div key={idx} className="flex items-center justify-between px-4 py-2.5 text-[12px]">
              <span className="text-bureau-muted">
                {locale === 'tr' ? 'Gövde' : 'Body'} {idx + 1}
              </span>
              <div className="flex items-center gap-3 text-right">
                <span>{resolved.label}</span>
                {resolved.price !== null && (
                  <span className="font-mono text-[11px] text-bureau-subtle">
                    {formatPrice(resolved.price, currency, intlLocale)}
                  </span>
                )}
                <button
                  onClick={() => removeBodyLayer(idx)}
                  className="font-mono text-[10px] text-bureau-subtle hover:text-bureau-amber"
                  title={locale === 'tr' ? 'Katmanı kaldır' : 'Remove layer'}
                >
                  ✕
                </button>
              </div>
            </div>
          )
        })}

        {body.length === 0 && (
          <div className="px-4 py-2.5 text-center text-[11px] text-bureau-subtle">
            {locale === 'tr'
              ? 'Henüz gövde katmanı eklenmedi.'
              : 'No body layers added yet.'}
          </div>
        )}

        <div className="flex items-center justify-between px-4 py-2.5 text-[12px]">
          <span className="text-bureau-muted">{locale === 'tr' ? 'Başlık' : 'Head'}</span>
          <div className="flex items-center gap-3 text-right">
            <span>{headResolved.label}</span>
            {headResolved.price !== null && (
              <span className="font-mono text-[11px] text-bureau-subtle">
                {formatPrice(headResolved.price, currency, intlLocale)}
              </span>
            )}
          </div>
        </div>

        {iotEnabled && (
          <div className="flex items-center justify-between px-4 py-2.5 text-[12px]">
            <span className="text-bureau-muted">
              {locale === 'tr' ? 'Akıllı Cihaz (IoT)' : 'Smart Device (IoT)'}
            </span>
            <span className="font-mono text-[11px] text-bureau-subtle">
              {formatPrice(locale === 'tr' ? 1200 : 33, currency, intlLocale)}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-bureau-black px-4 py-3">
        <span className="font-mono text-[11px] uppercase tracking-wide">
          {locale === 'tr' ? 'Toplam' : 'Total'}
        </span>
        <span className="font-mono text-[16px] font-semibold">
          {formatPrice(total, currency, intlLocale)}
        </span>
      </div>

      <div className="p-4 pt-0">
        <button
          onClick={onRegister}
          disabled={!complete}
          className={`btn-bureau w-full ${!complete ? 'cursor-not-allowed opacity-40' : ''}`}
        >
          {locale === 'tr' ? 'Tasarımı Kaydet' : 'Register Design'}
        </button>
        {!complete && (
          <p className="mt-2 text-center text-[11px] text-bureau-muted">
            {locale === 'tr'
              ? 'Devam etmek için tüm parçaları seçin.'
              : 'Select all parts to continue.'}
          </p>
        )}
      </div>
    </div>
  )
}