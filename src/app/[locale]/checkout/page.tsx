'use client'

import { useTranslations } from 'next-intl'
import { CheckoutForm } from '@/components/checkout/CheckoutForm'

export default function CheckoutPage() {
  const t = useTranslations('checkout')

  return (
    <div className="px-6 py-9 sm:px-10">
      <div className="mb-6 border-b border-dashed border-bureau-rule pb-4">
        <div className="label-mono mb-1">FORM 220-D</div>
        <h1 className="text-[28px] font-light uppercase tracking-wide">{t('title')}</h1>
      </div>

      <CheckoutForm />
    </div>
  )
}
