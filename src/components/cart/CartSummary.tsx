'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { formatPrice } from '@/lib/sanity'
import { useCartStore } from '@/lib/store/cart'

export function CartSummary() {
  const locale = useLocale() as 'tr' | 'en'
  const t = useTranslations('cart')
  const getTotal = useCartStore((s) => s.getTotal)
  const items = useCartStore((s) => s.items)

  const total = getTotal(locale)
  const currency = locale === 'tr' ? 'TRY' : 'USD'
  const intlLocale = locale === 'tr' ? 'tr-TR' : 'en-US'
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

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
