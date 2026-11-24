/**
 * src/lib/lightClasses.ts
 *
 * Aydınlatma "sınıfları" — Daimi Envanter'in dosya dolabı düzeni (bkz.
 * claude/DESIGN.md). Sanity şeması (product.category), Registry filtre
 * çubuğu, anasayfa sınıf indeksi ve ürün kartı AYNI listeyi buradan okur;
 * yeni bir sınıf eklerken SADECE burayı güncelleyin.
 *
 * `value` Sanity'de saklanan değerdir — mevcut kayıtlar bozulmasın diye
 * eski değerler (pendant/wall/desk/floor/strip) korunuyor.
 *
 * SAF modül: hem sunucu hem istemci hem Sanity Studio import edebilir.
 */

export type LightClassValue = 'floor' | 'wall' | 'desk' | 'pendant' | 'strip'

export interface LightClass {
  value: LightClassValue
  /**
   * Sınıf harfi = anasayfa dizinindeki KLAVYE KISAYOLU (A Drops, S/D/F/G…)
   * ve envanter kodundaki harf: ENV-S-012. Sol el ana sırası.
   */
  code: string
  tr: string
  en: string
  /** Tek cümlelik, büro dilinde ama anlaşılır tanım. */
  descTr: string
  descEn: string
}

export const LIGHT_CLASSES: LightClass[] = [
  {
    value: 'floor',
    code: 'S',
    tr: 'Lambader',
    en: 'Floor Lamp',
    descTr: 'Zemine yerleşik, ayakta duran aydınlatma nesneleri.',
    descEn: 'Free-standing lighting objects placed on the floor.',
  },
  {
    value: 'wall',
    code: 'D',
    tr: 'Aplik',
    en: 'Wall Sconce',
    descTr: 'Duvara monte edilen yönlendirilmiş ışık birimleri.',
    descEn: 'Wall-mounted units for directed light.',
  },
  {
    value: 'desk',
    code: 'F',
    tr: 'Masa Lambası',
    en: 'Table Lamp',
    descTr: 'Masa ve komodin yüzeyleri için çalışma ve ortam ışığı.',
    descEn: 'Task and ambient light for desks and bedside tables.',
  },
  {
    value: 'pendant',
    code: 'G',
    tr: 'Sarkıt',
    en: 'Pendant',
    descTr: 'Tek noktadan sarkan, odaklı tavan aydınlatması.',
    descEn: 'Focused ceiling light hanging from a single point.',
  },
  {
    value: 'strip',
    code: 'H',
    tr: 'Şerit',
    en: 'Strip',
    descTr: 'Gizli ve doğrusal ışık elemanları.',
    descEn: 'Concealed, linear light elements.',
  },
]

export function getLightClass(value: string | null | undefined): LightClass | undefined {
  return LIGHT_CLASSES.find((c) => c.value === value)
}

export function lightClassName(value: string | null | undefined, locale: string): string {
  const c = getLightClass(value)
  if (!c) return value ?? '—'
  return locale === 'tr' ? c.tr : c.en
}

// ── Satış rejimi ─────────────────────────────────────────────

/** `limited` = Sınırlı Tahsis (drop / numaralı adet), `standing` = Daimi Envanter (sürekli satış). */
export type SaleMode = 'limited' | 'standing'

/** Alan boşsa (eski kayıtlar) ürün Sınırlı Tahsis kabul edilir. */
export function resolveSaleMode(value: string | null | undefined): SaleMode {
  return value === 'standing' ? 'standing' : 'limited'
}

export type StockState = 'in-stock' | 'made-to-order' | 'out-of-stock'

/**
 * Daimi Envanter stok durumu: `stockQuantity` boşsa siparişe üretim
 * (sınırsız), 0 veya altıysa tükendi, aksi halde stokta.
 */
export function resolveStockState(stockQuantity: number | null | undefined): StockState {
  if (stockQuantity === null || stockQuantity === undefined) return 'made-to-order'
  return stockQuantity > 0 ? 'in-stock' : 'out-of-stock'
}

/**
 * Bir ürün sepete eklenebilir mi? Hizmet dışı (decommissioned) ve
 * Custom Registry'den satılmış (owned — artık birine ait tek adet)
 * ürünler ile stoğu tükenmiş Daimi Envanter ürünleri satın alınamaz.
 */
export function isProductPurchasable(p: {
  status?: string | null
  saleMode?: string | null
  stockQuantity?: number | null
}): boolean {
  if (p.status === 'decommissioned' || p.status === 'owned') return false
  if (resolveSaleMode(p.saleMode) === 'standing' && resolveStockState(p.stockQuantity) === 'out-of-stock') return false
  return true
}
