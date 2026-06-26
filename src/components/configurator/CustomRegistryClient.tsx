'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { useConfiguratorStore } from '@/lib/store/configurator'
import { useCartStore } from '@/lib/store/cart'
import { getOrCreateGuestSessionId } from '@/lib/supabase/auth'
import { getLampPartsByCollection } from '@/lib/queries'
import { CollectionPicker } from './CollectionPicker'
import { ControlPanel } from './ControlPanel'
import { ConfigSummary } from './ConfigSummary'
import type { Collection, LampPart } from '@/types'
import { preloadModelUrls } from '@/lib/hooks/useModelGeometry'


const ConfiguratorCanvas = dynamic(
  () => import('./ConfiguratorCanvas').then((m) => m.ConfiguratorCanvas),
  { ssr: false }
)

export function CustomRegistryClient({ collections }: { collections: Collection[] }) {
  const locale = useLocale()
  const router = useRouter()
  const [isLoadingParts, setIsLoadingParts] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)

  const collectionKey = useConfiguratorStore((s) => s.collectionKey)
  const setCollection = useConfiguratorStore((s) => s.setCollection)
  const clearCollection = useConfiguratorStore((s) => s.clearCollection)
  const base = useConfiguratorStore((s) => s.base)
  const body = useConfiguratorStore((s) => s.body)
  const head = useConfiguratorStore((s) => s.head)
  const lightColor = useConfiguratorStore((s) => s.lightColor)
  const lightBrightness = useConfiguratorStore((s) => s.lightBrightness)
  const getTotalPrice = useConfiguratorStore((s) => s.getTotalPrice)
  const getSelectedPart = useConfiguratorStore((s) => s.getSelectedPart)
  const getSelectedMaterial = useConfiguratorStore((s) => s.getSelectedMaterial)

  const addCartItem = useCartStore((s) => s.addItem)

    async function handleSelectCollection(key: string) {
    setIsLoadingParts(true)
    try {
      const parts: LampPart[] = await getLampPartsByCollection(key)
      // Tüm model URL'lerini hemen cache'e al — parçaya tıklanınca hazır olsun
      const urls = parts.map((p) => p.modelUrl).filter(Boolean)
      preloadModelUrls(urls)
      setCollection(key, parts)
    } catch (err) {
      console.error('Parçalar yüklenemedi:', err)
    } finally {
      setIsLoadingParts(false)
    }
  }

  async function handleRegisterDesign() {
    if (!collectionKey) return
    setIsSaving(true)
    setSaveError(null)

    try {
      const designCurrency: 'TRY' | 'USD' = locale === 'tr' ? 'TRY' : 'USD'

      const parts: Array<{
        slotType: 'base' | 'body' | 'head'
        partId: string
        materialId: string
        price: number
      }> = []

      const cartParts: Array<{
        slotType: 'base' | 'body' | 'head'
        partId: string
        materialId: string
        priceTRY: number
        priceUSD: number
      }> = []

      function pushSlot(slotType: 'base' | 'body' | 'head', bodyIndex?: number) {
        const part = getSelectedPart(slotType, bodyIndex)
        const material = getSelectedMaterial(slotType, bodyIndex)
        if (!part || !material) return

        const priceTRY = part.basePriceTRY + material.priceModifierTRY
        const priceUSD = part.basePriceUSD + material.priceModifierUSD

        parts.push({
          slotType,
          partId: part.partId,
          materialId: material.materialId,
          price: locale === 'tr' ? priceTRY : priceUSD,
        })

        cartParts.push({
          slotType,
          partId: part.partId,
          materialId: material.materialId,
          priceTRY,
          priceUSD,
        })
      }

      pushSlot('base')
      body.forEach((_, idx) => pushSlot('body', idx))
      pushSlot('head')

      const guestSessionId = getOrCreateGuestSessionId()
      const totalPrice = getTotalPrice(locale as 'tr' | 'en')
      const totalPriceTRY = getTotalPrice('tr')
      const totalPriceUSD = getTotalPrice('en')

      const res = await fetch('/api/custom-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectionKey,
          designData: { currency: designCurrency, parts, lightColor, lightBrightness },
          totalPrice,
          guestSessionId,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Bilinmeyen hata')
      }

      const { design } = await res.json()

      addCartItem({
        id: `custom-${design.id}`,
        type: 'custom',
        registryNo: design.design_ref,
        name: { tr: 'Özel Tasarım', en: 'Custom Design' },
        priceTRY: totalPriceTRY,
        priceUSD: totalPriceUSD,
        quantity: 1,
        customDesign: {
          collectionKey,
          parts: cartParts,
        },
      })

      setSaveSuccess(design.design_ref)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Tasarım kaydedilemedi.')
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    if (!saveSuccess) return
    const timeout = setTimeout(() => setSaveSuccess(null), 5000)
    return () => clearTimeout(timeout)
  }, [saveSuccess])

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden lg:flex-row">
      {/* 3D Viewport */}
      <div className="min-h-0 flex-1 border-b border-bureau-black lg:border-b-0 lg:border-r">
        <ConfiguratorCanvas />
      </div>

      {/* Control Panel — sadece bu scroll edilebilir */}
      <div className="flex w-full flex-col overflow-y-auto p-4 lg:w-[400px] lg:flex-shrink-0">
        {!collectionKey ? (
          <div>
            <h2 className="mb-3 font-mono text-[11px] uppercase tracking-wide text-bureau-muted">
              {locale === 'tr' ? 'Bir Koleksiyon Seçin' : 'Select a Collection'}
            </h2>
            <CollectionPicker
              collections={collections}
              activeKey={collectionKey}
              onSelect={handleSelectCollection}
            />
          </div>
        ) : isLoadingParts ? (
          <div className="flex h-40 items-center justify-center">
            <span className="font-mono text-[11px] uppercase text-bureau-subtle">
              {locale === 'tr' ? 'Yükleniyor...' : 'Loading...'}
            </span>
          </div>
        ) : (
          <div className="space-y-5">
            <button
              onClick={clearCollection}
              className="font-mono text-[10.5px] uppercase tracking-wide text-bureau-muted hover:text-bureau-amber"
            >
              ← {locale === 'tr' ? 'Koleksiyonu Değiştir' : 'Change Collection'}
            </button>

            <ControlPanel />

            <ConfigSummary onRegister={handleRegisterDesign} />

            {isSaving && (
              <p className="text-center font-mono text-[11px] uppercase text-bureau-muted">
                {locale === 'tr' ? 'Kaydediliyor...' : 'Saving...'}
              </p>
            )}

            {saveError && (
              <p className="text-center text-[12px] text-red-600">{saveError}</p>
            )}

            {saveSuccess && (
              <div className="border border-bureau-amber bg-bureau-amber/5 p-3 text-center">
                <p className="font-mono text-[11px] uppercase tracking-wide text-bureau-amber">
                  {locale === 'tr' ? 'Kayıt Onaylandı' : 'Registration Confirmed'}
                </p>
                <p className="mt-1 text-[12px]">{saveSuccess}</p>
                <button
                  onClick={() => router.push('/cart')}
                  className="btn-bureau-outline mt-3 w-full"
                >
                  {locale === 'tr' ? 'Sepete Git' : 'Go to Cart'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}