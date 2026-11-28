'use client'

import { useLocale } from 'next-intl'
import { useConfiguratorStore } from '@/lib/store/configurator'

/**
 * Akıllı Cihaz (IoT) anahtarı + Donanım Tahsisi ücreti.
 *  - size 'md': tahsis formunun içinde (eski görünüm).
 *  - size 'lg': anasayfaya gömülü stüdyonun solunda, koleksiyon künyesinin
 *    üstünde; büyük, açıklamalı kart.
 */
export function IotToggle({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const locale = useLocale()
  const tr = locale === 'tr'
  const iotEnabled = useConfiguratorStore((s) => s.iotEnabled)
  const hardwareFees = useConfiguratorStore((s) => s.hardwareFees)
  const toggleIot = useConfiguratorStore((s) => s.toggleIot)

  const fee = (n: number) => (tr ? `₺${n.toLocaleString('tr-TR')}` : `$${n}`)
  const base = tr ? hardwareFees.baseTRY : hardwareFees.baseUSD
  const iot = tr ? hardwareFees.iotTRY : hardwareFees.iotUSD
  const feeLabel = tr
    ? iotEnabled
      ? `Donanım Tahsisi: ${fee(base + iot)} (${fee(base)} + ${fee(iot)} IoT)`
      : `Donanım Tahsisi: ${fee(base)}`
    : iotEnabled
      ? `Hardware Allocation: ${fee(base + iot)} (${fee(base)} + ${fee(iot)} IoT)`
      : `Hardware Allocation: ${fee(base)}`
  const title = tr ? 'Akıllı Cihaz (IoT)' : 'Smart Device (IoT)'
  const lg = size === 'lg'

  const knob = (
    <span
      aria-hidden="true"
      className={`relative block flex-shrink-0 overflow-hidden rounded-full transition-colors ${lg ? 'h-8 w-[60px]' : 'h-6 w-11'} ${
        iotEnabled ? 'bg-bureau-amber' : 'bg-bureau-rule'
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 rounded-full bg-white shadow-sm transition-transform ${lg ? 'h-7 w-7' : 'h-5 w-5'} ${
          iotEnabled ? (lg ? 'translate-x-7' : 'translate-x-5') : 'translate-x-0'
        }`}
      />
    </span>
  )

  // Bütün kart tek bir anahtar: büyük tıklama alanı.
  return (
    <button
      type="button"
      onClick={toggleIot}
      role="switch"
      aria-checked={iotEnabled}
      aria-label={title}
      className={`focus-bureau group flex w-full items-center justify-between gap-4 border text-left transition-colors ${
        lg
          ? `p-4 backdrop-blur-[4px] ${iotEnabled ? 'border-bureau-amber bg-bureau-amber/10' : 'border-bureau-rule bg-bureau-white/70 hover:border-bureau-black'}`
          : 'border-bureau-rule p-3'
      }`}
    >
      <span className="min-w-0">
        <span className={`block font-mono uppercase tracking-wide text-bureau-black ${lg ? 'text-[13px] font-semibold' : 'text-[10.5px]'}`}>
          {title}
          {lg && (
            <span className={`ml-2 font-normal ${iotEnabled ? 'text-bureau-amber' : 'text-bureau-subtle'}`}>
              {iotEnabled ? (tr ? 'Açık' : 'On') : tr ? 'Kapalı' : 'Off'}
            </span>
          )}
        </span>
        {lg && (
          <span className="mt-1 block text-[12px] leading-snug text-bureau-muted">
            {tr
              ? 'Lamba uygulamaya bağlanır: sahneler, zamanlama ve uzaktan kontrol.'
              : 'The lamp joins the app: scenes, schedules and remote control.'}
          </span>
        )}
        <span className={`block font-mono text-bureau-muted ${lg ? 'mt-1.5 text-[10.5px]' : 'text-[9.5px]'}`}>{feeLabel}</span>
      </span>
      {knob}
    </button>
  )
}
