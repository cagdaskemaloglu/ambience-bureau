'use client'

import { useLocale } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { Link } from '@/i18n/navigation'

export function ConfirmationContent() {
  const locale = useLocale()
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order')

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="max-w-md border border-bureau-black text-center">
        <div className="border-b border-bureau-black bg-bureau-surface px-4 py-2.5">
          <span className="label-mono">FORM 220-E: REGISTRATION CONFIRMED</span>
        </div>
        <div className="p-8">
          <div className="mb-4 font-mono text-[11px] uppercase tracking-wide text-bureau-amber">
            ● {locale === 'tr' ? 'Kayıt Onaylandı' : 'Registration Confirmed'}
          </div>
          <h1 className="mb-4 text-[22px] font-light uppercase tracking-wide">
            {locale === 'tr' ? 'Siparişiniz Kayıt Altına Alındı' : 'Your Order Has Been Registered'}
          </h1>
          {orderNumber && (
            <p className="mb-6 font-mono text-[14px] font-semibold">{orderNumber}</p>
          )}
          <p className="mb-8 text-[13px] leading-relaxed text-bureau-muted">
            {locale === 'tr'
              ? 'Sipariş onay belgeniz kayıtlı e-posta adresinize gönderilecektir. Ödeme durumu güncellemeleri için bu sayfayı referans olarak kullanabilirsiniz.'
              : 'Your order confirmation document will be sent to your registered email address. You may reference this page for payment status updates.'}
          </p>
          <Link href="/registry" className="btn-bureau inline-block">
            {locale === 'tr' ? 'Kayda Dön' : 'Return to Registry'}
          </Link>
        </div>
      </div>
    </div>
  )
}
