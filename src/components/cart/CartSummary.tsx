'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { formatPrice } from '@/lib/sanity'
import { useCartStore } from '@/lib/store/cart'
import { useEffect, useState } from 'react'
import { getCurrentUser, getProfile } from '@/lib/supabase/auth'

// 1 BC = 1 TRY veya 1 USD (locale'e göre)
const BC_TO_CURRENCY = 1

export function CartSummary() {
  const locale = useLocale() as 'tr' | 'en'
  const t = useTranslations('cart')
  const getTotal = useCartStore((s) => s.getTotal)
  const items = useCartStore((s) => s.items)

  const total = getTotal(locale)
  const currency = locale === 'tr' ? 'TRY' : 'USD'
  const intlLocale = locale === 'tr' ? 'tr-TR' : 'en-US'
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

  const issuedCredits = Math.floor(total * 0.1 * 100) / 100

  const [bureauCredits, setBureauCredits] = useState<number>(0)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [useCredits, setUseCredits] = useState(false)

  useEffect(() => {
    getCurrentUser().then(async (user) => {
      if (user) {
        setIsLoggedIn(true)
        const profile = await getProfile(user.id)
        if (profile) {
          setBureauCredits(Number((profile as any).bureau_credits ?? 0))
        }
      }
    })
  }, [])

  // Kullanılabilecek max kredi — toplam fiyatı geçemez
  const maxUsable = Math.min(bureauCredits, total)
  const creditsToUse = useCredits ? maxUsable : 0
  const finalTotal = Math.max(0, total - creditsToUse)

  return (
    <div className="border border-bureau-black">
      <div className="border-b border-bureau-black bg-bureau-surface px-4 py-2.5">
        <span className="label-mono">FORM 220-C: ORDER MANIFEST</span>
      </div>

      <div className="divide-y divide-dashed divide-bureau-rule">
        <div className="flex justify-between px-4 py-2.5 text-[12px]">
          <span className="text-bureau-muted">
            {locale === 'tr' ? 'Kayıtlı Nesne' : 'Registered Objects'}
          </span>
          <span className="font-mono">{itemCount}</span>
        </div>

        {/* Ara toplam */}
        {useCredits && creditsToUse > 0 && (
          <div className="flex justify-between px-4 py-2 text-[12px]">
            <span className="text-bureau-muted">
              {locale === 'tr' ? 'Ara Toplam' : 'Subtotal'}
            </span>
            <span className="font-mono text-bureau-subtle line-through">
              {formatPrice(total, currency, intlLocale)}
            </span>
          </div>
        )}

        {/* Mevcut Bureau Credits + kullan toggle */}
        {isLoggedIn && bureauCredits > 0 && (
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="block font-mono text-[10px] uppercase tracking-wider text-bureau-muted">
                  {locale === 'tr' ? 'Büro Kredisi' : 'Bureau Credits'}
                </span>
                <span className="font-mono text-[11px] text-bureau-black">
                  {bureauCredits.toFixed(2)} BC {locale === 'tr' ? 'mevcut' : 'available'}
                </span>
              </div>
              <button
                onClick={() => setUseCredits(v => !v)}
                className={`relative h-6 w-11 flex-shrink-0 border transition-colors ${
                  useCredits ? 'border-bureau-amber bg-bureau-amber' : 'border-bureau-rule bg-white'
                }`}
                aria-pressed={useCredits}
              >
                <span className={`absolute top-0.5 h-5 w-5 border transition-transform ${
                  useCredits ? 'translate-x-5 border-white bg-white' : 'translate-x-0 border-bureau-rule bg-bureau-subtle'
                }`} />
              </button>
            </div>
            {useCredits && creditsToUse > 0 && (
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="font-mono text-bureau-amber">
                  {locale === 'tr' ? 'Kullanılacak' : 'Applied'}
                </span>
                <span className="font-mono font-semibold text-bureau-amber">
                  -{creditsToUse.toFixed(2)} BC
                </span>
              </div>
            )}
          </div>
        )}

        {/* Kazanılacak Bureau Credits */}
        {isLoggedIn && issuedCredits > 0 && (
          <div className="flex items-center justify-between bg-bureau-amber/5 px-4 py-2.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-bureau-amber">
              {locale === 'tr' ? 'Bu İşlemden Kazanılacak' : 'Issued Credits'}
            </span>
            <span className="font-mono text-[12px] font-semibold text-bureau-amber">
              +{issuedCredits.toFixed(2)} BC
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-bureau-black px-4 py-3">
        <span className="font-mono text-[11px] uppercase tracking-wide">{t('total')}</span>
        <span className="font-mono text-[18px] font-semibold">
          {formatPrice(finalTotal, currency, intlLocale)}
        </span>
      </div>

      <p className="px-4 pb-2 text-[10.5px] text-bureau-subtle">
        {locale === 'tr'
          ? 'Kargo ve KDV ödeme adımında hesaplanır.'
          : 'Shipping and VAT calculated at checkout.'}
      </p>

      <div className="space-y-2 p-4 pt-2">
        <Link
          href={`/checkout${useCredits && creditsToUse > 0 ? `?useCredits=${creditsToUse.toFixed(2)}` : ''}`}
          className="btn-bureau block w-full text-center"
        >
          {t('checkout')}
        </Link>
        <Link
          href="/registry"
          className="block w-full text-center font-mono text-[10.5px] uppercase tracking-wide text-bureau-muted hover:text-bureau-amber"
        >
          {t('continueShopping')}
        </Link>
      </div>
    </div>
  )
}