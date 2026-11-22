'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { useCartStore } from '@/lib/store/cart'
import { getOrCreateGuestSessionId } from '@/lib/supabase/auth'
import { getLocalizedValue } from '@/lib/sanity'
import type { ProductCard as ProductCardType } from '@/types'

// Konfigüratördeki varsayılan ışık ayarı (lib/store/configurator.ts ile aynı).
const DEFAULT_LIGHT_COLOR = '#F5D78E'
const DEFAULT_LIGHT_BRIGHTNESS = 0.7

/**
 * Montajlı Model kartlarında "Nesne Talep Et": modeli VARSAYILAN renkleriyle
 * (her parçanın ilk rengi, IoT'siz) konfigüratördeki "Tasarımı Kaydet" ile
 * AYNI yoldan kaydeder (/api/custom-design) ve sepete ekler — sipariş,
 * üretim ve ürün kaydı akışı özel tasarımla birebir aynı kalır.
 */
export function ModelRequestMini({ product, className }: { product: ProductCardType; className?: string }) {
  const t = useTranslations('product')
  const locale = useLocale()
  const tr = locale === 'tr'
  const router = useRouter()
  const addItem = useCartStore((s) => s.addItem)
  const openDrawer = useCartStore((s) => s.openDrawer)
  const [state, setState] = useState<'idle' | 'saving' | 'added' | 'error'>('idle')

  const design = product.modelDefault
  const link = product.modelLink
  if (!design || !link) return null

  async function handleClick(e: React.MouseEvent) {
    // Kart tamamen bir <Link> — tıklama konfigüratöre yönlendirmemeli.
    e.preventDefault()
    e.stopPropagation()
    if (!design || !link || state === 'saving') return
    setState('saving')
    try {
      const currency: 'TRY' | 'USD' = tr ? 'TRY' : 'USD'
      const parts = design.parts.map((p) => ({
        slotType: 'body' as const,
        partId: p.partId,
        materialId: p.materialId,
        price: tr ? p.priceTRY : p.priceUSD,
      }))
      const res = await fetch('/api/custom-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectionKey: link.collectionKey,
          designData: { currency, parts, lightColor: DEFAULT_LIGHT_COLOR, lightBrightness: DEFAULT_LIGHT_BRIGHTNESS },
          totalPrice: tr ? product.priceTRY : product.priceUSD,
          guestSessionId: getOrCreateGuestSessionId(),
          snapshotUrl: design.imageUrl ?? undefined,
        }),
      })
      if (!res.ok) throw new Error('save failed')
      const { design: saved } = await res.json()

      addItem({
        id: `custom-${saved.id}`,
        type: 'custom',
        registryNo: saved.design_ref,
        name: {
          tr: getLocalizedValue(product.name, 'tr', '—') ?? '—',
          en: getLocalizedValue(product.name, 'en', '—') ?? '—',
        },
        priceTRY: product.priceTRY,
        priceUSD: product.priceUSD,
        quantity: 1,
        customDesign: {
          collectionKey: link.collectionKey,
          parts: design.parts.map((p) => ({ slotType: 'body' as const, ...p })),
        },
      })

      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        router.push('/cart')
      } else {
        openDrawer()
        setState('added')
        setTimeout(() => setState('idle'), 2000)
      }
    } catch (err) {
      console.error('[ModelRequestMini] Sepete eklenemedi:', err)
      setState('error')
      setTimeout(() => setState('idle'), 2500)
    }
  }

  const label =
    state === 'saving'
      ? tr ? 'Ekleniyor…' : 'Adding…'
      : state === 'added'
        ? '✓ ' + (tr ? 'Eklendi' : 'Added')
        : state === 'error'
          ? tr ? 'Hata — tekrar deneyin' : 'Error — try again'
          : t('addToCart')

  return (
    <button
      onClick={handleClick}
      disabled={state === 'saving'}
      className={`w-full border border-bureau-black font-mono text-[9px] font-semibold uppercase tracking-wide text-bureau-black transition-colors hover:bg-bureau-black hover:text-bureau-white disabled:opacity-60 focus-bureau ${className ?? 'mt-1.5 py-1.5'}`}
    >
      {label}
    </button>
  )
}
