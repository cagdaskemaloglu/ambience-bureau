'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { useConfiguratorStore } from '@/lib/store/configurator'
import { useCartStore } from '@/lib/store/cart'
import { getOrCreateGuestSessionId } from '@/lib/supabase/auth'
import { getLampModelsByCollection, getLampPartsByCollection } from '@/lib/queries'
import { CollectionPicker } from './CollectionPicker'
import { ControlPanel } from './ControlPanel'
import { MobileControlPanel } from './MobileControlPanel'
import { ConfigSummary } from './ConfigSummary'
import { CustomRegistryTutorial } from './CustomRegistryTutorial'
import { CombinationCountBadge } from './CombinationCountBadge'
import { CameraFitButton } from './CameraFitButton'
import { IotToggle } from './IotToggle'
import type { RevealPhase } from './WireReveal'
import { StudioLoadBar } from './StudioLoadBar'
import { getLocalizedValue } from '@/lib/sanity'
import type { Collection, LampModelDef, LampPart, ProductConfiguratorPart } from '@/types'

const ConfiguratorCanvas = dynamic(
  () => import('./ConfiguratorCanvas').then((m) => m.ConfiguratorCanvas),
  { ssr: false }
)

export function CustomRegistryClient({
  collections,
  initialCollectionKey,
  initialModelId,
  presetDesign,
  presetStatus,
  showTutorial = false,
  captureMode = false,
  embedded = false,
  embeddedLayout = 'desktop',
  onClose,
  onReady,
  reveal,
}: {
  /** embedded: tel kafesten materyale açılış evresi (bkz. WireReveal). */
  reveal?: RevealPhase
  /**
   * embedded: hangi yerleşim çizilsin. Gömülüyken diğeri HİÇ çizilmez — gizli
   * ikinci bir WebGL tuvali açılmasın, ekran görüntüsü yanlış tuvalden alınmasın.
   */
  embeddedLayout?: 'desktop' | 'mobile'
  /**
   * embedded: koleksiyon yüklenip model tuvalde ilk kez ölçülünce (çizilince)
   * bir kez çağrılır — anasayfadaki yükleme çubuğu bununla tamamlanır.
   */
  onReady?: () => void
  /**
   * Anasayfanın ilk ekranına gömülü açılış (HeroStudio). Mantık aynı; yalnızca
   * yerleşim: panel yarı saydam, "Koleksiyonu değiştir" yerine vitrine dönüş.
   */
  embedded?: boolean
  /** embedded: konfigüratörü kapatıp vitrine döner. */
  onClose?: () => void
  collections: Collection[]
  initialCollectionKey?: string
  /** Montajlı model koleksiyonunda açılışta seçilecek model (Daimi Envanter kartından gelir). */
  initialModelId?: string
  /** "Customize" butonundan gelen ürünün tam koleksiyon + parça/malzeme kombinasyonu. */
  presetDesign?: { collectionKey: string; parts: ProductConfiguratorPart[] } | null
  /** presetDesign neden null — kullanıcıya/admin'e sessizce boş ekran yerine sebep gösterilir. */
  presetStatus?: 'ok' | 'not-requested' | 'not-found' | 'not-configurable' | 'incomplete'
  /** Misafirlere ve Custom Registry'den daha önce sipariş vermemiş üyelere gösterilir. */
  showTutorial?: boolean
  /**
   * Sadece scripts/generate-spin-frames.ts tarafından kullanılır (?capture=1).
   * true olduğunda yan panel/tutorial/fiyat çubuğu YOK — sadece 3D canvas'ı
   * tam ekran render eder, böylece Puppeteer'ın ayarladığı viewport boyutu
   * birebir kare çözünürlüğü olur.
   */
  captureMode?: boolean
}) {
  const locale = useLocale()
  const router = useRouter()
  const [isLoadingParts, setIsLoadingParts] = useState(false)
  // Bu açılışta koleksiyon verisi hazır mı (yükleme bitti ya da gerekmedi).
  const [dataReady, setDataReady] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const screenshotFnRef = useRef<(() => string) | null>(null)

  const handleScreenshotReady = useCallback((fn: () => string) => {
    screenshotFnRef.current = fn
  }, [])

  const collectionKey = useConfiguratorStore((s) => s.collectionKey)
  const setCollection = useConfiguratorStore((s) => s.setCollection)
  const loadPreset = useConfiguratorStore((s) => s.loadPreset)
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
  const openDrawer = useCartStore((s) => s.openDrawer)

  // presetStatus 'ok' değilse (ve preset gerçekten istenmişse) bunun NEDENİNİ
  // kullanıcıya/admin'e göster — sessizce boş koleksiyon seçim ekranına
  // düşmek, "Customize" butonunun neden çalışmadığını anlaşılmaz kılıyordu.
  const presetNotice =
    presetStatus === 'not-found'
      ? locale === 'tr'
        ? 'Bu ürün bulunamadı.'
        : 'This product could not be found.'
      : presetStatus === 'not-configurable'
        ? locale === 'tr'
          ? 'Bu ürün özelleştirmeye açık değil (Sanity: isConfigurable kapalı).'
          : 'This product is not configurable (Sanity: isConfigurable is off).'
        : presetStatus === 'incomplete'
          ? locale === 'tr'
            ? 'Bu ürün için Customize verisi eksik. Sanity\'de ürünün "Configurator Collection" ve "Configurator Preset Parça/Malzeme Kombinasyonu" alanlarını doldurup kaydedin.'
            : 'Customize data is missing for this product. Fill in and save the product\'s "Configurator Collection" and "Configurator Preset Parts" fields in Sanity.'
          : null

  // "Customize" butonundan gelen tam ürün preset'i varsa öncelikli olarak
  // onu yükle (Custom Registry'de düz koleksiyon seçiminden önce gelir).
  // Yoksa URL'den gelen düz koleksiyon key'i varsa otomatik seç.
  useEffect(() => {
    if (presetDesign) {
      handleLoadPresetDesign(presetDesign)
    } else if (initialCollectionKey && initialCollectionKey !== collectionKey) {
      handleSelectCollection(initialCollectionKey, initialModelId)
    } else if (initialModelId && initialCollectionKey === collectionKey) {
      useConfiguratorStore.getState().selectModel(initialModelId)
      setDataReady(true)
    } else {
      setDataReady(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetDesign, initialCollectionKey, initialModelId])

  /**
   * Koleksiyonun parçaları ve (Montajlı model yerleşiminde) modelleri.
   * demoParts/demoModels: sadece local demo koleksiyonlarında dolu (lib/bulletinDemo.ts).
   */
  async function fetchCollectionData(key: string) {
    const selected = collections.find((c) => c.key?.current === key) as
      | (Collection & { demoParts?: LampPart[]; demoModels?: LampModelDef[] })
      | undefined
    if (selected?.layoutMode === 'model') {
      const models = selected.demoModels ?? (await getLampModelsByCollection(key))
      return { selected, parts: [] as LampPart[], models }
    }
    const parts: LampPart[] = selected?.demoParts ?? (await getLampPartsByCollection(key))
    return { selected, parts, models: null }
  }

  async function handleSelectCollection(key: string, modelId?: string) {
    setIsLoadingParts(true)
    try {
      const { selected: selectedCollection, parts, models } = await fetchCollectionData(key)
      setCollection(key, parts, {
        baseTRY: selectedCollection?.hardwareBaseFeeTRY,
        baseUSD: selectedCollection?.hardwareBaseFeeUSD,
        iotTRY: selectedCollection?.iotFeeTRY,
        iotUSD: selectedCollection?.iotFeeUSD,
      }, {
        min: selectedCollection?.minBodyLayers,
        max: selectedCollection?.maxBodyLayers,
      }, {
        mode: selectedCollection?.layoutMode,
        hangFromCeiling: selectedCollection?.hangFromCeiling,
        models,
      })
      // Anasayfaya gömülüyken model seçilmemişse ilk model açılır: tel kafes
      // sahnesinin yerinde hemen bir lamba durur, akış boş ekranla kesilmez.
      const startModel = modelId ?? (embedded && models?.length ? models[0].modelId : undefined)
      if (startModel) useConfiguratorStore.getState().selectModel(startModel)
    } catch (err) {
      console.error('Parçalar yüklenemedi:', err)
    } finally {
      setIsLoadingParts(false)
      setDataReady(true)
    }
  }

  async function handleLoadPresetDesign(design: { collectionKey: string; parts: ProductConfiguratorPart[] }) {
    setIsLoadingParts(true)
    try {
      const { selected: selectedCollection, parts, models } = await fetchCollectionData(design.collectionKey)
      loadPreset(
        design.collectionKey,
        parts,
        {
          baseTRY: selectedCollection?.hardwareBaseFeeTRY,
          baseUSD: selectedCollection?.hardwareBaseFeeUSD,
          iotTRY: selectedCollection?.iotFeeTRY,
          iotUSD: selectedCollection?.iotFeeUSD,
        },
        design.parts,
        { min: selectedCollection?.minBodyLayers, max: selectedCollection?.maxBodyLayers },
        { mode: selectedCollection?.layoutMode, hangFromCeiling: selectedCollection?.hangFromCeiling, models }
      )
    } catch (err) {
      console.error('Ürün kombinasyonu yüklenemedi:', err)
    } finally {
      setIsLoadingParts(false)
      setDataReady(true)
    }
  }

  async function handleRegisterDesign() {
    if (!collectionKey) return
    setIsSaving(true)
    setSaveError(null)

    try {
      // 1. Screenshot al
      let snapshotUrl: string | undefined
      if (screenshotFnRef.current) {
        try {
          const dataUrl = screenshotFnRef.current()
          const uploadRes = await fetch('/api/upload-snapshot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dataUrl, designRef: `snap-${Date.now()}` }),
          })
          if (uploadRes.ok) {
            const { url } = await uploadRes.json()
            snapshotUrl = url
          }
        } catch (snapErr) {
          console.warn('Screenshot alınamadı:', snapErr)
        }
      }

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
        parts.push({ slotType, partId: part.partId, materialId: material.materialId, price: locale === 'tr' ? priceTRY : priceUSD })
        cartParts.push({ slotType, partId: part.partId, materialId: material.materialId, priceTRY, priceUSD })
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
          snapshotUrl,
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
        customDesign: { collectionKey, parts: cartParts },
      })

      setSaveSuccess(design.design_ref)

      // Mobilde sepete yönlendir, desktop'ta drawer aç
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        router.push('/cart')
      } else {
        openDrawer()
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Tasarım kaydedilemedi.')
    } finally {
      setIsSaving(false)
    }
  }

  // Hazır sinyali: veri geldi + model tuvalde ölçüldü (stackTotalHeight > 0),
  // ardından iki kare (tuval boyansın). Parçasız/boş açılışta 2,5 sn sonra.
  const stackTotalHeight = useConfiguratorStore((s) => s.stackTotalHeight)
  const readyFired = useRef(false)
  const onReadyRef = useRef(onReady)
  onReadyRef.current = onReady
  useEffect(() => {
    if (!onReady || readyFired.current || !dataReady || isLoadingParts) return
    // Bayrak, çağrı GERÇEKTEN planlandığında konur; ölçü hemen yeniden
    // değişse bile (yedek yükseklik → gerçek yükseklik) planlanan kare iptal
    // edilmez — iptal edilirse sinyal hiç gelmiyordu.
    const fire = () => {
      if (readyFired.current) return
      readyFired.current = true
      requestAnimationFrame(() => requestAnimationFrame(() => onReadyRef.current?.()))
    }
    if (stackTotalHeight > 0) {
      fire()
      return
    }
    const t = setTimeout(fire, 2500)
    return () => clearTimeout(t)
  }, [onReady, dataReady, isLoadingParts, stackTotalHeight])

  // ── Gömülü stüdyoda MODEL DEĞİŞİMİ: açılıştakiyle aynı akış — yükleme
  // çubuğu (%60 → %100, en az 1 sn), yeni model önce tel kafes olarak
  // çizilir, sonra alttan üste materyalle açılır.
  const modelId = useConfiguratorStore((s) => s.modelId)
  const [swapStage, setSwapStage] = useState<'idle' | 'loading' | 'done'>('idle')
  const [swapHidden, setSwapHidden] = useState(false)
  const prevModel = useRef<string | null>(null)
  const swapAt = useRef(0)
  const swapTimers = useRef<number[]>([])
  useEffect(() => {
    const prev = prevModel.current
    prevModel.current = modelId
    if (!embedded || reveal !== 'reveal' || !prev || !modelId || prev === modelId) return
    swapTimers.current.forEach((t) => window.clearTimeout(t))
    swapTimers.current = []
    swapAt.current = performance.now()
    setSwapHidden(true)
    setSwapStage('loading')
  }, [modelId, embedded, reveal])
  useEffect(() => {
    if (swapStage !== 'loading' || stackTotalHeight <= 0) return
    const wait = Math.max(0, swapAt.current + 850 - performance.now())
    swapTimers.current.push(
      window.setTimeout(() => {
        setSwapStage('done')
        swapTimers.current.push(window.setTimeout(() => setSwapHidden(false), 150))
        swapTimers.current.push(window.setTimeout(() => setSwapStage('idle'), 400))
      }, wait)
    )
  }, [swapStage, stackTotalHeight])
  useEffect(() => () => swapTimers.current.forEach((t) => window.clearTimeout(t)), [])
  const effectiveReveal: RevealPhase | undefined = reveal && (reveal === 'hidden' || swapHidden ? 'hidden' : 'reveal')

  useEffect(() => {
    if (!saveSuccess) return
    const timeout = setTimeout(() => setSaveSuccess(null), 5000)
    return () => clearTimeout(timeout)
  }, [saveSuccess])

  // Gömülüyken "Koleksiyonu değiştir" konfigüratörü kapatır (seçim anasayfada).
  const changeCollection = () => {
    clearCollection()
    if (embedded) onClose?.()
  }
  const changeLabel = embedded
    ? locale === 'tr' ? 'Vitrine dön' : 'Back to showcase'
    : locale === 'tr' ? 'Koleksiyonu Değiştir' : 'Change Collection'

  // Capture modu: tüm hook'lar çağrıldıktan SONRA erken dönüş — sadece
  // 3D canvas'ı tam ekran render eder, hiçbir yan panel/tutorial/fiyat
  // çubuğu yok (bkz. scripts/generate-spin-frames.ts).
  if (captureMode) {
    return (
      <div className="h-full w-full">
        <ConfiguratorCanvas onScreenshotReady={handleScreenshotReady} />
      </div>
    )
  }

  // Fiyat özeti + Kaydet — scroll'un DIŞINDA, tek satır, panelin hemen altında
  const summaryBlock = (
  collectionKey && !isLoadingParts && (
    <div className="flex-shrink-0 border-t border-bureau-black bg-bureau-white p-3 dark:border-bureau-dark-line-blue">
      <ConfigSummary onRegister={handleRegisterDesign} compact />
      {isSaving && (
        <p className="mt-2 text-center font-mono text-[11px] uppercase text-bureau-muted">
          {locale === 'tr' ? 'Kaydediliyor...' : 'Saving...'}
        </p>
      )}
      {saveError && <p className="mt-2 text-center text-[12px] text-red-600">{saveError}</p>}
      {saveSuccess && (
        <div className="mt-2 border border-bureau-amber bg-bureau-amber/5 p-3 text-center">
          <p className="font-mono text-[11px] uppercase tracking-wide text-bureau-amber">
            {locale === 'tr' ? 'Kayıt Onaylandı' : 'Registration Confirmed'}
          </p>
          <p className="mt-1 text-[12px]">{saveSuccess}</p>
          <button onClick={() => router.push('/cart')} className="btn-bureau-outline mt-3 w-full">
            {locale === 'tr' ? 'Sepete Git' : 'Go to Cart'}
          </button>
        </div>
      )}
    </div>
  )
  )

  const activeCollection = collections.find((c) => c.key?.current === collectionKey) ?? null

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
      <CustomRegistryTutorial locale={locale as 'tr' | 'en'} active={showTutorial} />

      {/* ── DESKTOP, ANASAYFAYA GÖMÜLÜ: ilk ekranın yerleşimi birebir korunur.
          Tuval tel kafes sahnesinin yerinde (tüm ilk ekran, model ortada);
          solda koleksiyon künyesi (seçim listesinin yerinde), sağda parça/
          model menüsü (Büro Bülteni + vitrin kartının yerinde). ── */}
      {embedded && embeddedLayout === 'desktop' && (
        <div className="relative min-h-0 flex-1">
          <div className="absolute inset-0">
            <ConfiguratorCanvas onScreenshotReady={handleScreenshotReady} showHud={false} reveal={effectiveReveal} />
          </div>
          <div aria-hidden="true" className="studio-vignette pointer-events-none absolute inset-0" />
          {swapStage !== 'idle' && (
            <StudioLoadBar stage={swapStage} tr={locale === 'tr'} className="absolute left-1/2 top-6 z-30 w-[min(360px,28%)] -translate-x-1/2" />
          )}
          <div className="pointer-events-none relative z-10 grid h-full grid-cols-[minmax(320px,440px)_minmax(0,1fr)_minmax(300px,380px)] gap-8 px-9 py-8">
            <div className="pointer-events-auto flex min-h-0 min-w-0 flex-col justify-center">
              <StudioCollectionInfo collection={activeCollection} locale={locale} onBack={changeCollection} />
            </div>
            <div className="relative min-w-0">
              <CombinationCountBadge />
              <CameraFitButton />
            </div>
            <div className="pointer-events-auto flex min-h-0 min-w-0 flex-col overflow-hidden border border-bureau-black bg-bureau-white/90 backdrop-blur-[6px]">
              <div className="flex items-center justify-between border-b border-bureau-black px-4 py-2.5">
                <span className="flex flex-col">
                  <span className="text-[15px] font-semibold tracking-[-0.02em] text-bureau-black">
                    {locale === 'tr' ? 'Tahsis Formu' : 'Allocation Form'}
                  </span>
                  <span className="font-mono text-[9.5px] uppercase tracking-widest text-bureau-muted">
                    {locale === 'tr' ? 'Model ve renkleri seçin, fiyat anında güncellenir' : 'Pick model and colours; price updates live'}
                  </span>
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-bureau-subtle">104-B</span>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-4" id="tutorial-scope">
                {!collectionKey || isLoadingParts ? (
                  <div className="flex h-40 items-center justify-center">
                    <span className="font-mono text-[11px] uppercase text-bureau-muted">
                      {locale === 'tr' ? 'Yükleniyor...' : 'Loading...'}
                    </span>
                  </div>
                ) : (
                  <ControlPanel hideIot />
                )}
              </div>
              {summaryBlock}
            </div>
          </div>
        </div>
      )}

      {/* ── DESKTOP: yan yana; fiyat/kaydet çubuğu panelin kendi altında ── */}
      {!embedded && (
      <div className="hidden min-h-0 flex-1 lg:flex">
        <div className="flex min-h-0 flex-1 border-r border-bureau-black">
          <ConfiguratorCanvas onScreenshotReady={handleScreenshotReady} />
        </div>
        <div
          className={`flex flex-shrink-0 flex-col overflow-hidden ${
            embedded ? 'w-[400px] bg-bureau-white/90 backdrop-blur-[6px]' : 'w-[460px]'
          }`}
        >
          <div className="flex-1 overflow-y-auto p-4" id="tutorial-scope">
            {!collectionKey ? (
              <div>
                {presetNotice && (
                  <div className="mb-3 border border-red-600 bg-red-50 p-3 text-[12px] leading-relaxed text-red-700">
                    {presetNotice}
                  </div>
                )}
                <h2 className="mb-3 font-mono text-[11px] uppercase tracking-wide text-bureau-muted">
                  {locale === 'tr' ? 'Bir Koleksiyon Seçin' : 'Select a Collection'}
                </h2>
                <CollectionPicker collections={collections} activeKey={collectionKey} onSelect={handleSelectCollection} />
              </div>
            ) : isLoadingParts ? (
              <div className="flex h-40 items-center justify-center">
                <span className="font-mono text-[11px] uppercase text-bureau-muted">
                  {locale === 'tr' ? 'Yükleniyor...' : 'Loading...'}
                </span>
              </div>
            ) : (
              <div className="space-y-5">
                <button onClick={changeCollection} className="font-mono text-[10.5px] uppercase tracking-wide text-bureau-muted hover:text-bureau-amber">
                  ← {changeLabel}
                </button>
                <ControlPanel />
              </div>
            )}
          </div>

          {summaryBlock}
        </div>
      </div>

      )}

      {/* ── MOBİL: viewer üstte, panel altta ── */}
      {(!embedded || embeddedLayout === 'mobile') && (
      <div className={`flex min-h-0 flex-1 flex-col overflow-hidden ${embedded ? '' : 'lg:hidden'}`}>
        {!collectionKey ? (
          <div className="flex-1 overflow-y-auto p-4">
            {presetNotice && (
              <div className="mb-3 border border-red-600 bg-red-50 p-3 text-[12px] leading-relaxed text-red-700">
                {presetNotice}
              </div>
            )}
            <h2 className="mb-3 font-mono text-[11px] uppercase tracking-wide text-bureau-muted">
              {locale === 'tr' ? 'Bir Koleksiyon Seçin' : 'Select a Collection'}
            </h2>
            <CollectionPicker collections={collections} activeKey={collectionKey} onSelect={handleSelectCollection} />
          </div>
        ) : (
          <>
            {/* 3D Viewer — üst %50 (önceden %60'tı; seçim paneline daha
                fazla yer açmak için %10 küçültüldü, kalan alan bu). */}
            <div className="relative min-h-0 flex-1 overflow-hidden border-b border-bureau-black">
              {embedded && swapStage !== 'idle' && (
                <StudioLoadBar stage={swapStage} tr={locale === 'tr'} className="absolute inset-x-4 top-3 z-10" />
              )}
              <ConfiguratorCanvas onScreenshotReady={handleScreenshotReady} reveal={embedded ? effectiveReveal : undefined} />
            </div>

            {/* Parts paneli — alt %50 (önceden %40'tı, %10 büyütüldü) */}
            <div className="min-h-0 flex-1 overflow-y-auto" id="tutorial-scope-mobile">
              {isLoadingParts ? (
                <div className="flex h-full items-center justify-center">
                  <span className="font-mono text-[11px] uppercase text-bureau-muted">
                    {locale === 'tr' ? 'Yükleniyor...' : 'Loading...'}
                  </span>
                </div>
              ) : (
                <MobileControlPanel
                  onClearCollection={changeCollection}
                  clearLabel={embedded ? (locale === 'tr' ? 'Vitrin' : 'Showcase') : undefined}
                  onRegister={handleRegisterDesign}
                  isSaving={isSaving}
                  saveError={saveError}
                  saveSuccess={saveSuccess}
                  onGoCart={() => router.push('/cart')}
                />
              )}
            </div>
          </>
        )}
      </div>
      )}
    </div>
  )
}

/**
 * Gömülü stüdyonun sol sütunu: seçilen koleksiyonun künyesi. Koleksiyon
 * listesinin durduğu yerde açılır — ziyaretçinin gözü aynı noktada kalır.
 */
function StudioCollectionInfo({
  collection,
  locale,
  onBack,
}: {
  collection: Collection | null
  locale: string
  onBack: () => void
}) {
  const tr = locale === 'tr'
  const models = useConfiguratorStore((s) => s.models)
  const parts = useConfiguratorStore((s) => s.availableParts)
  const layoutMode = useConfiguratorStore((s) => s.layoutMode)
  const bodyLimits = useConfiguratorStore((s) => s.bodyLimits)
  const key = collection?.key.current ?? ''
  const name = (collection && getLocalizedValue(collection.name, locale, key)) || key
  const desc = collection ? getLocalizedValue(collection.description, locale, '') : ''
  const pad = (n: number) => String(n).padStart(2, '0')
  const facts: Array<[string, string]> =
    layoutMode === 'model'
      ? [
          [tr ? 'Yerleşim' : 'Layout', tr ? 'Montajlı model' : 'Assembled model'],
          [tr ? 'Model' : 'Models', pad(models.length)],
          [tr ? 'Renk' : 'Colour', tr ? 'Her parça ayrı' : 'Per part'],
        ]
      : [
          [tr ? 'Yerleşim' : 'Layout', tr ? 'Üst üste dizilim' : 'Stacked'],
          [tr ? 'Parça' : 'Parts', pad(parts.length)],
          [tr ? 'Gövde katmanı' : 'Body layers', `${bodyLimits.min}–${bodyLimits.max}`],
          [tr ? 'Renk' : 'Colour', tr ? 'Her parça ayrı' : 'Per part'],
        ]
  return (
    <div className="animate-drawer-in">
      <div className="mb-6">
        <IotToggle size="lg" />
      </div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-bureau-muted">
        {tr ? 'Form 104-B · Özel Tahsis' : 'Form 104-B · Custom Allocation'}
      </p>
      <h1 className="mt-1 text-[30px] font-semibold leading-[0.95] tracking-[-0.04em] text-bureau-black sm:text-[36px] lg:text-[40px]">
        {name}
        <span className="text-bureau-amber">.</span>
      </h1>
      {desc && <p className="mt-2 max-w-[52ch] text-[13px] leading-relaxed text-bureau-muted">{desc}</p>}
      <dl className="mt-5 border-t border-bureau-rule">
        {facts.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-4 border-b border-bureau-rule py-2 font-mono text-[10.5px] uppercase tracking-wider">
            <dt className="text-bureau-muted">{k}</dt>
            <dd className="tabular-nums text-bureau-black">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 max-w-[46ch] text-[12px] leading-relaxed text-bureau-subtle">
        {tr
          ? 'Sahneyi sürükleyerek çevirin, tekerlekle yaklaşın. Seçimler sağdaki tahsis formunda.'
          : 'Drag to orbit, scroll to zoom. Choices live in the allocation form on the right.'}
      </p>
      <button
        type="button"
        onClick={onBack}
        className="focus-bureau mt-4 py-1 font-mono text-[11px] uppercase tracking-wider text-bureau-muted hover:text-bureau-black"
      >
        ← {tr ? 'Koleksiyonlar' : 'Collections'}
      </button>
    </div>
  )
}
