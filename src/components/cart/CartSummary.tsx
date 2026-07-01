'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { formatPrice } from '@/lib/sanity'
import { useCartStore } from '@/lib/store/cart'
import { useEffect, useState } from 'react'
import { getCurrentUser, getProfile } from '@/lib/supabase/auth'

export function CartSummary() {
  const locale = useLocale() as 'tr' | 'en'
  const t = useTranslations('cart')
  const getTotal = useCartStore((s) => s.getTotal)
  const items = useCartStore((s) => s.items)

  const total = getTotal(locale)
  const currency = locale === 'tr' ? 'TRY' : 'USD'
  const intlLocale = locale === 'tr' ? 'tr-TR' : 'en-US'
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

  // Kazanılacak kredi: toplam x %10
  const issuedCredits = Math.floor(total * 0.1 * 100) / 100

  const [bureauCredits, setBureauCredits] = useState<number | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    getCurrentUser().then(async (user) => {
      if (user) {
        setIsLoggedIn(true)
        const profile = await getProfile(user.id)
        if (profile) {
          setBureauCredits((profile as any).bureau_credits ?? 0)
        }
      }
    })
  }, [])

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

        {/* Mevcut Bureau Credits */}
        {isLoggedIn && bureauCredits !== null && bureauCredits > 0 && (
          <div className="flex items-center justify-between px-4 py-2.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-bureau-muted">
              {locale === 'tr' ? 'Mevcut Büro Krediniz' : 'Available Bureau Credits'}
            </span>
            <span className="font-mono text-[12px] text-bureau-muted">
              {bureauCredits.toFixed(2)} BC
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-bureau-black px-4 py-3">
        <span className="font-mono text-[11px] uppercase tracking-wide">{t('total')}</span>
        <span className="font-mono text-[18px] font-semibold">
          {formatPrice(total, currency, intlLocale)}
        </span>
      </div>

      <p className="px-4 pb-2 text-[10.5px] text-bureau-subtle">
        {locale === 'tr'
          ? 'Kargo ve KDV ödeme adımında hesaplanır.'
          : 'Shipping and VAT calculated at checkout.'}
      </p>

      <div className="space-y-2 p-4 pt-2">
        <Link href="/checkout" className="btn-bureau block w-full text-center">
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