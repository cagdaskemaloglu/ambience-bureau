'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { useCartStore } from '@/lib/store/cart'

const ERROR_MESSAGES: Record<string, { tr: string; en: string }> = {
  payment_failed: {
    tr: 'Ödeme işlemi tamamlanamadı. Lütfen tekrar deneyin.',
    en: 'Payment could not be completed. Please try again.',
  },
  missing_token: {
    tr: 'Ödeme oturumu geçersiz. Lütfen tekrar deneyin.',
    en: 'Invalid payment session. Please try again.',
  },
  retrieve_failed: {
    tr: 'Ödeme durumu doğrulanamadı. Lütfen destek ile iletişime geçin.',
    en: 'Payment status could not be verified. Please contact support.',
  },
  order_not_found: {
    tr: 'Sipariş kaydı bulunamadı.',
    en: 'Order record not found.',
  },
  unexpected: {
    tr: 'Beklenmeyen bir hata oluştu.',
    en: 'An unexpected error occurred.',
  },
}

export function ConfirmationContent() {
  const locale = useLocale() as 'tr' | 'en'
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order')
  const status = searchParams.get('status') // 'success' veya null/error
  const reason = searchParams.get('reason')

  const clearCart = useCartStore((s) => s.clearCart)
  const [cleared, setCleared] = useState(false)

  const isSuccess = status === 'success'

  // Ödeme başarılı olduğunda sepeti temizle (sadece bir kere)
  useEffect(() => {
    if (isSuccess && !cleared) {
      clearCart()
      setCleared(true)
    }
  }, [isSuccess, cleared, clearCart])

  if (!isSuccess) {
    const errorMessage = reason ? ERROR_MESSAGES[reason]?.[locale] : null

    return (
      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="max-w-md border border-bureau-black text-center">
          <div className="border-b border-bureau-black bg-bureau-surface px-4 py-2.5">
            <span className="label-mono">FORM 220-E: REGISTRATION FAILED</span>
          </div>
          <div className="p-8">
            <div className="mb-4 font-mono text-[11px] uppercase tracking-wide text-red-600">
              ● {locale === 'tr' ? 'Kayıt Başarısız' : 'Registration Failed'}
            </div>
            <h1 className="mb-4 text-[22px] font-light uppercase tracking-wide">
              {locale === 'tr' ? 'Sipariş Tamamlanamadı' : 'Order Could Not Be Completed'}
            </h1>
            <p className="mb-8 text-[13px] leading-relaxed text-bureau-muted">
              {errorMessage ?? ERROR_MESSAGES.unexpected[locale]}
            </p>
            <Link href="/cart" className="btn-bureau inline-block">
              {locale === 'tr' ? 'Sepete Dön' : 'Return to Cart'}
            </Link>
          </div>
        </div>
      </div>
    )
  }

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
