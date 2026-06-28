'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { formatPrice } from '@/lib/sanity'
import { useCartStore } from '@/lib/store/cart'
import { getCurrentUser } from '@/lib/supabase/auth'
import { IyzicoPaymentForm } from './IyzicoPaymentForm'

type CheckoutMode = 'guest' | 'member' | 'checking'

export function CheckoutForm() {
  const locale = useLocale() as 'tr' | 'en'
  const t = useTranslations('checkout')

  const items = useCartStore((s) => s.items)
  const getTotal = useCartStore((s) => s.getTotal)

  const [mode, setMode] = useState<CheckoutMode>('checking')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [guestEmail, setGuestEmail] = useState('')
  const [formContent, setFormContent] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    postal: '',
    country: locale === 'tr' ? 'TR' : 'US',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Giriş yapmış kullanıcı var mı kontrol et
  useEffect(() => {
    getCurrentUser().then((user) => {
      if (user) {
        setMode('member')
        setUserEmail(user.email ?? null)
      } else {
        setMode('guest')
      }
    })
  }, [])

  const currency = locale === 'tr' ? 'TRY' : 'USD'
  const intlLocale = locale === 'tr' ? 'tr-TR' : 'en-US'
  // NOT: Sanity'deki ürün fiyatları (priceTRY/priceUSD) ZATEN KDV DAHİLDİR.
  // Burada ayrıca KDV hesaplayıp eklemiyoruz — bu hem müşteriye çift KDV
  // göstermiş olurdu hem de iyzico'ya gönderilen tutarla basket item
  // toplamı arasında tutarsızlık yaratıp "geçersiz imza" hatasına yol açardı.
  const total = getTotal(locale)

  function updateField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (mode === 'guest' && !guestEmail) {
      setError(t('errors.guestEmailRequired'))
      return
    }

    if (!form.name || !form.address1 || !form.city || !form.postal || !form.phone) {
      setError(t('errors.fieldsRequired'))
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          currency,
          locale,
          guestEmail: mode === 'guest' ? guestEmail : undefined,
          shippingInfo: form,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? t('errors.generic'))
      }

      const { checkoutFormContent } = await res.json()

      if (!checkoutFormContent) {
        throw new Error(t('errors.generic'))
      }

      // Ödeme formu hazır — sepeti BURADA temizlemiyoruz, sadece
      // ödeme başarıyla tamamlandığında (onay sayfasında) temizlenecek.
      setFormContent(checkoutFormContent)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Ödeme formu hazırsa, checkout formunu değil iyzico widget'ını göster
  if (formContent) {
    return <IyzicoPaymentForm htmlContent={formContent} />
  }

  if (items.length === 0) {
    return (
      <div className="border border-dashed border-bureau-rule p-10 text-center">
        <p className="font-mono text-[12px] uppercase tracking-wide text-bureau-subtle">
          {locale === 'tr' ? 'Sepetiniz boş.' : 'Your cart is empty.'}
        </p>
        <Link href="/registry" className="btn-bureau-outline mt-4 inline-block">
          {locale === 'tr' ? 'Kayda Dön' : 'Return to Registry'}
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Misafir / Üye seçimi */}
        {mode === 'guest' && (
          <div className="border border-bureau-black">
            <div className="border-b border-bureau-black bg-bureau-surface px-4 py-2.5">
              <span className="label-mono">{t('guestOrMember.heading')}</span>
            </div>
            <div className="p-4">
              <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-bureau-muted">
                {t('guestEmail.label')}
              </label>
              <input
                type="email"
                required
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder={t('guestEmail.placeholder')}
                className="input-bureau"
              />
              <p className="mt-1.5 text-[11px] text-bureau-muted">{t('guestEmail.note')}</p>
              <p className="mt-3 text-[11px] text-bureau-muted">
                {t('guestOrMember.alreadyMember')}{' '}
                <Link href="/auth/login" className="text-bureau-amber hover:underline">
                  {t('guestOrMember.loginLink')}
                </Link>
              </p>
            </div>
          </div>
        )}

        {mode === 'member' && userEmail && (
          <div className="border border-bureau-black p-4">
            <span className="label-mono">{locale === 'tr' ? 'Üye Hesabı' : 'Member Account'}</span>
            <p className="mt-1 text-[13px]">{userEmail}</p>
          </div>
        )}

        {/* Teslimat formu */}
        <div className="border border-bureau-black">
          <div className="border-b border-bureau-black bg-bureau-surface px-4 py-2.5">
            <span className="label-mono">{t('formRef')}</span>
          </div>
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
            <Field label={t('shipping.name')} required>
              <input
                required
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="input-bureau"
              />
            </Field>
            <Field label={t('shipping.phone')} required>
              <input
                required
                type="tel"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className="input-bureau"
              />
            </Field>
            <Field label={t('shipping.address1')} required className="sm:col-span-2">
              <input
                required
                value={form.address1}
                onChange={(e) => updateField('address1', e.target.value)}
                className="input-bureau"
              />
            </Field>
            <Field label={t('shipping.address2')} className="sm:col-span-2">
              <input
                value={form.address2}
                onChange={(e) => updateField('address2', e.target.value)}
                className="input-bureau"
              />
            </Field>
            <Field label={t('shipping.city')} required>
              <input
                required
                value={form.city}
                onChange={(e) => updateField('city', e.target.value)}
                className="input-bureau"
              />
            </Field>
            <Field label={t('shipping.postal')} required>
              <input
                required
                value={form.postal}
                onChange={(e) => updateField('postal', e.target.value)}
                className="input-bureau"
              />
            </Field>
          </div>
        </div>

        {error && (
          <p className="border border-red-600 bg-red-50 px-4 py-2.5 text-[12px] text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || mode === 'checking'}
          className={`btn-bureau w-full ${isSubmitting ? 'cursor-not-allowed opacity-60' : ''}`}
        >
          {isSubmitting ? t('submitting') : t('submit')}
        </button>
      </form>

      {/* Sipariş özeti */}
      <div>
        <div className="border border-bureau-black">
          <div className="border-b border-bureau-black bg-bureau-surface px-4 py-2.5">
            <span className="label-mono">{t('summary.heading')}</span>
          </div>
          <div className="divide-y divide-dashed divide-bureau-rule">
            {items.map((item) => {
              const unitPrice = locale === 'tr' ? item.priceTRY : item.priceUSD
              return (
                <div key={item.id} className="flex justify-between px-4 py-2.5 text-[12px]">
                  <span className="text-bureau-muted">
                    {item.name[locale]} × {item.quantity}
                  </span>
                  <span className="font-mono">
                    {formatPrice(unitPrice * item.quantity, currency, intlLocale)}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="divide-y divide-dashed divide-bureau-rule border-t border-bureau-black">
            <div className="flex justify-between px-4 py-2 text-[12px]">
              <span className="text-bureau-muted">{t('summary.subtotal')}</span>
              <span className="font-mono">{formatPrice(total, currency, intlLocale)}</span>
            </div>
            <div className="flex justify-between px-4 py-2 text-[12px]">
              <span className="text-bureau-muted">{t('summary.vatIncluded')}</span>
              <span className="font-mono text-bureau-subtle">{t('summary.included')}</span>
            </div>
            <div className="flex justify-between px-4 py-2 text-[12px]">
              <span className="text-bureau-muted">{t('summary.shipping')}</span>
              <span className="font-mono text-bureau-amber">{t('summary.free')}</span>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-bureau-black px-4 py-3">
            <span className="font-mono text-[11px] uppercase tracking-wide">
              {t('summary.total')}
            </span>
            <span className="font-mono text-[16px] font-semibold">
              {formatPrice(total, currency, intlLocale)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  required,
  children,
  className = '',
}: {
  label: string
  required?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-bureau-muted">
        {label}
        {required && <span className="text-bureau-amber"> *</span>}
      </label>
      {children}
    </div>
  )
}