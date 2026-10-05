import { sanityClient } from './sanity'

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

  return sanityClient.fetch(
    `*[${filter}] | order(registryNo asc) {${PRODUCT_CARD_FRAGMENT}}`,
    params,
    { next: { tags: ['products'] } }
  )
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

// Anasayfadaki Drop satırları için: her drop'u, ona ait ürünlerle
// (ProductCard bilgisiyle) birlikte, TEK sorguda getirir. Ürünü olmayan
// drop'lar da döner — anasayfa bileşeni bunları (boş satır göstermemek
// için) kendi filtreler.
export async function getAllDropsWithProducts() {
  const drops = await sanityClient.fetch(
    `*[_type == "drop" && active != false] | order(sortOrder asc) {
      _id,
      dropNo,
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
      "products": *[_type == "product" && active != false && references(^._id)] | order(registryNo asc) {${PRODUCT_CARD_FRAGMENT}}
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
      `*[_type == "lampPart" && $collectionKey in collections[]->key.current]{
        slotType,
        "materialCount": count(materials)
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
    const total = base > 0 && body > 0 && head > 0 ? base * body * head : 0
    comboCache.set(collectionKey, total)
    return total
  }

  return Promise.all(
    drops.map(async (drop: { configuratorCollectionKey: string | null }) => ({
      ...drop,
      totalCombinations: drop.configuratorCollectionKey
        ? await getCombinationCount(drop.configuratorCollectionKey)
        : 0,
    }))
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
      hardwareBaseFeeTRY,
      hardwareBaseFeeUSD,
      iotFeeTRY,
      iotFeeUSD,
      minBodyLayers,
      maxBodyLayers
    }`,
    {},
    { next: { tags: ['collections'] } }
  )
}

// ── Konfigüratör Sorguları ────────────────────────────────

export async function getLampPartsByCollection(collectionKey: string) {
  return sanityClient.fetch(
    `*[_type == "lampPart" && $collectionKey in collections[]->key.current]
      | order(slotType asc, sortOrder asc) {
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
        materials[]->{
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
        }
      }`,
    { collectionKey },
    { next: { tags: [`configurator-${collectionKey}`] } }
  )
}

export async function getAllLampCollections() {
  return sanityClient.fetch(
    `*[_type == "collection" && active != false && count(*[_type == "lampPart" && references(^._id)]) > 0]
      | order(sortOrder asc) {
        _id,
        key,
        ${LOCALIZED_FIELD('name')},
        ${LOCALIZED_FIELD('description')},
        "coverImage": coverImage{${IMAGE_FRAGMENT}},
        hardwareBaseFeeTRY,
        hardwareBaseFeeUSD,
        iotFeeTRY,
        iotFeeUSD,
        minBodyLayers,
        maxBodyLayers
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