'use client'

import { useEffect, useRef, useState } from 'react'
import { useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { formatPrice } from '@/lib/sanity'
import { useCartStore } from '@/lib/store/cart'
import { getCurrentUser, getProfile } from '@/lib/supabase/auth'
import { CartItemRow } from './CartItemRow'

export function CartDrawer() {
  const locale = useLocale() as 'tr' | 'en'
  const isOpen = useCartStore((s) => s.isDrawerOpen)
  const closeDrawer = useCartStore((s) => s.closeDrawer)
  const items = useCartStore((s) => s.items)
  const getTotal = useCartStore((s) => s.getTotal)

  const total = getTotal(locale)
  const currency = locale === 'tr' ? 'TRY' : 'USD'
  const intlLocale = locale === 'tr' ? 'tr-TR' : 'en-US'
  const panelRef = useRef<HTMLDivElement>(null)

  // Credits state
  const [availableCredits, setAvailableCredits] = useState(0)
  const [useCredits, setUseCredits] = useState(false)
  const [creditsLoaded, setCreditsLoaded] = useState(false)

  const maxUsable = Math.min(availableCredits, total)
  const creditsToUse = useCredits ? maxUsable : 0
  const finalTotal = Math.max(0, total - creditsToUse)
  // Kazanılacak BC: ödenecek tutar üzerinden %10
  const issuedCredits = Math.floor(finalTotal * 0.1 * 100) / 100

  // Drawer açılınca credits yükle
  useEffect(() => {
    if (!isOpen || creditsLoaded) return
    getCurrentUser().then(async (user) => {
      if (!user) return
      const profile = await getProfile(user.id)
      if (profile) {
        const credits = locale === 'tr'
          ? Number((profile as any).bureau_credits_try ?? 0)
          : Number((profile as any).bureau_credits_usd ?? 0)
        setAvailableCredits(credits)

        // Daha önce CartSummary'de toggle açıldıysa sessionStorage'dan oku
        const stored = sessionStorage.getItem('useCredits')
        if (stored && parseFloat(stored) > 0) {
          setUseCredits(true)
        }
      }
      setCreditsLoaded(true)
    })
  }, [isOpen, creditsLoaded, locale])

  // Toggle değiştiğinde sessionStorage güncelle
  function handleToggleCredits() {
    const newVal = !useCredits
    setUseCredits(newVal)
    if (newVal && maxUsable > 0) {
      sessionStorage.setItem('useCredits', maxUsable.toFixed(2))
    } else {
      sessionStorage.removeItem('useCredits')
    }
  }

  // Checkout'a giderken sessionStorage'ın güncel olduğundan emin ol
  function handleGoToCheckout() {
    if (useCredits && creditsToUse > 0) {
      sessionStorage.setItem('useCredits', creditsToUse.toFixed(2))
    } else {
      sessionStorage.removeItem('useCredits')
    }
    closeDrawer()
  }

  // ESC ile kapat
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeDrawer()
    }
    if (isOpen) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, closeDrawer])

  // Açıkken body scroll'u kilitle
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
        onClick={closeDrawer}
      />

      {/* Drawer panel */}
      <div
        ref={panelRef}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[420px] flex-col bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-bureau-black px-5 py-4">
          <div>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-bureau-muted">
              FORM 220-C
            </span>
            <h2 className="font-mono text-[12px] uppercase tracking-wider text-bureau-black">
              {locale === 'tr' ? 'Sepet' : 'Cart'} ({items.reduce((s, i) => s + i.quantity, 0)})
            </h2>
          </div>
          <button
            onClick={closeDrawer}
            aria-label={locale === 'tr' ? 'Kapat' : 'Close'}
            className="flex h-8 w-8 items-center justify-center border border-bureau-rule hover:border-bureau-black transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" strokeWidth="1.5"/>
              <line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5">
          {items.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="font-mono text-[11px] uppercase tracking-widest text-bureau-subtle">
                {locale === 'tr' ? 'Sepet boş' : 'Cart is empty'}
              </p>
            </div>
          ) : (
            <div>
              {items.map((item) => (
                <CartItemRow key={item.id} item={item} compact />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="flex-shrink-0 border-t border-bureau-black px-5 py-4">

            {/* Bureau Credits toggle */}
            {availableCredits > 0 && (
              <div className="mb-3 border border-bureau-rule p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="block font-mono text-[9.5px] uppercase tracking-wider text-bureau-muted">
                      {locale === 'tr' ? 'Büro Kredisi' : 'Bureau Credits'}
                    </span>
                    <span className="font-mono text-[11px] text-bureau-black">
                      {availableCredits.toFixed(2)} BC {locale === 'tr' ? 'mevcut' : 'available'}
                    </span>
                  </div>
                  <button
                    onClick={handleToggleCredits}
                    className={`relative h-6 w-11 flex-shrink-0 border transition-colors ${
                      useCredits ? 'border-bureau-amber bg-bureau-amber' : 'border-bureau-rule bg-white'
                    }`}
                    aria-pressed={useCredits}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 border transition-transform ${
                      useCredits
                        ? 'translate-x-5 border-white bg-white'
                        : 'translate-x-0 border-bureau-rule bg-bureau-subtle'
                    }`} />
                  </button>
                </div>
                {useCredits && creditsToUse > 0 && (
                  <div className="mt-2 flex justify-between font-mono text-[10px]">
                    <span className="text-bureau-amber">
                      {locale === 'tr' ? 'Kullanılacak' : 'Applied'}
                    </span>
                    <span className="font-semibold text-bureau-amber">
                      -{creditsToUse.toFixed(2)} BC
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Kazanılacak BC */}
            {issuedCredits > 0 && (
              <div className="mb-3 flex items-center justify-between bg-bureau-amber/5 px-3 py-2">
                <span className="font-mono text-[9.5px] uppercase tracking-wider text-bureau-amber">
                  {locale === 'tr' ? 'Bu İşlemden Kazanılacak' : 'Issued Credits'}
                </span>
                <span className="font-mono text-[11px] font-semibold text-bureau-amber">
                  +{issuedCredits.toFixed(2)} BC
                </span>
              </div>
            )}

            {/* Toplam */}
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-wide text-bureau-muted">
                {locale === 'tr' ? 'Toplam' : 'Total'}
              </span>
              <span className="font-mono text-[20px] font-semibold">
                {formatPrice(finalTotal, currency, intlLocale)}
              </span>
            </div>
            {useCredits && creditsToUse > 0 && (
              <div className="mb-2 flex justify-between font-mono text-[10px] text-bureau-subtle">
                <span>{locale === 'tr' ? 'Kredi öncesi' : 'Before credits'}</span>
                <span className="line-through">{formatPrice(total, currency, intlLocale)}</span>
              </div>
            )}

            <p className="mb-3 text-[10.5px] text-bureau-subtle">
              {locale === 'tr'
                ? 'Kargo ve KDV ödeme adımında hesaplanır.'
                : 'Shipping and VAT calculated at checkout.'}
            </p>

            <div className="space-y-2">
              <Link
                href="/checkout"
                onClick={handleGoToCheckout}
                className="btn-bureau block w-full text-center"
              >
                {locale === 'tr' ? 'Ödemeye Geç' : 'Proceed to Checkout'}
              </Link>
              <Link
                href="/cart"
                onClick={closeDrawer}
                className="block w-full text-center font-mono text-[10.5px] uppercase tracking-wide text-bureau-muted hover:text-bureau-amber transition-colors"
              >
                {locale === 'tr' ? 'Sepeti Görüntüle' : 'View Cart'}
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  )
}