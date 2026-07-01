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

// Timestamp: şimdiki tarih + saat (client-side, hydration uyumlu)
function useTimestamp() {
  const [ts, setTs] = useState<string>('')
  useEffect(() => {
    const now = new Date()
    setTs(
      now.toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
      }).toUpperCase() +
      ' — ' +
      now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) +
      ' UTC' + (now.getTimezoneOffset() === 0 ? '+0' : '')
    )
  }, [])
  return ts
}

export function ConfirmationContent() {
  const locale = useLocale() as 'tr' | 'en'
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order')
  const status = searchParams.get('status')
  const reason = searchParams.get('reason')
  const timestamp = useTimestamp()

  const clearCart = useCartStore((s) => s.clearCart)
  const [cleared, setCleared] = useState(false)

  const isSuccess = status === 'success'

  useEffect(() => {
    if (isSuccess && !cleared) {
      clearCart()
      setCleared(true)
    }
  }, [isSuccess, cleared, clearCart])

  // ── HATA DURUMU ────────────────────────────────────────────
  if (!isSuccess) {
    const errorMessage = reason ? ERROR_MESSAGES[reason]?.[locale] : null

    return (
      <div className="flex flex-1 items-center justify-center px-5 py-16">
        <div className="w-full max-w-lg border border-bureau-black">
          {/* Header band */}
          <div className="border-b border-bureau-black bg-bureau-black px-5 py-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/60">
                FORM 220-E // CLASSIFICATION: INTERNAL
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-red-400">
                STATUS: FAILED
              </span>
            </div>
          </div>

          <div className="px-7 py-8">
            <div className="mb-6 flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-red-600">
                {locale === 'tr' ? 'Kayıt Başarısız' : 'Registration Failed'}
              </span>
            </div>

            <h1 className="mb-2 text-[26px] font-light uppercase leading-tight tracking-wide text-bureau-black">
              {locale === 'tr' ? 'Sipariş' : 'Order'}<br />
              {locale === 'tr' ? 'Tamamlanamadı' : 'Could Not Be'}
              {locale === 'en' && <><br />Completed</>}
            </h1>

            <div className="my-6 border-t border-dashed border-bureau-rule" />

            <p className="mb-8 text-[13px] leading-relaxed text-bureau-muted">
              {errorMessage ?? ERROR_MESSAGES.unexpected[locale]}
            </p>

            <div className="flex gap-3">
              <Link href="/cart" className="btn-bureau inline-block flex-1 text-center">
                {locale === 'tr' ? 'Sepete Dön' : 'Return to Cart'}
              </Link>
              <Link href="/registry" className="btn-bureau-outline inline-block flex-1 text-center">
                {locale === 'tr' ? 'Kayda Dön' : 'Return to Registry'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── BAŞARI DURUMU ──────────────────────────────────────────
  return (
    <div className="flex flex-1 items-center justify-center px-5 py-16">
      <div className="w-full max-w-lg border border-bureau-black">

        {/* Header band */}
        <div className="border-b border-bureau-black bg-bureau-black px-5 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/60">
              FORM 220-E // CLASSIFICATION: CONFIRMED
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-bureau-amber">
              STATUS: ACTIVE
            </span>
          </div>
        </div>

        <div className="px-7 pt-8 pb-6">
          {/* Status indicator */}
          <div className="mb-6 flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bureau-amber opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-bureau-amber" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-bureau-amber">
              {locale === 'tr' ? 'Nesne Kayıt Altına Alındı' : 'Object Successfully Registered'}
            </span>
          </div>

          {/* Main heading */}
          <h1 className="mb-1 text-[28px] font-light uppercase leading-tight tracking-wide text-bureau-black">
            {locale === 'tr' ? 'Nesneniz' : 'Your Object'}
          </h1>
          <h1 className="mb-1 text-[28px] font-light uppercase leading-tight tracking-wide text-bureau-black">
            {locale === 'tr' ? 'Kayıt Altına' : 'Has Been'}
          </h1>
          <h1 className="mb-6 text-[28px] font-light uppercase leading-tight tracking-wide text-bureau-amber">
            {locale === 'tr' ? 'Alındı' : 'Registered'}
          </h1>

          <div className="my-5 border-t border-dashed border-bureau-rule" />

          {/* Registry details table */}
          <div className="mb-5 space-y-0 border border-bureau-rule">
            <div className="flex items-center border-b border-bureau-rule">
              <span className="w-[45%] border-r border-bureau-rule px-3.5 py-2.5 font-mono text-[9.5px] uppercase tracking-wider text-bureau-muted">
                {locale === 'tr' ? 'Kayıt No' : 'Registry No'}
              </span>
              <span className="px-3.5 py-2.5 font-mono text-[11px] font-semibold tracking-wider text-bureau-black">
                {orderNumber ?? '—'}
              </span>
            </div>
            <div className="flex items-center border-b border-bureau-rule">
              <span className="w-[45%] border-r border-bureau-rule px-3.5 py-2.5 font-mono text-[9.5px] uppercase tracking-wider text-bureau-muted">
                {locale === 'tr' ? 'Kayıt Tarihi' : 'Registration Date'}
              </span>
              <span className="px-3.5 py-2.5 font-mono text-[10px] text-bureau-black">
                {timestamp || '—'}
              </span>
            </div>
            <div className="flex items-center border-b border-bureau-rule">
              <span className="w-[45%] border-r border-bureau-rule px-3.5 py-2.5 font-mono text-[9.5px] uppercase tracking-wider text-bureau-muted">
                {locale === 'tr' ? 'Sınıflandırma' : 'Classification'}
              </span>
              <span className="px-3.5 py-2.5 font-mono text-[10px] uppercase text-bureau-black">
                SPATIAL PHOTON OBJECT
              </span>
            </div>
            <div className="flex items-center">
              <span className="w-[45%] border-r border-bureau-rule px-3.5 py-2.5 font-mono text-[9.5px] uppercase tracking-wider text-bureau-muted">
                {locale === 'tr' ? 'Durum' : 'Status'}
              </span>
              <span className="px-3.5 py-2.5 font-mono text-[10px] uppercase text-bureau-amber">
                PROCESSING
              </span>
            </div>
          </div>

          {/* Info paragraph */}
          <p className="mb-2 text-[12px] leading-relaxed text-bureau-muted">
            {locale === 'tr'
              ? 'Sipariş onay belgesi kayıtlı e-posta adresinize iletilmiştir. Bu kayıt numarasını referans alarak sipariş durumunuzu takip edebilirsiniz.'
              : 'Your order confirmation document has been dispatched to your registered email address. You may use this registry number to track the status of your order.'}
          </p>
          <p className="mb-6 text-[11px] leading-relaxed text-bureau-subtle">
            {locale === 'tr'
              ? 'Nesneniz işleme alındıktan sonra tahmini teslimat süresi 5–10 iş günüdür.'
              : 'Estimated dispatch window: 5–10 business days from processing confirmation.'}
          </p>

          <div className="border-t border-dashed border-bureau-rule pt-5">
            <div className="flex gap-3">
              <Link href="/registry" className="btn-bureau inline-block flex-1 text-center">
                {locale === 'tr' ? 'Kayda Dön' : 'Return to Registry'}
              </Link>
              <Link href="/" className="btn-bureau-outline inline-block flex-1 text-center">
                {locale === 'tr' ? 'Ana Sayfa' : 'Home'}
              </Link>
            </div>
          </div>
        </div>

        {/* Footer band */}
        <div className="border-t border-bureau-rule bg-bureau-surface px-5 py-2.5">
          <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-bureau-subtle">
            The Ambience Bureau // Regulation of Spatial Photons // Est. 2026
          </span>
        </div>
      </div>
    </div>
  )
}