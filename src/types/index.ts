// ── Lokalizasyon ─────────────────────────────────────────

export type SupportedLocale = 'tr' | 'en'

export interface LocalizedString {
  locale: SupportedLocale
  value: string
}

export interface LocalizedBlock {
  locale: SupportedLocale
  value: PortableTextBlock[]
}

// Portable Text block tipi (basitleştirilmiş)
export interface PortableTextBlock {
  _type: string
  _key?: string
  [key: string]: unknown
}

// ── Sanity Image ──────────────────────────────────────────

export interface SanityImage {
  asset: {
    _id: string
    url: string
    metadata?: {
      dimensions: { width: number; height: number; aspectRatio: number }
      lqip?: string // blur placeholder
    }
  }
  alt?: string
  hotspot?: { x: number; y: number; height: number; width: number }
  crop?: { top: number; bottom: number; left: number; right: number }
}

// ── Ürün ─────────────────────────────────────────────────

export type ProductStatus = 'certified' | 'limited' | 'decommissioned' | 'owned'

export type ProductCategory = 'floor' | 'wall' | 'desk' | 'pendant' | 'strip'

/** limited = Sınırlı Tahsis (drop), standing = Daimi Envanter (sürekli satış). Boşsa limited kabul edilir. */
export type ProductSaleMode = 'limited' | 'standing'

export type PhotonOutput = '2700K' | '2700K-6500K' | '6500K'

export type ControlCompatibility = 'app' | 'voice' | 'manual' | 'schedule'

export interface ProductSpec {
  key: string
  value: string
}

export interface ProductCard {
  _id: string
  registryNo: string
  slug: { current: string }
  status: ProductStatus
  /** SADECE status === 'owned' iken dolu — Registry kartında gösterilen sansürlü isim (üye veya misafir, ikisi de aynı formatta). */
  ownerDisplayName?: string
  /** SADECE status === 'owned' iken dolu — sahibin şehri. */
  ownerCity?: string
  /** OPSİYONEL, SADECE gerçek üye hesabı varsa dolu — profil sayfası linki için. Misafirlerde boş. */
  ownerUserId?: string
  category: ProductCategory
  /** Boşsa (eski kayıtlar) 'limited' kabul edilir — bkz. resolveSaleMode(). */
  saleMode?: ProductSaleMode
  /** SADECE Daimi Envanter: boş = siparişe üretim, 0 = tükendi. */
  stockQuantity?: number | null
  /** Bağlı olduğu drop'un numarası (kart başlık şeridi için). */
  dropNo?: string | null
  compatibility?: ControlCompatibility[]
  priceTRY: number
  priceUSD: number
  /** OPSİYONEL — doluysa kartta priceTRY/priceUSD üstü çizili gösterilir. */
  discountPriceTRY?: number
  discountPriceUSD?: number
  photonOutput?: PhotonOutput
  isConfigurable: boolean
  name: LocalizedString[]
  shortDescription?: LocalizedString[]
  /** Site aydınlık moddayken gösterilir (Sanity'de 1. fotoğraf). */
  image?: SanityImage
  /** Site karanlık moddayken gösterilir (Sanity'de 2. fotoğraf). Boşsa `image`'a düşer. */
  imageDark?: SanityImage
  collection?: {
    key: { current: string }
    name: LocalizedString[]
  }
  /**
   * Sadece Montajlı Modelden OTOMATİK üretilen Daimi Envanter kartlarında
   * dolu: kart ürün sayfası yerine konfigüratörü bu model seçili açar,
   * fiyat "başlayan" fiyattır. Bkz. queries.ts → getModelStandingCards.
   */
  modelLink?: { collectionKey: string; modelId: string } | null
  /**
   * Sadece model kartlarında: varsayılan renklerle hazır tasarım ("Nesne
   * Talep Et" bunu doğrudan sepete ekler). Parçalardan biri renk
   * bulunamadıysa null (o zaman sadece "Özelleştir" gösterilir).
   */
  modelDefault?: {
    parts: Array<{ partId: string; materialId: string; priceTRY: number; priceUSD: number }>
    fixedTRY: number
    fixedUSD: number
    hardwareTRY: number
    hardwareUSD: number
    imageUrl: string | null
  } | null
}

export interface ProductConfiguratorPart {
  slotType: SlotType
  partId: string
  materialId: string
}

export interface Product extends ProductCard {
  vatIncluded: boolean
  configuratorCollection?: string // konfigüratördeki Collection.key (resolved)
  configuratorParts?: ProductConfiguratorPart[] // "Customize" preset kombinasyonu
  specs?: ProductSpec[]
  compatibility?: ControlCompatibility[]
  images?: SanityImage[]
  description?: LocalizedBlock[]
  seo?: SEOFields
  publishedAt: string
}

// ── Blog Post ─────────────────────────────────────────────

export type PostCategory = 'workshop' | 'design' | 'technology' | 'project'

export interface PostCard {
  _id: string
  slug: { current: string }
  documentRef?: string
  category?: PostCategory
  publishedAt: string
  author?: string
  title: LocalizedString[]
  excerpt?: LocalizedString[]
  coverImage?: SanityImage
}

export interface Post extends PostCard {
  body?: LocalizedBlock[]
  seo?: SEOFields
}

// ── Koleksiyon ────────────────────────────────────────────

export interface Collection {
  _id: string
  key: { current: string }
  name: LocalizedString[]
  description?: LocalizedString[]
  coverImage?: SanityImage
  hardwareBaseFeeTRY?: number
  hardwareBaseFeeUSD?: number
  iotFeeTRY?: number
  iotFeeUSD?: number
  /** Custom Registry'de eklenebilecek gövde sayısı (Sanity'de boşsa store varsayılanı kullanılır). */
  minBodyLayers?: number
  maxBodyLayers?: number
  /** Boşsa 'stack' (eski davranış). */
  layoutMode?: CollectionLayoutMode | null
  /** Sadece 'assembled': model zemine oturmaz, tavandan asılı gösterilir. */
  hangFromCeiling?: boolean | null
}

// ── Drop ──────────────────────────────────────────────────

export interface Drop {
  _id: string
  dropNo: string
  name: LocalizedString[]
  /**
   * Drop'un Custom Registry'deki koleksiyon key'i (Oluştur butonu için).
   * Önce Drop'ta elle seçilen koleksiyon, yoksa drop'un ürünlerinden
   * birinin configuratorCollection'ı. Hiçbiri yoksa null.
   */
  configuratorCollectionKey?: string | null
  /** Bu Drop'tan toplam kaç adet satılacağı — registryNo'nun paydası ve stok kontrolü için. */
  plannedQuantity?: number
}

export interface DropWithProducts extends Drop {
  products: ProductCard[]
  /** Bu Drop'tan Custom Registry ile satılmış (status: "owned") ürün sayısı. */
  soldCount: number
  /** Koleksiyonun taban×gövde×başlık varyant sayısının çarpımı — bkz. queries.ts'teki hesaplama notu. */
  totalCombinations: number
}

// ── Lamba Parçası (Konfigüratör) ──────────────────────────

export type SlotType = 'base' | 'body' | 'head'

export interface LampMaterial {
  materialId: string
  color: string
  roughness: number
  metalness: number
  priceModifierTRY: number
  priceModifierUSD: number
  label?: LocalizedString[]
  thumbnail?: string // URL
  isTranslucent?: boolean
  opacity?: number // 0–1, sadece isTranslucent true ise anlamlı
}

export interface LampPart {
  _id: string
  partId: string
  slotType: SlotType
  basePriceTRY: number
  basePriceUSD: number
  dimensions?: { width: number; height: number; depth: number }
  name: LocalizedString[]
  description?: LocalizedString[]
  modelUrl: string // Sanity asset URL (STL/GLB)
  thumbnail?: string // Sanity image URL — parça seçim grid'inde gösterilir
  materials: LampMaterial[]
  /** Sabit parça: müşteriye gösterilmez, her tasarımda otomatik görünür (ör. sarkıt kablosu). */
  isFixed?: boolean | null
  /** Sabit parçanın rengi (hex). */
  fixedColor?: string | null
  /** Sadece "Blender konumu" yerleşiminde: ortak orijinle aktarılmamış parçalar için düzeltme. */
  offsetMm?: { x?: number; y?: number; z?: number } | null
  rotationDeg?: { x?: number; y?: number; z?: number } | null
  /** Montajlı modelde: ışık açıkken bu parça parlar. */
  emitsLight?: boolean | null
}

/**
 * Montajlı Model (Sanity lampModel): kendi parça setiyle gelen ürün
 * (sarkıt, aplik, masa lambası). Müşteri modeli seçer, her sabit olmayan
 * parçanın rengini ayrı seçer.
 */
export interface LampModelDef {
  _id: string
  modelId: string
  name: LocalizedString[]
  thumbnail?: string | null
  /** Model Görselleri (ilki kartta). */
  images?: string[] | null
  parts: LampPart[]
}

/** Koleksiyonun 3D yerleşimi: üst üste istif ya da Blender'daki konum (ortak orijin). */
export type CollectionLayoutMode = 'stack' | 'assembled' | 'model'

// ── SEO ───────────────────────────────────────────────────

export interface SEOFields {
  metaTitle?: LocalizedString[]
  metaDescription?: LocalizedString[]
  ogImage?: SanityImage
}

// ── Sepet (client-side, Supabase'e yazılacak) ─────────────

export interface CartItem {
  id: string // Sanity product _id veya 'custom-{uuid}'
  type: 'product' | 'custom'
  registryNo: string
  name: { tr: string; en: string } // her iki dilde de isim saklanır (dil değişince güncel kalsın)
  priceTRY: number
  priceUSD: number
  /**
   * OPSİYONEL — sadece ürün sepete eklendiği an geçerli bir indirimi
   * varsa dolar. SADECE görüntüleme amaçlı (sepette üstü çizili eski
   * fiyat); priceTRY/priceUSD'nin kendisi zaten indirimli tutar — sepet
   * toplamı, checkout ve iyzico ödemesi hep priceTRY/priceUSD'yi kullanır.
   */
  originalPriceTRY?: number
  originalPriceUSD?: number
  quantity: number
  // Custom tasarım için ek alanlar
  customDesign?: {
    collectionKey: string
    parts: Array<{
      slotType: SlotType
      partId: string
      materialId: string
      priceTRY: number
      priceUSD: number
    }>
    snapshotUrl?: string // PNG export URL
  }
}

export interface CartState {
  items: CartItem[]
  total: number
  count: number
}

// ── Konfigüratör State ────────────────────────────────────

export interface ConfiguratorSlot {
  slotType: SlotType
  selectedPartId: string | null
  selectedMaterialId: string | null
}

export interface ConfiguratorState {
  collectionKey: string | null
  slots: {
    base: ConfiguratorSlot
    body: ConfiguratorSlot[]   // birden fazla body katmanı
    head: ConfiguratorSlot
  }
  lightColor: string           // hex renk kodu
  lightBrightness: number      // 0–1
  lightEnabled: boolean
  totalPrice: number
}
// ── Büro Bülteni ──────────────────────────────────────────

export type BulletinKind = 'drop' | 'inventory' | 'bureau' | 'notice'

export interface Bulletin {
  _id: string
  bulletinNo: number
  kind: BulletinKind
  publishedAt: string
  pinned?: boolean
  title: LocalizedString[]
  text?: LocalizedString[]
  /** Dil ön eki OLMADAN site içi yol (sorguda drop/ürün/yazı linkinden türetilir). Yoksa link yok. */
  href?: string | null
  /** Elle girilen etiket → değer satırları. */
  rows?: Array<{ label: LocalizedString[]; value: LocalizedString[] }> | null
  /** Link bir drop ise o drop'un canlı verisi — otomatik satırlar için. */
  drop?: {
    dropNo: string
    name: LocalizedString[]
    plannedQuantity?: number | null
    active?: boolean | null
    scheduledAt?: string | null
    soldCount: number
  } | null
}
