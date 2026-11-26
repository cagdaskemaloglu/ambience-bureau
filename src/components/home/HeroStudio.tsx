'use client'

import { CustomRegistryClient } from '@/components/configurator/CustomRegistryClient'
import type { Collection } from '@/types'

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
}: {
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
      presetDesign={null}
      presetStatus="not-requested"
      showTutorial={false}
      embedded
      onClose={onClose}
    />
  )
}
