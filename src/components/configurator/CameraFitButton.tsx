'use client'

import { useLocale } from 'next-intl'
import { useConfiguratorStore } from '@/lib/store/configurator'

/**
 * 3D viewer'ın sağ üst köşesinde duran tek amaçlı buton: kamerayı, doğru
 * başlangıç açısıyla birlikte mevcut parça uzunluğuna göre otomatik olarak
 * yeniden sığdırır (kullanıcı OrbitControls ile modeli döndürüp/kaydırıp
 * kaybolduğunda "sıfırlama" görevi görür).
 */
export function CameraFitButton() {
  const locale = useLocale()
  const collectionKey = useConfiguratorStore((s) => s.collectionKey)
  const requestCameraFit = useConfiguratorStore((s) => s.requestCameraFit)

  if (!collectionKey) return null

  return (
    <div className="pointer-events-none absolute right-3 top-3 z-10">
      <button
        onClick={requestCameraFit}
        className="pointer-events-auto flex items-center gap-1.5 border border-bureau-black bg-white/90 px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-widest text-bureau-muted backdrop-blur-sm transition-colors hover:border-bureau-amber hover:text-bureau-amber"
        title={locale === 'tr' ? 'Kamerayı Sığdır' : 'Fit Camera'}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3H5a2 2 0 0 0-2 2v3" />
          <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
          <path d="M3 16v3a2 2 0 0 0 2 2h3" />
          <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
        </svg>
        {locale === 'tr' ? 'Sığdır' : 'Fit'}
      </button>
    </div>
  )
}