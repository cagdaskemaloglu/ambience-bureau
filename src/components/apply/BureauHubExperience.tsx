'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { WorldMap } from './WorldMap'
import { ApplicationForm, type ApplicationUser } from './ApplicationForm'
import { activeBureauCount } from '@/lib/bureauHubs'
import { countryName, flagEmoji } from '@/lib/countries'

/**
 * Harita + başvuru formu: haritada bir ülkeye tıklanınca form bölümüne
 * kayarak iner ve formdaki "Başvuru Ülkesi" o ülke olarak seçilir.
 */
export function BureauHubExperience({ user }: { user: ApplicationUser | null }) {
  const locale = useLocale()
  const tr = locale === 'tr'
  const [country, setCountry] = useState('')

  function handleSelect(alpha2: string) {
    setCountry(alpha2)
    // Form seçimi state'e yansıdıktan sonra kaydır.
    requestAnimationFrame(() => {
      document.getElementById('apply-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  return (
    <>
      <WorldMap selected={country || null} onSelect={handleSelect} />

      <div id="apply-form" className="mt-12 scroll-mt-24 border-t border-bureau-black pt-10">
        <div className="mb-5 border-b border-bureau-black pb-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-bureau-muted">
            FORM 400-H // {tr ? 'BÖLGE BÜROSU BAŞVURUSU' : 'REGIONAL OFFICE APPLICATION'}
          </span>
          <h2 className="mt-1 text-[20px] font-light uppercase tracking-wide text-bureau-black">
            {tr ? 'Başvuru Formu' : 'Application Form'}
          </h2>
          {country && (
            <p className="mt-2 font-mono text-[11px] text-bureau-muted">
              {flagEmoji(country)} {countryName(country, tr ? 'tr' : 'en')} —{' '}
              {tr ? 'Aktif büro' : 'Active bureaus'}: {activeBureauCount(country)}
            </p>
          )}
        </div>
        <ApplicationForm
          type="hub"
          user={user}
          nextPath="/become-bureau-hub"
          country={country}
          onCountryChange={setCountry}
        />
      </div>
    </>
  )
}
