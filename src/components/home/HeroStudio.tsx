'use client'

import { CustomRegistryClient } from '@/components/configurator/CustomRegistryClient'
import type { RevealPhase } from '@/components/configurator/WireReveal'
import type { Collection, ProductConfiguratorPart } from '@/types'

/**
 * Anasayfanın ilk ekranına GÖMÜLÜ konfigüratör (Özel Tahsis). Bu dosya
 * anasayfada `next/dynamic` ile YALNIZCA koleksiyon seçilince (ya da seçim
 * niyeti görülünce önceden) yüklenir — ilk açılış paketine girmez.
 * Mantık /custom-registry sayfasıyla aynı bileşen (CustomRegistryClient).
 */
export default function HeroStudio({
  collections,
  collectionKey,
  modelId,
  onClose,
  onReady,
  layout,
  presetDesign = null,
  reveal,
}: {
  onReady?: () => void
  layout: 'desktop' | 'mobile'
  presetDesign?: { collectionKey: string; parts: ProductConfiguratorPart[] } | null
  reveal?: RevealPhase
  collections: Collection[]
  collectionKey: string
  modelId?: string
  onClose: () => void
}) {
  return (
    <CustomRegistryClient
      collections={collections}
      initialCollectionKey={collectionKey}
      initialModelId={modelId}
      presetDesign={presetDesign}
      presetStatus={presetDesign ? 'ok' : 'not-requested'}
      showTutorial={false}
      embedded
      embeddedLayout={layout}
      onClose={onClose}
      onReady={onReady}
      reveal={reveal}
    />
  )
}
