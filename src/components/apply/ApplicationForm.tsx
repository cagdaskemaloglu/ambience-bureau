'use client'

import { useMemo, useState } from 'react'
import { useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { countryOptions } from '@/lib/countries'

export type ApplicationType = 'hub' | 'creator'

export interface ApplicationUser {
  email: string
  name: string
}

const INPUT =
  'w-full border border-bureau-black bg-bureau-white px-3 py-2.5 font-mono text-[12px] outline-none transition-colors focus:border-bureau-amber'
const LABEL = 'mb-1 block font-mono text-[9.5px] uppercase tracking-wider text-bureau-muted'

const DISCIPLINES = [
  { value: 'lighting', tr: 'Aydınlatma tasarımı', en: 'Lighting design' },
  { value: 'industrial', tr: 'Endüstriyel tasarım', en: 'Industrial design' },
  { value: 'product3d', tr: '3D modelleme / ürün görselleştirme', en: '3D modelling / product visualisation' },
  { value: 'interior', tr: 'İç mimarlık', en: 'Interior architecture' },
  { value: 'other', tr: 'Diğer', en: 'Other' },
] as const

/**
 * Hem "Bölge Bürosu Ol" hem "Tasarım Departmanına Katıl" sayfalarının
 * başvuru formu. Misafirler formu görür ve doldurabilir, ama GÖNDERMEK
 * için üye olmak gerekir (sunucu da /api/apply'da bunu ayrıca zorlar).
 */
export function ApplicationForm({
  type,
  user,
  nextPath,
  country,
  onCountryChange,
}: {
  type: ApplicationType
  user: ApplicationUser | null
  /** Giriş/kayıt sonrası dönülecek yol (locale öneksiz), örn. "/become-bureau-hub". */
  nextPath: string
  country?: string
  onCountryChange?: (alpha2: string) => void
}) {
  const locale = useLocale()
  const tr = locale === 'tr'
  const lang = tr ? 'tr' : 'en'
  const options = useMemo(() => countryOptions(lang), [lang])

  const [form, setForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: '',
    city: '',
    organization: '',
    portfolioUrl: '',
    discipline: 'lighting',
    message: '',
  })
  const [localCountry, setLocalCountry] = useState('')
  const countryValue = country !== undefined ? country : localCountry

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needLogin, setNeedLogin] = useState(false)

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleCountry(e: React.ChangeEvent<HTMLSelectElement>) {
    setLocalCountry(e.target.value)
    onCountryChange?.(e.target.value)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!user) {
      setNeedLogin(true)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, locale, country: countryValue, ...form }),
      })
      const data = await res.json().catch(() => ({}))

      if (res.status === 401) {
        setNeedLogin(true)
      } else if (!res.ok) {
        setError(data.error ?? (tr ? 'Bir hata oluştu.' : 'An error occurred.'))
      } else {
        setSuccess(true)
      }
    } catch {
      setError(tr ? 'Bağlantı hatası.' : 'Connection error.')
    } finally {
      setLoading(false)
    }
  }

  const refCode = type === 'hub' ? 'FORM 400-H' : 'FORM 400-C'

  if (success) {
    return (
      <div className="border border-bureau-amber bg-bureau-amber/5 p-6 text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bureau-amber opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-bureau-amber" />
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-bureau-amber">
            {tr ? 'Başvuru Kaydedildi' : 'Application Filed'}
          </span>
        </div>
        <p className="text-[13px] text-bureau-muted">
          {tr
            ? 'Başvurunuz alındı. Değerlendirmenin ardından sizinle e-posta yoluyla iletişime geçeceğiz.'
            : 'Your application has been received. We will contact you by email after review.'}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Misafir uyarısı */}
      <div
        className={`border px-4 py-3 text-[12px] leading-relaxed ${
          needLogin
            ? 'border-bureau-amber bg-bureau-amber/10 text-bureau-black'
            : 'border-bureau-rule bg-bureau-surface text-bureau-muted'
        } ${user ? 'hidden' : ''}`}
      >
        {tr
          ? 'Başvuruyu göndermek için üye olmanız gerekir. Formu şimdi doldurabilirsiniz; göndermeden önce giriş yapın.'
          : 'You need to be a member to submit an application. You can fill in the form now, but please sign in before sending.'}
        <span className="mt-2 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[10.5px] uppercase tracking-wider">
          <Link
            href={`/auth/login?next=${encodeURIComponent(nextPath)}`}
            className="text-bureau-amber underline"
          >
            {tr ? 'Giriş Yap' : 'Sign In'}
          </Link>
          <Link href="/auth/signup" className="text-bureau-amber underline">
            {tr ? 'Kayıt Ol' : 'Register'}
          </Link>
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={LABEL}>
            {tr ? 'Ad Soyad' : 'Full Name'} <span className="text-bureau-amber">*</span>
          </label>
          <input name="name" value={form.name} onChange={handleChange} required className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>
            {tr ? 'E-posta' : 'Email'} <span className="text-bureau-amber">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className={INPUT}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={LABEL}>
            {type === 'hub'
              ? tr ? 'Başvuru Ülkesi' : 'Country of Application'
              : tr ? 'Ülke' : 'Country'}{' '}
            {type === 'hub' && <span className="text-bureau-amber">*</span>}
          </label>
          <select
            name="country"
            value={countryValue}
            onChange={handleCountry}
            required={type === 'hub'}
            className={INPUT}
          >
            <option value="">{tr ? 'Seçiniz' : 'Select'}</option>
            {options.map((o) => (
              <option key={o.code} value={o.code}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL}>{tr ? 'Telefon' : 'Phone'}</label>
          <input name="phone" value={form.phone} onChange={handleChange} className={INPUT} />
        </div>
      </div>

      {type === 'hub' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL}>{tr ? 'Şehir' : 'City'}</label>
            <input name="city" value={form.city} onChange={handleChange} className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>
              {tr ? 'Şirket / Kuruluş (varsa)' : 'Company / Organisation (if any)'}
            </label>
            <input
              name="organization"
              value={form.organization}
              onChange={handleChange}
              className={INPUT}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL}>{tr ? 'Çalışma Alanı' : 'Discipline'}</label>
            <select
              name="discipline"
              value={form.discipline}
              onChange={handleChange}
              className={INPUT}
            >
              {DISCIPLINES.map((d) => (
                <option key={d.value} value={d.value}>
                  {tr ? d.tr : d.en}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL}>
              {tr ? 'Portfolyo / Web Sitesi' : 'Portfolio / Website'}
            </label>
            <input
              type="url"
              name="portfolioUrl"
              value={form.portfolioUrl}
              onChange={handleChange}
              placeholder="https://"
              className={INPUT}
            />
          </div>
        </div>
      )}

      <div>
        <label className={LABEL}>
          {type === 'hub'
            ? tr ? 'Kendinizi ve planınızı anlatın' : 'Tell us about yourself and your plan'
            : tr ? 'Tasarım yaklaşımınızı anlatın' : 'Tell us about your design approach'}{' '}
          <span className="text-bureau-amber">*</span>
        </label>
        <textarea
          name="message"
          value={form.message}
          onChange={handleChange}
          required
          rows={5}
          className={`${INPUT} resize-none`}
        />
      </div>

      {error && (
        <p className="border border-red-300 bg-red-50 px-3 py-2 text-[11px] text-red-600">{error}</p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={loading}
          className="btn-bureau w-full disabled:opacity-50 sm:w-auto sm:px-10"
        >
          {loading
            ? tr ? 'Gönderiliyor...' : 'Sending...'
            : tr ? 'Başvuruyu Gönder' : 'Submit Application'}
        </button>
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-bureau-subtle">
          {refCode} // {tr ? 'BAŞVURU' : 'APPLICATION'}
        </span>
      </div>
    </form>
  )
}
