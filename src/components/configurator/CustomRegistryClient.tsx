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

const ConfiguratorCanvas = dynamic(
  () => import('./ConfiguratorCanvas').then((m) => m.ConfiguratorCanvas),
  { ssr: false }
)

type MobileTab = 'viewer' | 'controls'

export function CustomRegistryClient({ collections }: { collections: Collection[] }) {
  const locale = useLocale()
  const router = useRouter()
  const [isLoadingParts, setIsLoadingParts] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [mobileTab, setMobileTab] = useState<MobileTab>('viewer')

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
      setCollection(key, parts)
      // Koleksiyon seçilince mobilde viewer'a geç
      setMobileTab('viewer')
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

  const viewerLabel = locale === 'tr' ? '3D Görünüm' : '3D View'
  const controlsLabel = locale === 'tr' ? 'Parçalar' : 'Parts'

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">

      {/* ── DESKTOP: yan yana layout ── */}
      {/* 3D Viewport — desktop'ta görünür, mobilde hidden */}
      <div className="hidden min-h-0 flex-1 border-r border-bureau-black lg:flex">
        <ConfiguratorCanvas />
      </div>

      {/* Control Panel — desktop */}
      <div className="hidden w-[400px] flex-shrink-0 flex-col overflow-y-auto p-4 lg:flex">
        <DesktopPanelContent
          locale={locale}
          collectionKey={collectionKey}
          collections={collections}
          isLoadingParts={isLoadingParts}
          isSaving={isSaving}
          saveError={saveError}
          saveSuccess={saveSuccess}
          onSelectCollection={handleSelectCollection}
          onClearCollection={clearCollection}
          onRegister={handleRegisterDesign}
          onGoCart={() => router.push('/cart')}
        />
      </div>

      {/* ── MOBİL: tab sistemi ── */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:hidden">
        {/* Tab bar — sadece koleksiyon seçildiyse göster */}
        {collectionKey && (
          <div className="flex flex-shrink-0 border-b border-bureau-black">
            <button
              onClick={() => setMobileTab('viewer')}
              className={`flex-1 py-2.5 font-mono text-[10px] uppercase tracking-widest transition-colors ${
                mobileTab === 'viewer'
                  ? 'bg-bureau-black text-white'
                  : 'text-bureau-muted hover:text-bureau-black'
              }`}
            >
              {viewerLabel}
            </button>
            <button
              onClick={() => setMobileTab('controls')}
              className={`flex-1 border-l border-bureau-black py-2.5 font-mono text-[10px] uppercase tracking-widest transition-colors ${
                mobileTab === 'controls'
                  ? 'bg-bureau-black text-white'
                  : 'text-bureau-muted hover:text-bureau-black'
              }`}
            >
              {controlsLabel}
            </button>
          </div>
        )}

        {/* Koleksiyon seçilmemişse direkt picker göster */}
        {!collectionKey ? (
          <div className="overflow-y-auto p-4">
            <h2 className="mb-3 font-mono text-[11px] uppercase tracking-wide text-bureau-muted">
              {locale === 'tr' ? 'Bir Koleksiyon Seçin' : 'Select a Collection'}
            </h2>
            <CollectionPicker
              collections={collections}
              activeKey={collectionKey}
              onSelect={handleSelectCollection}
            />
          </div>
        ) : (
          <>
            {/* 3D Viewer tab */}
            <div
              className={`min-h-0 flex-1 overflow-hidden ${
                mobileTab === 'viewer' ? 'flex' : 'hidden'
              }`}
            >
              <ConfiguratorCanvas />
            </div>

            {/* Controls tab */}
            <div
              className={`min-h-0 flex-1 overflow-y-auto p-4 ${
                mobileTab === 'controls' ? 'block' : 'hidden'
              }`}
            >
              {isLoadingParts ? (
                <div className="flex h-40 items-center justify-center">
                  <span className="font-mono text-[11px] uppercase text-bureau-muted">
                    {locale === 'tr' ? 'Yükleniyor...' : 'Loading...'}
                  </span>
                </div>
              ) : (
                <div className="space-y-5">
                  <button
                    onClick={() => { clearCollection(); setMobileTab('viewer') }}
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
          </>
        )}
      </div>
    </div>
  )
}

// Desktop panel içeriğini ayrı component'e çıkardık — tekrar kullanım için
function DesktopPanelContent({
  locale,
  collectionKey,
  collections,
  isLoadingParts,
  isSaving,
  saveError,
  saveSuccess,
  onSelectCollection,
  onClearCollection,
  onRegister,
  onGoCart,
}: {
  locale: string
  collectionKey: string | null
  collections: Collection[]
  isLoadingParts: boolean
  isSaving: boolean
  saveError: string | null
  saveSuccess: string | null
  onSelectCollection: (key: string) => void
  onClearCollection: () => void
  onRegister: () => void
  onGoCart: () => void
}) {
  if (!collectionKey) {
    return (
      <div>
        <h2 className="mb-3 font-mono text-[11px] uppercase tracking-wide text-bureau-muted">
          {locale === 'tr' ? 'Bir Koleksiyon Seçin' : 'Select a Collection'}
        </h2>
        <CollectionPicker
          collections={collections}
          activeKey={collectionKey}
          onSelect={onSelectCollection}
        />
      </div>
    )
  }

  if (isLoadingParts) {
    return (
      <div className="flex h-40 items-center justify-center">
        <span className="font-mono text-[11px] uppercase text-bureau-muted">
          {locale === 'tr' ? 'Yükleniyor...' : 'Loading...'}
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <button
        onClick={onClearCollection}
        className="font-mono text-[10.5px] uppercase tracking-wide text-bureau-muted hover:text-bureau-amber"
      >
        ← {locale === 'tr' ? 'Koleksiyonu Değiştir' : 'Change Collection'}
      </button>

      <ControlPanel />
      <ConfigSummary onRegister={onRegister} />

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
          <button onClick={onGoCart} className="btn-bureau-outline mt-3 w-full">
            {locale === 'tr' ? 'Sepete Git' : 'Go to Cart'}
          </button>
        </div>
      )}
    </div>
  )
}