import { resolveDropState } from '@/lib/dropSchedule'
import { sanityClient } from './sanity'
import type { LampModelDef, ProductCard } from '@/types'

// ── Fragment'lar (tekrar kullanılan GROQ parçaları) ───────

const IMAGE_FRAGMENT = `
  asset->{ _id, url, metadata { dimensions, lqip } },
  alt,
  hotspot,
  crop
`

const LOCALIZED_FIELD = (name: string) => `
  ${name}[]{ locale, value }
`

const PRODUCT_CARD_FRAGMENT = `
  ownerDisplayName,
  ownerCity,
  ownerUserId,
  _id,
  registryNo,
  slug,
  status,
  category,
  saleMode,
  stockQuantity,
  "dropNo": drop->dropNo,
  compatibility,
  priceTRY,
  priceUSD,
  discountPriceTRY,
  discountPriceUSD,
  photonOutput,
  isConfigurable,
  ${LOCALIZED_FIELD('name')},
  ${LOCALIZED_FIELD('shortDescription')},
  "image": images[0]{
    ${IMAGE_FRAGMENT}
  },
  "imageDark": images[1]{
    ${IMAGE_FRAGMENT}
  },
  collection->{ key, ${LOCALIZED_FIELD('name')} }
`

const PRODUCT_FULL_FRAGMENT = `
  ${PRODUCT_CARD_FRAGMENT},
  vatIncluded,
  "configuratorCollection": configuratorCollection->key.current,
  configuratorParts[]{
    slotType,
    "partId": part->partId.current,
    "materialId": material->materialId.current
  },
  specs[]{key, value},
  compatibility,
  images[]{${IMAGE_FRAGMENT}},
  ${LOCALIZED_FIELD('description')},
  seo{
    ${LOCALIZED_FIELD('metaTitle')},
    ${LOCALIZED_FIELD('metaDescription')},
    ogImage{${IMAGE_FRAGMENT}}
  },
  publishedAt
`

const POST_CARD_FRAGMENT = `
  _id,
  slug,
  documentRef,
  category,
  publishedAt,
  author,
  ${LOCALIZED_FIELD('title')},
  ${LOCALIZED_FIELD('excerpt')},
  "coverImage": coverImage{${IMAGE_FRAGMENT}}
`

const POST_FULL_FRAGMENT = `
  ${POST_CARD_FRAGMENT},
  body[]{
    locale,
    value[]{
      ...,
      _type == "image" => {
        asset->{ _id, url, metadata { dimensions } },
        alt,
        caption
      }
    }
  },
  seo{
    ${LOCALIZED_FIELD('metaTitle')},
    ${LOCALIZED_FIELD('metaDescription')},
    ogImage{${IMAGE_FRAGMENT}}
  }
`

// ── Ürün Sorguları ────────────────────────────────────────

export async function getAllProducts(filters?: {
  category?: string
  status?: string
  photonOutput?: string
  compatibility?: string
  minPrice?: number
  maxPrice?: number
  drop?: string
  /** 'limited' = Sınırlı Tahsis (alan boş olanlar dahil), 'standing' = Daimi Envanter */
  mode?: string
}) {
  // active != false → alan boşsa (eski kayıtlar) da GÖRÜNÜR kabul edilir.
  let filter = `_type == "product" && active != false`
  const params: Record<string, string | number> = {}

  if (filters?.category) {
    filter += ` && category == $category`
    params.category = filters.category
  }
  if (filters?.status) {
    filter += ` && status == $status`
    params.status = filters.status
  }
  if (filters?.photonOutput) {
    filter += ` && photonOutput == $photonOutput`
    params.photonOutput = filters.photonOutput
  }
  if (filters?.compatibility) {
    filter += ` && $compatibility in compatibility`
    params.compatibility = filters.compatibility
  }
  if (filters?.minPrice !== undefined) {
    // Fiyat filtresi her zaman TRY üzerinden çalışır (ana kaynak para birimi)
    filter += ` && priceTRY >= $minPrice`
    params.minPrice = filters.minPrice
  }
  if (filters?.maxPrice !== undefined) {
    filter += ` && priceTRY <= $maxPrice`
    params.maxPrice = filters.maxPrice
  }
  if (filters?.drop) {
    filter += ` && drop->dropNo == $drop`
    params.drop = filters.drop
  }
  if (filters?.mode === 'standing') {
    filter += ` && saleMode == "standing"`
  } else if (filters?.mode === 'limited') {
    filter += ` && saleMode != "standing"`
  }

  const rows = await sanityClient.fetch(
    `*[${filter}] | order(coalesce(priority, 999999) asc, registryNo asc) {${PRODUCT_CARD_FRAGMENT}, "_dropActive": drop->active, "_dropScheduledAt": drop->scheduledAt, "_hasDrop": defined(drop)}`,
    params,
    { next: { tags: ['products'] } }
  )
  // Henüz yayınlanmamış ("yakında") bir Drop'a bağlı ürünler Registry
  // listesinde de görünmesin.
  const now = Date.now()
  return rows
    .filter(
      (r: { _hasDrop?: boolean; _dropActive?: boolean | null; _dropScheduledAt?: string | null }) =>
        !r._hasDrop || resolveDropState(r._dropActive, r._dropScheduledAt, now) !== 'upcoming'
    )
    .map((r: Record<string, unknown>) => {
      const { _dropActive, _dropScheduledAt, _hasDrop, ...rest } = r
      void _dropActive; void _dropScheduledAt; void _hasDrop
      return rest
    })
}

export async function getProductBySlug(slug: string) {
  return sanityClient.fetch(
    `*[_type == "product" && active != false && slug.current == $slug][0] {${PRODUCT_FULL_FRAGMENT}}`,
    { slug },
    { next: { tags: [`product-${slug}`] } }
  )
}

// Ürün kimlik sayfası (dossier) için — sipariş kaleminde saklanan
// sanity_product_id üzerinden ürünü çeker (görsel + specs + net ağırlık vb.)
export async function getProductById(id: string) {
  return sanityClient.fetch(
    `*[_type == "product" && _id == $id][0] {
      ${PRODUCT_FULL_FRAGMENT},
      netWeightKg,
      firmwareVersion,
      assetSubtype
    }`,
    { id },
    { next: { tags: [`product-id-${id}`] } }
  )
}

export async function getRelatedProducts(category: string, excludeSlug: string, limit = 4) {
  return sanityClient.fetch(
    `*[_type == "product" && active != false && category == $category && slug.current != $excludeSlug]
      | order(publishedAt desc) [0...$limit] {${PRODUCT_CARD_FRAGMENT}}`,
    { category, excludeSlug, limit },
    { next: { tags: ['products'] } }
  )
}

export async function getProductCount(): Promise<number> {
  return sanityClient.fetch(
    `count(*[_type == "product" && active != false])`,
    {},
    { next: { tags: ['products'] } }
  )
}

export async function getFeaturedProducts(limit = 4) {
  return sanityClient.fetch(
    `*[_type == "product" && active != false && status == "certified"] | order(publishedAt desc) [0...$limit] {${PRODUCT_CARD_FRAGMENT}}`,
    { limit },
    { next: { tags: ['products'] } }
  )
}

// ── Blog Sorguları ────────────────────────────────────────

export async function getAllPosts(limit?: number) {
  const limitClause = limit ? `[0...${limit}]` : ''
  return sanityClient.fetch(
    `*[_type == "post"] | order(publishedAt desc) ${limitClause} {${POST_CARD_FRAGMENT}}`,
    {},
    { next: { tags: ['posts'] } }
  )
}

export async function getPostBySlug(slug: string) {
  return sanityClient.fetch(
    `*[_type == "post" && slug.current == $slug][0] {${POST_FULL_FRAGMENT}}`,
    { slug },
    { next: { tags: [`post-${slug}`] } }
  )
}

export async function getFeaturedPosts(limit = 3) {
  return sanityClient.fetch(
    `*[_type == "post" && featured == true] | order(publishedAt desc) [0...$limit] {${POST_CARD_FRAGMENT}}`,
    { limit },
    { next: { tags: ['posts'] } }
  )
}

// ── Drop Sorguları ────────────────────────────────────────
// NOT (Donanım Tahsisi/IoT): getAllCollections / getAllLampCollections
// artık her ücret alanını `coalesce(drop override, koleksiyon değeri)`
// olarak döndürüyor — yani bir Drop kendi koleksiyonunun ücretini
// (dolu alanlar için) ezebilir; alan adları değişmediği için
// konfigüratör tarafında ek değişiklik gerekmez.

// Anasayfadaki Drop satırları için: her drop'u, ona ait ürünlerle
// (ProductCard bilgisiyle) birlikte, TEK sorguda getirir. Ürünü olmayan
// drop'lar da döner — anasayfa bileşeni bunları (boş satır göstermemek
// için) kendi filtreler.
export async function getAllDropsWithProducts() {
  const drops = await sanityClient.fetch(
    `*[_type == "drop" && (active != false || defined(scheduledAt))] | order(sortOrder asc) {
      _id,
      dropNo,
      active,
      scheduledAt,
      plannedQuantity,
      ${LOCALIZED_FIELD('name')},
      "configuratorCollectionKey": coalesce(
        collection->key.current,
        *[_type == "product" && references(^._id) && defined(configuratorCollection)][0].configuratorCollection->key.current
      ),
      // Bu Drop'tan Custom Registry ile satılmış (status: "owned") ürün
      // sayısı — "kaç adet satışta kaldı" göstergesi için (plannedQuantity
      // - soldCount). SADECE "owned" sayılıyor, Drop'a elle eklenmiş
      // standart (satışa açık) ürünler stoktan düşmüyor.
      "soldCount": count(*[_type == "product" && references(^._id) && status == "owned"]),
      "products": *[_type == "product" && active != false && references(^._id)] | order(coalesce(priority, 999999) asc, registryNo asc) {${PRODUCT_CARD_FRAGMENT}}
    }`,
    {},
    { next: { tags: ['drops', 'products'] } }
  )

  // "XXX Different Combinations" — koleksiyonun taban/gövde/başlık
  // parça+malzeme kataloğundan hesaplanıyor. VARSAYIM/BASİTLEŞTİRME:
  // gövdenin çok katmanlı istiflenebilmesi (sıra önemli, tekrar serbest)
  // yüzünden GERÇEK tüm olası tasarım sayısı matematiksel olarak
  // astronomik büyüklükte olurdu (anlamlı bir "XXX kombinasyon" rakamı
  // olmaz) — bu yüzden gövdeyi de TEK bir seçim gibi sayıyoruz:
  //   taban_varyant_sayısı × gövde_varyant_sayısı × başlık_varyant_sayısı
  // (varyant = o slottaki tüm parçaların malzeme sayılarının TOPLAMI).
  const comboCache = new Map<string, number>()
  async function getCombinationCount(collectionKey: string): Promise<number> {
    if (comboCache.has(collectionKey)) return comboCache.get(collectionKey)!
    const rows = await sanityClient.fetch<Array<{ slotType: string; materialCount: number }>>(
      `*[_type == "lampPart" && isFixed != true && $collectionKey in collections[]->key.current]{
        slotType,
        "materialCount": ${MATERIALS_COUNT}
      }`,
      { collectionKey }
    )
    const bySlot: Record<string, number> = {}
    for (const row of rows) {
      bySlot[row.slotType] = (bySlot[row.slotType] ?? 0) + (row.materialCount ?? 0)
    }
    const base = bySlot.base ?? 0
    const body = bySlot.body ?? 0
    const head = bySlot.head ?? 0
    // Herhangi bir slot boşsa (ör. henüz başlık parçası girilmemiş)
    // anlamlı bir rakam olmaz — 0 döndürüp arayüzde gizletiyoruz.
    let total = base > 0 && body > 0 && head > 0 ? base * body * head : 0
    if (total === 0) {
      // Montajlı model koleksiyonu: her modelde, sabit olmayan parçaların
      // malzeme sayılarının ÇARPIMI; modeller arasında TOPLAM.
      const models = await sanityClient.fetch<Array<{ counts: Array<{ c: number | null }> | null }>>(
        `*[_type == "lampModel" && active != false && collection->key.current == $collectionKey]{
          "counts": parts[]->[isFixed != true]{ "c": ${MATERIALS_COUNT} }
        }`,
        { collectionKey }
      )
      total = models.reduce((sum, m) => {
        const counts = (m.counts ?? []).map((x) => x?.c).filter((c): c is number => typeof c === 'number' && c > 0)
        return counts.length > 0 ? sum + counts.reduce((a, b) => a * b, 1) : sum
      }, 0)
    }
    comboCache.set(collectionKey, total)
    return total
  }

  // Zamana bağlı durum — Sanity sonucu cache'lense bile BURADA, her istekte
  // hesaplanıyor (bkz. lib/dropSchedule.ts).
  const now = Date.now()
  const withState = await Promise.all(
    drops.map(
      async (drop: {
        configuratorCollectionKey: string | null
        active?: boolean | null
        scheduledAt?: string | null
        products: unknown[]
      }) => {
        const dropState = resolveDropState(drop.active, drop.scheduledAt, now)
        return {
          ...drop,
          dropState,
          // "Yakında" Drop'un ürünleri istemciye HİÇ gönderilmez (sızmasın).
          products: dropState === 'upcoming' ? [] : drop.products,
          totalCombinations: drop.configuratorCollectionKey
            ? await getCombinationCount(drop.configuratorCollectionKey)
            : 0,
        }
      }
    )
  )
  return withState.filter((d) => d.dropState !== 'hidden')
}

// ── Daimi Envanter (sürekli satış) ────────────────────────
// Anasayfadaki dosya dolabı (sınıf indeksi) + seçili ürünler grid'i için
// TÜM aktif Daimi Envanter ürünlerini tek sorguda getirir; sınıflara
// gruplama/sayım sayfa tarafında yapılır (ürün sayısı küçük).
export async function getStandingInventory() {
  return sanityClient.fetch(
    `*[_type == "product" && active != false && saleMode == "standing"] | order(coalesce(priority, 999999) asc, registryNo asc) {${PRODUCT_CARD_FRAGMENT}}`,
    {},
    { next: { tags: ['products'] } }
  )
}

/**
 * Montajlı Modellerden OTOMATİK Daimi Envanter kartları — Studio'da her
 * model için ayrıca ürün belgesi açmak gerekmesin diye. Bir ürün belgesi
 * modele bağlıysa (product.linkedModel) o modelin kartı üretilmez.
 * Fiyat = parça taban fiyatları + koleksiyonun donanım taban ücreti
 * ("…'den başlayan"; renk farkları ve IoT hariç).
 */
export async function getModelStandingCards(): Promise<ProductCard[]> {
  return sanityClient.fetch(
    `*[_type == "lampModel" && active != false && defined(key.current)
        && collection->layoutMode == "model" && collection->active != false
        && count(*[_type == "product" && active != false && linkedModel._ref == ^._id]) == 0
      ] | order(collection->sortOrder asc, sortOrder asc) {
      "_id": "model-" + _id,
      "registryNo": upper(key.current),
      "slug": { "current": key.current },
      "status": "certified",
      "category": coalesce(collection->productClass, "pendant"),
      "saleMode": "standing",
      "stockQuantity": null,
      "priceTRY": math::sum(parts[]->basePriceTRY) + coalesce(collection->hardwareBaseFeeTRY, 0),
      "priceUSD": math::sum(parts[]->basePriceUSD) + coalesce(collection->hardwareBaseFeeUSD, 0),
      "isConfigurable": false,
      ${LOCALIZED_FIELD('name')},
      "image": coalesce(images[0], thumbnail){
        ${IMAGE_FRAGMENT}
      },
      "collection": collection->{ key, ${LOCALIZED_FIELD('name')} },
      "modelLink": { "collectionKey": collection->key.current, "modelId": key.current }
    }`,
    {},
    { next: { tags: ['products', 'configurator-collections'] } }
  )
}

// ── Büro Bülteni ──────────────────────────────────────────
// Link, türüne göre site içi bir yola çevrilir (dil ön eki yok — next-intl
// Link'i ekler). Drop linki anasayfadaki drop satırına (#drop-NNN) gider.
const BULLETIN_FRAGMENT = `
  _id,
  bulletinNo,
  kind,
  publishedAt,
  pinned,
  ${LOCALIZED_FIELD('title')},
  ${LOCALIZED_FIELD('text')},
  rows[]{ ${LOCALIZED_FIELD('label')}, ${LOCALIZED_FIELD('value')} },
  "drop": select(linkType == "drop" && defined(linkDrop) => linkDrop->{
    dropNo,
    ${LOCALIZED_FIELD('name')},
    plannedQuantity,
    active,
    scheduledAt,
    "soldCount": count(*[_type == "product" && references(^._id) && status == "owned"])
  }),
  "href": select(
    linkType == "drop" && defined(linkDrop) => "/#drop-" + linkDrop->dropNo,
    linkType == "product" && defined(linkProduct) => "/registry/" + linkProduct->slug.current,
    linkType == "post" && defined(linkPost) => "/archive/" + linkPost->slug.current,
    linkType == "path" && defined(linkPath) => linkPath,
    null
  )
`

/** Anasayfa paneli: yayın tarihi gelmiş, panelde gösterilecek bültenler — sabitlenenler önce, sonra yeniden eskiye. */
export async function getPanelBulletins(limit = 8) {
  return sanityClient.fetch(
    `*[_type == "bulletin" && showInPanel != false && publishedAt <= now()] | order(coalesce(pinned, false) desc, publishedAt desc)[0...$limit]{${BULLETIN_FRAGMENT}}`,
    { limit },
    { next: { tags: ['bulletins'], revalidate: 300 } }
  )
}

/** /bulletin arşivi: yayın tarihi gelmiş TÜM bültenler, yeniden eskiye. */
export async function getAllBulletins() {
  return sanityClient.fetch(
    `*[_type == "bulletin" && publishedAt <= now()] | order(publishedAt desc){${BULLETIN_FRAGMENT}}`,
    {},
    { next: { tags: ['bulletins'], revalidate: 300 } }
  )
}

// ── Koleksiyon Sorguları ──────────────────────────────────

export async function getAllCollections() {
  return sanityClient.fetch(
    `*[_type == "collection"] | order(sortOrder asc) {
      _id,
      key,
      ${LOCALIZED_FIELD('name')},
      ${LOCALIZED_FIELD('description')},
      "coverImage": coverImage{${IMAGE_FRAGMENT}},
      "hardwareBaseFeeTRY": coalesce(*[_type == "drop" && collection._ref == ^._id && defined(hardwareBaseFeeTRY)] | order(sortOrder desc)[0].hardwareBaseFeeTRY, hardwareBaseFeeTRY),
      "hardwareBaseFeeUSD": coalesce(*[_type == "drop" && collection._ref == ^._id && defined(hardwareBaseFeeUSD)] | order(sortOrder desc)[0].hardwareBaseFeeUSD, hardwareBaseFeeUSD),
      "iotFeeTRY": coalesce(*[_type == "drop" && collection._ref == ^._id && defined(iotFeeTRY)] | order(sortOrder desc)[0].iotFeeTRY, iotFeeTRY),
      "iotFeeUSD": coalesce(*[_type == "drop" && collection._ref == ^._id && defined(iotFeeUSD)] | order(sortOrder desc)[0].iotFeeUSD, iotFeeUSD),
      minBodyLayers,
      maxBodyLayers,
      layoutMode,
      hangFromCeiling
    }`,
    {},
    { next: { tags: ['collections'] } }
  )
}

// ── Konfigüratör Sorguları ────────────────────────────────

// Parçanın renkleri: "tüm renkler" modunda Studio'daki TÜM malzemeler
// (hariç tutulanlar dışında, yeni eklenenler otomatik), aksi halde elle
// seçilen liste. Modu boş eski parçalar: listesi boşsa "tüm renkler".
// (Studio tarafındaki karşılığı: lampPart.ts → isAllMaterialsDoc)
export const MATERIALS_ALL_COND = `(materialMode == "all" || (!defined(materialMode) && count(coalesce(materials, [])) == 0))`
const MATERIALS_COUNT = `select(${MATERIALS_ALL_COND} => count(*[_type == "material" && !(_id in coalesce(^.excludedMaterials[]._ref, []))]), count(materials))`

const MATERIAL_PROJECTION = `
  "materialId": materialId.current,
  color,
  roughness,
  metalness,
  priceModifierTRY,
  priceModifierUSD,
  isTranslucent,
  opacity,
  ${LOCALIZED_FIELD('label')},
  "thumbnail": thumbnail.asset->url
`

// Konfigüratör parçasının ortak projeksiyonu (slot parçaları ve
// Montajlı Model parçaları aynı alanları kullanır).
const LAMP_PART_PROJECTION = `
  _id,
  "partId": partId.current,
  slotType,
  basePriceTRY,
  basePriceUSD,
  dimensions,
  ${LOCALIZED_FIELD('name')},
  ${LOCALIZED_FIELD('description')},
  "modelUrl": modelFile.asset->url,
  "thumbnail": thumbnail.asset->url,
  isFixed,
  fixedColor,
  offsetMm,
  rotationDeg,
  emitsLight,
  "materials": select(
    ${MATERIALS_ALL_COND} => *[_type == "material" && !(_id in coalesce(^.excludedMaterials[]._ref, []))] | order(sortOrder asc) {${MATERIAL_PROJECTION}},
    materials[]->{${MATERIAL_PROJECTION}}
  )
`

export async function getLampPartsByCollection(collectionKey: string) {
  return sanityClient.fetch(
    `*[_type == "lampPart" && $collectionKey in collections[]->key.current]
      | order(slotType asc, sortOrder asc) {${LAMP_PART_PROJECTION}}`,
    { collectionKey },
    { next: { tags: [`configurator-${collectionKey}`] } }
  )
}

/** "Montajlı model" koleksiyonlarının modelleri (her biri kendi parça setiyle). */
export async function getLampModelsByCollection(collectionKey: string): Promise<LampModelDef[]> {
  return sanityClient.fetch(
    `*[_type == "lampModel" && active != false && collection->key.current == $collectionKey]
      | order(sortOrder asc) {
        _id,
        "modelId": key.current,
        ${LOCALIZED_FIELD('name')},
        "images": images[].asset->url,
        "thumbnail": coalesce(images[0].asset->url, thumbnail.asset->url),
        "parts": parts[]->{${LAMP_PART_PROJECTION}}
      }`,
    { collectionKey },
    { next: { tags: [`configurator-${collectionKey}`] } }
  )
}

export async function getAllLampCollections() {
  return sanityClient.fetch(
    `*[_type == "collection" && active != false && count(*[(_type == "lampPart" || (_type == "lampModel" && active != false)) && references(^._id)]) > 0]
      | order(sortOrder asc) {
        _id,
        key,
        ${LOCALIZED_FIELD('name')},
        ${LOCALIZED_FIELD('description')},
        "coverImage": coverImage{${IMAGE_FRAGMENT}},
        "hardwareBaseFeeTRY": coalesce(*[_type == "drop" && collection._ref == ^._id && defined(hardwareBaseFeeTRY)] | order(sortOrder desc)[0].hardwareBaseFeeTRY, hardwareBaseFeeTRY),
        "hardwareBaseFeeUSD": coalesce(*[_type == "drop" && collection._ref == ^._id && defined(hardwareBaseFeeUSD)] | order(sortOrder desc)[0].hardwareBaseFeeUSD, hardwareBaseFeeUSD),
        "iotFeeTRY": coalesce(*[_type == "drop" && collection._ref == ^._id && defined(iotFeeTRY)] | order(sortOrder desc)[0].iotFeeTRY, iotFeeTRY),
        "iotFeeUSD": coalesce(*[_type == "drop" && collection._ref == ^._id && defined(iotFeeUSD)] | order(sortOrder desc)[0].iotFeeUSD, iotFeeUSD),
        minBodyLayers,
        maxBodyLayers,
        layoutMode,
        hangFromCeiling
      }`,
    {},
    { next: { tags: ['configurator-collections'] } }
  )
}

// ── Sitemap Sorguları ─────────────────────────────────────

export async function getAllProductSlugs(): Promise<Array<{ slug: { current: string }; _updatedAt: string }>> {
  return sanityClient.fetch(
    `*[_type == "product" && active != false]{ slug, _updatedAt }`,
    {},
    { next: { revalidate: 3600 } }
  )
}

export async function getAllPostSlugs(): Promise<Array<{ slug: { current: string }; _updatedAt: string }>> {
  return sanityClient.fetch(
    `*[_type == "post"]{ slug, _updatedAt }`,
    {},
    { next: { revalidate: 3600 } }
  )
}