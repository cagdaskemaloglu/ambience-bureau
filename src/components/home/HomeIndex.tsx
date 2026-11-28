'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Suspense } from 'react'
import { createPortal } from 'react-dom'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { LIGHT_CLASSES } from '@/lib/lightClasses'
import { formatPrice, getLocalizedValue, getPricingForLocale, urlFor } from '@/lib/sanity'
import { ProductCard } from '@/components/registry/ProductCard'
import { Link } from '@/i18n/navigation'
import type { Collection, ProductCard as ProductCardType, ProductConfiguratorPart, SanityImage } from '@/types'
import { getProductPresetDesign } from '@/lib/queries'
import { StudioLoadBar } from '@/components/configurator/StudioLoadBar'
import { HeroCollectionPicker } from './HeroCollectionPicker'
import { HeroWireframe } from './HeroWireframe'
import type { HeroWireframeData } from '@/lib/queries'

// Gömülü konfigüratör: ilk açılış paketine GİRMEZ; koleksiyon seçilince (ya da
// seçim niyeti görülünce önceden) indirilir.
const loadStudio = () => import('./HeroStudio')
const HeroStudio = dynamic(loadStudio, { ssr: false, loading: () => null })
let studioPreloaded = false

/**
 * Adres çubuğu ↔ stüdyo senkronu. Next.js `history.pushState`/geri tuşunu
 * kendi router'ıyla takip eder; `useSearchParams` bu yüzden tek doğru kaynak:
 * adreste `?collection=` YOKSA stüdyo açık kalamaz. (Statik çizimde
 * `useSearchParams` Suspense ister — ayrı bileşen bu yüzden.)
 */
function StudioUrlSync({ onChange }: { onChange: (collection: string | null, model?: string, preset?: string) => void }) {
  const sp = useSearchParams()
  const collection = sp.get('collection')
  const model = sp.get('model') ?? undefined
  const preset = sp.get('preset') ?? undefined
  useEffect(() => {
    onChange(collection, model, preset)
  }, [collection, model, preset, onChange])
  return null
}

/** Seçimden stüdyonun görünmesine kadar en az bu kadar (tel kafes görünür kalır). */
const STUDIO_MIN_MS = 1000

type PresetDesign = { collectionKey: string; parts: ProductConfiguratorPart[] }
/** Stüdyo isteği: koleksiyon (+model) ya da ürün kombinasyonu (preset = ürün slug'ı). */
type StudioReq = { collection?: string; model?: string; preset?: string }
type StudioState = { collection: string; model?: string; preset: PresetDesign | null; key: string }
const reqKey = (r: StudioReq) => `${r.collection ?? ''}|${r.model ?? ''}|${r.preset ?? ''}`

function preloadStudio() {
  if (studioPreloaded) return
  studioPreloaded = true
  void loadStudio()
}

const DROPS_ID = 'drops'

export const HOME_INDEX_ID = 'tahsis-dizini'
/** Menüdeki "Tüm Kayıtlar" satırı (RegisterSection'ı seçim alanında gösterir). */
const REGISTER_ID = 'tum-kayitlar'
/** İlk ekranın altındaki TEK seçim alanı. */
const SELECTION_ID = 'secim-alani'
/** "Kendi lambanı tasarla" / header "Özel Tahsis" → ilk ekranda koleksiyon seçimi. */
const CUSTOM_PICKER_ID = 'ozel-tahsis'

export type DropsPreview = {
  /** Kayıtlı (görünen) drop sayısı */
  count: number
  /** Kartta gösterilecek drop (canlı olan, yoksa ilk) */
  feature: {
    dropNo: string
    name: string
    image: SanityImage | null
    remaining: number | null
    planned: number | null
    live: boolean
  } | null
}

type Row = {
  id: string
  title: string
  desc: string
  products: ProductCardType[]
  fromPrice: { amount: number; currency: string } | null
}

/**
 * Anasayfa tahsis dizini — Drops ve Daimi Envanter sınıfları TEK listede:
 * A Drops · S Lambader · D Aplik · F Masa Lambası · G Sarkıt.
 *  - Menü ilk ekranın altında yatay bir şerittir. Anasayfa = header +
 *    footer + aralarında TEK seçim alanı: bir satıra tıklamak içeriğini
 *    ilk ekranın altındaki tek alanda gösterir (öncekinin YERİNE geçer);
 *    seçili satıra tekrar tıklamak alanı kapatır.
 *  - Sağdaki dosya kartı (md+) üzerine gelinen/odaklanılan satırın
 *    ürünlerini önizler; kart satır açılınca da görünür kalır (sticky).
 *  - "#drop-NNN" / "#daimi-envanter" bağlantıları (bülten paneli) Drops
 *    satırını açıp ilgili drop'a kaydırır.
 */
export function HomeIndex({
  products,
  locale,
  dropsContent,
  drops,
  dropProducts,
  intro,
  side,
  wireframes,
  registerProducts,
  registerContent,
  collections,
}: {
  /** Özel Tahsis koleksiyonları — ilk ekranda tanıtım bloğunun yerinde seçilir. */
  collections: Collection[]
  /** "Tüm Kayıtlar" satırının vitrin ürünleri ve içeriği (RegisterSection). */
  registerProducts: ProductCardType[]
  registerContent: ReactNode
  /** İlk ekranın solu: FORM 001 künyesi, başlık, açıklama, eylemler. */
  intro: ReactNode
  /** İlk ekranın sağı (üst): Büro Bülteni. */
  side: ReactNode
  /** İlk ekranın tamamına yayılan 3B tel kafes sahnesinin nesneleri. */
  wireframes?: HeroWireframeData[]
  products: ProductCardType[]
  locale: string
  /** Drops satırının vitrininde dönecek drop ürünleri (canlı drop önce). */
  dropProducts: ProductCardType[]
  /** Sunucuda çizilen drop satırları (DropRow / UpcomingDropRow). */
  dropsContent: ReactNode
  drops: DropsPreview
}) {
  const tr = locale === 'tr'
  const intl = tr ? 'tr-TR' : 'en-US'
  const pad = (n: number) => String(n).padStart(2, '0')

  const rows: Row[] = useMemo(() => {
    const classRows = LIGHT_CLASSES.map((cls) => {
      const list = products.filter((p) => p.category === cls.value)
      let fromPrice: Row['fromPrice'] = null
      for (const p of list) {
        const pr = getPricingForLocale(p, locale)
        const amount = pr.discounted ?? pr.original
        if (fromPrice === null || amount < fromPrice.amount) fromPrice = { amount, currency: pr.currency }
      }
      return {
        id: cls.value,
        title: tr ? cls.tr : cls.en,
        desc: tr ? cls.descTr : cls.descEn,
        products: list,
        fromPrice,
      }
    }).filter((r) => r.id !== 'strip' || r.products.length > 0) // Şerit sadece ürünü varsa
    return [
      {
        id: DROPS_ID,
        title: 'Drops',
        desc: tr
          ? 'Numaralı ve sonlu drop’lar. Her adet bir seri numarası taşır; drop kapandığında aynı nesne bir daha üretilmez.'
          : 'Numbered, finite drops. Every unit carries a serial number; once a drop closes, the same object is never made again.',
        products: dropProducts,
        fromPrice: null,
      },
      ...classRows,
      {
        id: REGISTER_ID,
        title: tr ? 'Tüm Kayıtlar' : 'Full Register',
        desc: tr
          ? 'Sicildeki bütün nesneler tek dosyada: drop parçaları ve daimi envanter. Rejime, sınıfa ve fiyata göre süzün.'
          : 'Every object on the register in one file: drop pieces and standing inventory. Filter by regime, class and price.',
        products: registerProducts,
        fromPrice: null,
      },
    ]
  }, [products, dropProducts, registerProducts, locale, tr])

  const [selected, setSelected] = useState<string | null>(null)
  // Özel Tahsis: ilk ekranın solunda tanıtım yerine koleksiyon seçimi.
  const [picking, setPicking] = useState(false)
  // Gömülü konfigüratör (Özel Tahsis stüdyosu) — ilk ekranın içinde açılır.
  const [studio, setStudio] = useState<StudioState | null>(null)
  // Tel kafes sahnesinin odağı: seçim yapılır yapılmaz açılacak nesneye geçer
  // (stüdyo yüklenirken ziyaretçi AYNI lambanın tel kafesini görür).
  const [focus, setFocus] = useState<{ collection: string | null; slug: string | null } | null>(null)
  // Stüdyo görünür mü: en az STUDIO_MIN_MS sonra ve tuvalde model hazırken.
  const [studioReady, setStudioReady] = useState(false)
  // Yükleme çubuğu: seçimde 0,25 sn'de %60 → hazır olunca 0,15 sn'de %100.
  const [loadStage, setLoadStage] = useState<'idle' | 'loading' | 'done'>('idle')
  const readyRef = useRef(false)
  const openedAt = useRef(0)
  const openToken = useRef(0)
  // Açık/açılmakta olan stüdyonun adres anahtarı (adres ↔ durum eşleşmesi).
  const currentKey = useRef('')
  const timers = useRef<number[]>([])
  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }
  const [isDesktop, setIsDesktop] = useState(true)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const sync = () => setIsDesktop(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  /**
   * Stüdyoyu hazırla. Üst üste (stack) koleksiyonda model verilmemişse
   * sahnedeki o koleksiyonun ürünü (tel kafesi gösterilen) kombinasyonuyla
   * açılır — tel kafes ile materyalli görünüm aynı lamba olur.
   */
  const startStudio = useCallback(
    async (req: StudioReq) => {
      const token = ++openToken.current
      currentKey.current = reqKey(req)
      clearTimers()
      preloadStudio()
      openedAt.current = performance.now()
      readyRef.current = false
      setStudioReady(false)
      setLoadStage('loading')
      let collection = req.collection
      let presetSlug = req.preset
      if (!presetSlug && collection && !req.model) {
        const c = collections.find((x) => x.key.current === collection)
        if (c?.layoutMode !== 'model') {
          presetSlug = wireframes?.find((w) => w.kind === 'stack' && w.collectionKey === collection)?.slug
        }
      }
      setFocus({ collection: collection ?? null, slug: presetSlug ?? (req.model ? `model:${req.model}` : null) })
      const hero = heroRef.current
      if (hero && hero.getBoundingClientRect().top < -40) hero.scrollIntoView({ behavior: 'smooth', block: 'start' })

      let preset: PresetDesign | null = null
      if (presetSlug) {
        preset = await getProductPresetDesign(presetSlug).catch(() => null)
        if (token !== openToken.current) return
        if (preset) collection = preset.collectionKey
      }
      if (!collection) {
        // Ürünün konfigüratör verisi yok: akış kapanır, sayfa yerinde kalır.
        currentKey.current = ''
        setFocus(null)
        setLoadStage('idle')
        return
      }
      setStudio({ collection, model: req.model, preset, key: `${collection}|${req.model ?? ''}|${preset ? presetSlug : ''}` })
    },
    [collections, wireframes]
  )

  // Seçim niyeti (koleksiyonun üzerine gelme): konfigüratör kodu ve o
  // koleksiyonun tel kafes dosyaları önceden indirilir — seçilince tel kafes
  // beklemeden çizilir.
  const prefetched = useRef(new Set<string>())
  const prefetchCollection = useCallback(
    (key: string) => {
      preloadStudio()
      if (prefetched.current.has(key)) return
      prefetched.current.add(key)
      const c = collections.find((x) => x.key.current === key)
      const item =
        (c?.layoutMode !== 'model' && wireframes?.find((w) => w.kind === 'stack' && w.collectionKey === key)) ||
        wireframes?.find((w) => w.collectionKey === key)
      item?.parts.forEach((p) => void fetch(p.url, { priority: 'low' } as RequestInit).catch(() => {}))
    },
    [collections, wireframes]
  )

  // Adres ↔ stüdyo: ?collection=…(&model=…) ya da ?preset=<ürün> stüdyoyu
  // açar; adreste yoksa kapalıdır. Koleksiyon listesinden açıldıysa geri
  // tuşu listeye döner.
  const syncFromUrl = useCallback(
    (collection: string | null, model?: string, preset?: string) => {
      if (collection || preset) {
        const req = { collection: collection ?? undefined, model, preset }
        if (reqKey(req) !== currentKey.current) void startStudio(req)
      } else {
        openToken.current++
        currentKey.current = ''
        clearTimers()
        setStudio(null)
        setFocus(null)
        setStudioReady(false)
        setLoadStage('idle')
        // Koleksiyon listesi adreste #ozel-tahsis varken açık; geri gelinince kapanır.
        setPicking(window.location.hash === `#${CUSTOM_PICKER_ID}`)
      }
    },
    [startStudio]
  )
  // Yedek: bazı tarayıcı geri hareketlerinde (bfcache vb.) doğrudan popstate.
  useEffect(() => {
    const onPop = () => {
      const q = new URLSearchParams(window.location.search)
      syncFromUrl(q.get('collection'), q.get('model') ?? undefined, q.get('preset') ?? undefined)
    }
    window.addEventListener('popstate', onPop)
    window.addEventListener('pageshow', onPop)
    return () => {
      window.removeEventListener('popstate', onPop)
      window.removeEventListener('pageshow', onPop)
    }
  }, [syncFromUrl])

  const openStudio = useCallback(
    (req: StudioReq) => {
      void startStudio(req)
      const q = new URLSearchParams(
        req.preset ? { preset: req.preset } : { collection: req.collection ?? '', ...(req.model ? { model: req.model } : {}) }
      )
      history.pushState({ studio: true }, '', `${window.location.pathname}?${q.toString()}`)
    },
    [startStudio]
  )

  // Kartlardaki / ürün sayfasındaki "Özelleştir": sayfadan ayrılmadan stüdyoyu aç.
  useEffect(() => {
    const onOpen = (e: Event) => {
      const d = (e as CustomEvent<StudioReq>).detail
      if (!d?.collection && !d?.preset) return
      e.preventDefault()
      openStudio(d)
      heroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    window.addEventListener('bureau:open-studio', onOpen)
    return () => window.removeEventListener('bureau:open-studio', onOpen)
  }, [openStudio])

  // Tuval hazır: en erken seçimden STUDIO_MIN_MS − 150 ms sonra çubuk %100'e
  // tamamlanır, 150 ms sonra stüdyo tel kafesten açılır (toplam ≥ 1 sn).
  const onStudioReady = useCallback(() => {
    if (readyRef.current) return
    readyRef.current = true
    const wait = Math.max(0, openedAt.current + STUDIO_MIN_MS - 150 - performance.now())
    timers.current.push(
      window.setTimeout(() => {
        setLoadStage((s) => (s === 'loading' ? 'done' : s))
        timers.current.push(
          window.setTimeout(() => {
            setStudioReady(true)
            setPicking(false)
          }, 150)
        )
      }, wait)
    )
  }, [])
  // Bir şey takılırsa akış yine de tamamlansın.
  useEffect(() => {
    if (!studio || studioReady) return
    const t = setTimeout(onStudioReady, 8000)
    return () => clearTimeout(t)
  }, [studio, studioReady, onStudioReady])
  useEffect(() => {
    if (loadStage !== 'done') return
    const t = setTimeout(() => setLoadStage('idle'), 400)
    return () => clearTimeout(t)
  }, [loadStage])

  const closeStudio = useCallback(() => {
    openToken.current++
    currentKey.current = ''
    clearTimers()
    setStudio(null)
    setFocus(null)
    setStudioReady(false)
    setLoadStage('idle')
    if ((history.state as { studio?: boolean } | null)?.studio) history.back()
    else history.replaceState(null, '', window.location.pathname)
  }, [])
  const [active, setActive] = useState<string>(DROPS_ID)
  const rowRefs = useRef<Record<string, HTMLLIElement | null>>({})
  // Açınca sayfa kayar; imlecin altına gelen satır kartı değiştirmesin
  // diye fare üzerine gelmeyi kısa süre yok say.
  const ignoreHoverUntil = useRef(0)
  const activeRow = rows.find((r) => r.id === active) ?? rows[0]
  const selectedRef = useRef(selected)
  selectedRef.current = selected

  // Seçim alanı ilk ekranın ALTINDA; kapanınca ilk ekrana dönülür.
  const panelRef = useRef<HTMLElement>(null)
  const heroRef = useRef<HTMLElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const scrollToRow = useCallback((closing = false) => {
    ignoreHoverUntil.current = performance.now() + 900
    // Panel bir sonraki çizimde oluşur: iki kare bekle.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
        const target = closing ? heroRef.current : panelRef.current
        target?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
      })
    )
  }, [])

  const toggle = useCallback(
    (id: string, opts?: { forceOpen?: boolean; noScroll?: boolean }) => {
      setActive(id)
      const willOpen = selectedRef.current !== id || !!opts?.forceOpen
      setSelected(willOpen ? id : null)
      // Telefonda menü yana kayan tek satır: seçilen kalemi görünür yap.
      const li = rowRefs.current[id]
      const ul = li?.parentElement
      if (li && ul && ul.scrollWidth > ul.clientWidth) {
        ul.scrollTo({ left: li.offsetLeft - (ul.clientWidth - li.offsetWidth) / 2, behavior: 'smooth' })
      }
      if (!opts?.noScroll) scrollToRow(!willOpen)
    },
    [scrollToRow]
  )

  // Masaüstünde ilk ekran (3B sahne + metin + menü + bülten) tam bir ekran:
  // header'ın altından ekranın sonuna kadar.
  const [minH, setMinH] = useState<number | null>(null)
  const [navH, setNavH] = useState(60)
  const [viewH, setViewH] = useState<number | null>(null)
  useEffect(() => {
    const measure = () => {
      if (navRef.current) setNavH(navRef.current.offsetHeight)
      const el = heroRef.current
      const main = document.getElementById('main-content')
      // Seçim alanı en az (görünür alan − menü) yüksekliğinde: içerik kısa
      // olsa da menü en üste oturabilsin.
      if (main) setViewH(main.clientHeight - (navRef.current?.offsetHeight ?? 0))
      if (!el || !main || window.innerWidth < 768) return setMinH(null)
      const top = el.getBoundingClientRect().top - main.getBoundingClientRect().top + main.scrollTop
      // İlk ekran + menü şeridi birlikte header ile footer arasını doldurur.
      const h = main.clientHeight - top - (navRef.current?.offsetHeight ?? 0)
      setMinH(h > 360 ? Math.floor(h) : null)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  // Bülten bağlantıları: #drop-NNN → Drops'u aç ve o drop'a kaydır.
  useEffect(() => {
    const handle = () => {
      const h = decodeURIComponent(window.location.hash.slice(1))
      if (h === CUSTOM_PICKER_ID) {
        setPicking(true)
        preloadStudio()
        heroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } else if (h === REGISTER_ID) {
        toggle(REGISTER_ID, { forceOpen: true })
      } else if (h.startsWith('drop-')) {
        toggle(DROPS_ID, { forceOpen: true, noScroll: true })
        // Drop satırları açıldıktan sonra kaydır.
        setTimeout(() => document.getElementById(h)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
      } else if (h === 'daimi-envanter' || h === HOME_INDEX_ID) {
        heroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
    handle()
    window.addEventListener('hashchange', handle)
    return () => window.removeEventListener('hashchange', handle)
  }, [toggle])

  const countLabel = (r: Row) => {
    const count = r.id === DROPS_ID ? drops.count : r.products.length
    return count > 0
      ? r.id === DROPS_ID
        ? `${pad(count)} drop`
        : `${pad(count)} ${tr ? 'kayıt' : count === 1 ? 'record' : 'records'}`
      : tr
        ? 'Kayıt açılıyor'
        : 'Opening'
  }
  const selectedRow = rows.find((r) => r.id === selected) ?? null

  return (
    <>
      {/* İLK EKRAN — site tek sayfalık bir "header": 3B sahne tüm alana yayılır
          (kenarlarda siyaha erir), solda künye + başlık + küçük dizin menüsü,
          sağda Büro Bülteni ve önizleme kartı. */}
      <section
        ref={heroRef}
        aria-labelledby="home-title"
        style={minH ? { minHeight: minH } : undefined}
        className="home-hero relative isolate flex flex-col overflow-hidden"
      >
        <Suspense fallback={null}>
          <StudioUrlSync onChange={syncFromUrl} />
        </Suspense>
        {wireframes && wireframes.length > 0 && (
          <HeroWireframe
            items={wireframes}
            locale={locale}
            focusCollection={focus?.collection ?? studio?.collection ?? null}
            focusSlug={focus?.slug ?? null}
            active={!(studio && studioReady && isDesktop)}
          />
        )}

        {/* GÖMÜLÜ KONFİGÜRATÖR (masaüstü): ilk ekranın içinde, AYNI yerleşimle —
            tuval tel kafes sahnesinin yerinde, solda koleksiyon künyesi, sağda
            tahsis formu (bülten + vitrin kartının yerinde). Hazır olana dek
            görünmez yüklenir; sonra tel kafesin üstüne erir. */}
        {studio && isDesktop && (
          <div
            aria-hidden={!studioReady || undefined}
            className={`absolute inset-0 z-20 flex transition-opacity duration-300 ease-out motion-reduce:transition-none ${
              studioReady ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          >
            <div className="relative flex min-h-0 flex-1">
              <HeroStudio
                key={studio.key}
                collections={collections}
                collectionKey={studio.collection}
                modelId={studio.model}
                onClose={closeStudio}
                onReady={onStudioReady}
                layout="desktop"
                presetDesign={studio.preset}
                reveal={studioReady ? 'reveal' : 'hidden'}
              />
            </div>
          </div>
        )}

        {/* Yükleme çubuğu — 3B görüntüleyicinin (tel kafesin) üstünde. */}
        {loadStage !== 'idle' && isDesktop && (
          <StudioLoadBar stage={loadStage} tr={tr} className="absolute left-1/2 top-6 z-30 w-[min(360px,28%)] -translate-x-1/2" />
        )}

        <div
          aria-hidden={studio && studioReady && isDesktop ? true : undefined}
          className={`pointer-events-none relative z-10 grid transition-opacity duration-200 ${studio && studioReady && isDesktop ? 'invisible opacity-0' : ''} flex-1 gap-8 px-5 py-6 md:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] md:px-9 md:py-8 lg:grid-cols-[minmax(320px,440px)_minmax(0,1fr)_minmax(300px,380px)]`}>
          {/* Sol: künye + başlık + açıklama + eylemler */}
          <div className="pointer-events-auto flex min-w-0 flex-col justify-center">
            {picking ? (
              <HeroCollectionPicker
                collections={collections}
                locale={locale}
                onPick={(key) => openStudio({ collection: key })}
                onIntent={prefetchCollection}
                onBack={() => {
                  setPicking(false)
                  // Aynı bağlantıya yeniden basılınca tekrar açılabilsin.
                  if (window.location.hash === `#${CUSTOM_PICKER_ID}`) {
                    history.replaceState(null, '', window.location.pathname + window.location.search)
                  }
                }}
              />
            ) : (
              intro
            )}
          </div>

          {/* Orta: 3B sahne (arka planda) için boş alan */}
          <div aria-hidden="true" className="hidden lg:block" />

          {/* Sağ: Büro Bülteni + önizleme kartı */}
          <div className="pointer-events-auto flex min-w-0 flex-col gap-6">
            <div>{side}</div>
            {activeRow && (
              <article
                key={activeRow.id}
                aria-live="polite"
                className="animate-drawer-in hidden border border-bureau-black bg-bureau-white md:block"
              >
                <div className="flex items-center justify-between border-b border-bureau-black px-3.5 py-2 font-mono text-[10px] uppercase tracking-widest">
                  <span className="text-bureau-black">{activeRow.title}</span>
                  <span className="tabular-nums text-bureau-muted">{countLabel(activeRow)}</span>
                </div>
                <Coverflow row={activeRow} locale={locale} height={230} />
                <div className="flex h-[52px] items-center justify-between gap-3 border-t border-bureau-black px-3.5">
                  <p className="min-w-0 truncate font-mono text-[11px] tabular-nums text-bureau-black">
                    {activeRow.id === DROPS_ID
                      ? drops.feature
                        ? drops.feature.live && drops.feature.planned !== null
                          ? `${tr ? 'Kalan' : 'Remaining'} ${drops.feature.remaining ?? 0}/${drops.feature.planned}`
                          : `DROP-${drops.feature.dropNo}`
                        : ''
                      : activeRow.fromPrice
                        ? `${tr ? 'Başlangıç' : 'From'} ${formatPrice(activeRow.fromPrice.amount, activeRow.fromPrice.currency, intl)}`
                        : tr
                          ? 'Fiyatlandırma tahsis sonrası'
                          : 'Pricing on registration'}
                  </p>
                  <button
                    type="button"
                    onClick={() => toggle(activeRow.id, { forceOpen: true })}
                    className="btn-file focus-bureau !px-3 !py-1.5"
                  >
                    <span>{tr ? 'Aç ↓' : 'Open ↓'}</span>
                  </button>
                </div>
              </article>
            )}
          </div>
        </div>
      </section>

      {/* GÖMÜLÜ KONFİGÜRATÖR (telefon/tablet): aynı sayfada tam ekran katman. */}
      {studio &&
        !isDesktop &&
        createPortal(
          <div className="fixed inset-0 z-[70] flex flex-col bg-bureau-white" role="dialog" aria-modal="true" aria-label={tr ? 'Özel Tahsis' : 'Custom Allocation'}>
            <div className="flex flex-shrink-0 items-center justify-between border-b border-bureau-rule px-4 py-3">
              <span className="font-mono text-[10.5px] uppercase tracking-widest text-bureau-muted">
                {tr ? 'Özel Tahsis' : 'Custom Allocation'}
              </span>
              <button
                type="button"
                onClick={closeStudio}
                className="focus-bureau min-h-[40px] px-2 font-mono text-[11px] uppercase tracking-widest text-bureau-black"
              >
                {tr ? 'Kapat' : 'Close'} ✕
              </button>
            </div>
            <div className="relative flex min-h-0 flex-1 flex-col">
              {loadStage !== 'idle' && (
                <StudioLoadBar stage={loadStage} tr={tr} className="absolute inset-x-4 top-3 z-10" />
              )}
              <HeroStudio
                key={studio.key}
                collections={collections}
                collectionKey={studio.collection}
                modelId={studio.model}
                onClose={closeStudio}
                onReady={onStudioReady}
                layout="mobile"
                presetDesign={studio.preset}
                reveal={studioReady ? 'reveal' : 'hidden'}
              />
            </div>
          </div>,
          document.body
        )}

      {/* Dizin menüsü — ilk ekranın altında YATAY şerit; aşağı kayınca
          header'ın hemen altında SABİT kalır (sticky). Satıra tıklamak
          içeriğini alttaki tek seçim alanında gösterir. Telefonda tek
          satır, yana kaydırılır (sabitken ekranı kaplamasın). */}
      <nav
        id={HOME_INDEX_ID}
        aria-label={tr ? 'Tahsis dizini' : 'Allocation index'}
        ref={navRef}
        className="sticky top-0 z-30 border-y border-bureau-rule bg-bureau-white/85 backdrop-blur-[6px]"
      >
        <span id="daimi-envanter" aria-hidden="true" />
        <ul className="flex overflow-x-auto lg:grid lg:grid-cols-6 lg:overflow-visible">
          {rows.map((r) => {
            const isOpen = selected === r.id
            const isActive = r.id === activeRow?.id
            return (
              <li
                key={r.id}
                ref={(el) => {
                  rowRefs.current[r.id] = el
                }}
                className="min-w-[160px] flex-shrink-0 border-r border-bureau-rule last:border-r-0 lg:min-w-0"
              >
                <button
                  type="button"
                  onClick={() => toggle(r.id)}
                  onMouseEnter={() => {
                    if (performance.now() > ignoreHoverUntil.current) setActive(r.id)
                  }}
                  onFocus={() => setActive(r.id)}
                  aria-expanded={isOpen}
                  aria-controls={SELECTION_ID}
                  className="focus-bureau group relative flex min-h-[52px] w-full items-center gap-3 px-5 py-2.5 text-left md:px-6"
                >
                  {/* Etkin/açık satır: üstte amber çizgi */}
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-0 top-0 h-[2px] origin-left bg-bureau-amber transition-transform duration-300 ${
                      isOpen || isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    } ${isOpen ? '' : 'opacity-60'}`}
                  />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className={`truncate text-[15px] font-semibold tracking-[-0.01em] ${isOpen ? 'text-bureau-amber' : 'text-bureau-black'}`}>
                      {r.title}
                    </span>
                    <span className="font-mono text-[9.5px] uppercase tabular-nums tracking-wider text-bureau-muted">
                      {countLabel(r)}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={`font-mono text-[13px] transition-transform duration-200 ${isOpen ? 'rotate-90 text-bureau-amber' : isActive ? 'text-bureau-amber' : 'text-bureau-subtle'}`}
                  >
                    →
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* İLK EKRANIN ALTI — TEK seçim alanı: seçilen kategori burada. */}
      {selectedRow && (
        <section
          key={selectedRow.id}
          id={SELECTION_ID}
          ref={panelRef}
          aria-label={selectedRow.title}
          style={{ scrollMarginTop: navH, minHeight: viewH ?? undefined }}
          className="animate-drawer-in border-b border-bureau-rule"
        >
          {selectedRow.id === REGISTER_ID && <span id={REGISTER_ID} aria-hidden="true" />}
          <div className="flex items-center gap-4 border-b border-bureau-rule px-5 py-3 md:px-9">
            <span aria-hidden="true" className="h-5 w-[3px] bg-bureau-amber" />
            <h2 className="flex-1 text-[20px] font-semibold tracking-[-0.02em] text-bureau-black">{selectedRow.title}</h2>
            <span className="hidden font-mono text-[10px] uppercase tabular-nums tracking-wider text-bureau-muted sm:inline">
              {countLabel(selectedRow)}
            </span>
            <button
              type="button"
              onClick={() => toggle(selectedRow.id)}
              className="focus-bureau min-h-[36px] px-2 font-mono text-[10.5px] uppercase tracking-widest text-bureau-muted hover:text-bureau-amber"
            >
              {tr ? 'Kapat' : 'Close'} ✕
            </button>
          </div>
          {selectedRow.id === DROPS_ID ? (
            dropsContent
          ) : selectedRow.id === REGISTER_ID ? (
            registerContent
          ) : selectedRow.products.length > 0 ? (
            <div className="product-file-grid p-4 md:p-6">
              {selectedRow.products.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          ) : (
            <p className="px-5 py-8 text-center font-mono text-[11px] uppercase tracking-wide text-bureau-muted md:px-9">
              {tr ? 'Bu sınıfta kayıt açılıyor.' : 'Registration for this class is opening.'}
            </p>
          )}
        </section>
      )}
    </>
  )
}

/** Kart vitrininde gösterilecek ürünün bağlantısı (model kartı → konfigüratör). */
function productHref(p: ProductCardType): string {
  if (p.modelLink) {
    return `/?collection=${encodeURIComponent(p.modelLink.collectionKey)}&model=${encodeURIComponent(p.modelLink.modelId)}`
  }
  return `/registry/${p.slug.current}`
}

const AUTO_ADVANCE_MS = 3200

/**
 * 3B vitrin (coverflow): satırın ürünleri sırayla tanıtılır. Ortadaki kart
 * odakta; yanlardakiler perspektifle geride ve eğik. Oklar / yandaki karta
 * tıklama / ← → tuşları (kart odaktayken) ile gezilir; kendiliğinden ilerler,
 * üzerine gelince ya da odaklanınca durur. Hareketi azalt ayarında
 * otomatik ilerleme kapalıdır.
 */
function Coverflow({ row, locale, height = 320 }: { row: Row; locale: string; height?: number }) {
  const tr = locale === 'tr'
  const intl = tr ? 'tr-TR' : 'en-US'
  const items = row.products
  const n = items.length
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (n < 2 || paused) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => setIndex((i) => (i + 1) % n), AUTO_ADVANCE_MS)
    return () => clearInterval(t)
  }, [n, paused])

  const go = (d: number) => setIndex((i) => (((i + d) % n) + n) % n)

  if (n === 0) {
    // Dolu vitrinle AYNI yükseklik: sahne + 44px'lik odak satırı. Menüde
    // gezinirken kartın boyu değişip yerleşim zıplamasın.
    return (
      <div>
        <div className="relative flex items-center justify-center overflow-hidden bg-bureau-surface" style={{ height }}>
          <span className="relative -rotate-6 border-2 border-bureau-amber px-4 py-2 font-mono text-[13px] font-semibold uppercase tracking-widest text-bureau-amber">
            {tr ? 'Kayıt açılıyor' : 'Registration opening'}
          </span>
        </div>
        <div className="flex h-11 items-center justify-between gap-3 border-t border-bureau-black px-4">
          <span className="text-[14px] font-semibold text-bureau-subtle">—</span>
          <span className="font-mono text-[11px] tabular-nums text-bureau-muted">00/00</span>
        </div>
      </div>
    )
  }

  const current = items[Math.min(index, n - 1)]
  const curName = getLocalizedValue(current.name, locale, '') ?? ''
  const pr = getPricingForLocale(current, locale)

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') {
          e.preventDefault()
          go(1)
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault()
          go(-1)
        }
      }}
      role="region"
      aria-roledescription={tr ? 'vitrin' : 'carousel'}
      aria-label={row.title}
    >
      <div className="relative overflow-hidden bg-bureau-surface [perspective:1100px]" style={{ height }}>
        {items.map((p, k) => {
          let d = k - index
          if (d > n / 2) d -= n
          if (d < -n / 2) d += n
          const ad = Math.abs(d)
          const visible = ad <= 2
          const name = getLocalizedValue(p.name, locale, '') ?? ''
          const card = (
            <div className="relative h-full w-full overflow-hidden border border-bureau-black bg-bureau-white shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
              {p.image?.asset?.url ? (
                <Image
                  src={urlFor(p.image).width(420).height(560).fit('crop').url()}
                  alt={d === 0 ? (p.image.alt ?? name) : ''}
                  fill
                  sizes="220px"
                  className="object-cover"
                />
              ) : (
                <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center font-mono text-[11px] uppercase tracking-widest text-bureau-subtle">
                  {tr ? 'Görsel yok' : 'No image'}
                </span>
              )}
            </div>
          )
          return (
            <div
              key={p._id}
              aria-hidden={d !== 0}
              className="absolute left-1/2 top-1/2 h-[82%] aspect-[3/4] transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.2,0.7,0.1,1)] motion-reduce:transition-none"
              style={{
                transform: `translate(-50%, -50%) translateX(${d * 62}%) translateZ(${-ad * 140}px) rotateY(${-d * 38}deg)`,
                opacity: !visible ? 0 : ad === 2 ? 0.35 : ad === 1 ? 0.8 : 1,
                zIndex: 10 - ad,
                pointerEvents: visible ? 'auto' : 'none',
              }}
            >
              {d === 0 ? (
                <Link href={productHref(p)} className="focus-bureau block h-full w-full" aria-label={name}>
                  {card}
                </Link>
              ) : (
                <button type="button" tabIndex={-1} onClick={() => go(d)} className="block h-full w-full" aria-label={name}>
                  {card}
                </button>
              )}
            </div>
          )
        })}

        {n > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label={tr ? 'Önceki' : 'Previous'}
              className="focus-bureau absolute left-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center border border-bureau-black bg-bureau-white/90 font-mono text-[18px] text-bureau-black transition-colors hover:bg-bureau-black hover:text-bureau-white"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label={tr ? 'Sonraki' : 'Next'}
              className="focus-bureau absolute right-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center border border-bureau-black bg-bureau-white/90 font-mono text-[18px] text-bureau-black transition-colors hover:bg-bureau-black hover:text-bureau-white"
            >
              ›
            </button>
          </>
        )}
        {/* İlerleme çizgisi — otomatik ilerleme sayacı */}
        {n > 1 && !paused && (
          <span
            key={index}
            aria-hidden="true"
            className="absolute bottom-0 left-0 z-20 h-[2px] w-full origin-left bg-bureau-amber motion-reduce:hidden"
            style={{ animation: `coverflow-progress ${AUTO_ADVANCE_MS}ms linear forwards` }}
          />
        )}
      </div>

      {/* Odaktaki ürün */}
      <div className="flex h-11 items-center justify-between gap-3 border-t border-bureau-black px-4" aria-live="polite">
        <Link href={productHref(current)} className="focus-bureau min-w-0 truncate text-[14px] font-semibold text-bureau-black no-underline hover:text-bureau-amber">
          {curName}
        </Link>
        <span className="flex flex-shrink-0 items-baseline gap-2 font-mono text-[11px] tabular-nums">
          <span className="text-bureau-black">
            {current.modelLink ? (tr ? '' : 'from ') : ''}
            {formatPrice(pr.discounted ?? pr.original, pr.currency, intl)}
            {current.modelLink && tr ? "'den" : ''}
          </span>
          <span className="text-bureau-muted">
            {String(index + 1).padStart(2, '0')}/{String(n).padStart(2, '0')}
          </span>
        </span>
      </div>
    </div>
  )
}
