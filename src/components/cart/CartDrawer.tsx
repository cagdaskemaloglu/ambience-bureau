'use client'

import { useEffect, useRef } from 'react'
import { useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { formatPrice } from '@/lib/sanity'
import { useCartStore } from '@/lib/store/cart'
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

      {/* Drawer panel — sağdan kayar */}
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
            <div className="mb-4 flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-wide text-bureau-muted">
                {locale === 'tr' ? 'Toplam' : 'Total'}
              </span>
              <span className="font-mono text-[20px] font-semibold">
                {formatPrice(total, currency, intlLocale)}
              </span>
            </div>
            <p className="mb-3 text-[10.5px] text-bureau-subtle">
              {locale === 'tr'
                ? 'Kargo ve KDV ödeme adımında hesaplanır.'
                : 'Shipping and VAT calculated at checkout.'}
            </p>
            <div className="space-y-2">
              <Link
                href="/checkout"
                onClick={closeDrawer}
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