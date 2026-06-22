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

export type ProductStatus = 'certified' | 'limited' | 'decommissioned'

export type ProductCategory = 'pendant' | 'wall' | 'desk' | 'floor' | 'strip'

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
  category: ProductCategory
  priceTRY: number
  priceUSD: number
  photonOutput?: PhotonOutput
  name: LocalizedString[]
  shortDescription?: LocalizedString[]
  image?: SanityImage
  collection?: {
    key: { current: string }
    name: LocalizedString[]
  }
}

export interface Product extends ProductCard {
  vatIncluded: boolean
  isConfigurable: boolean
  configuratorCollection?: string
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
}

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
