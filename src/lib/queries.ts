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
  _id,
  registryNo,
  slug,
  status,
  category,
  priceTRY,
  priceUSD,
  photonOutput,
  ${LOCALIZED_FIELD('name')},
  ${LOCALIZED_FIELD('shortDescription')},
  "image": images[0]{
    ${IMAGE_FRAGMENT}
  },
  collection->{ key, ${LOCALIZED_FIELD('name')} }
`

const PRODUCT_FULL_FRAGMENT = `
  ${PRODUCT_CARD_FRAGMENT},
  vatIncluded,
  isConfigurable,
  configuratorCollection,
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
}) {
  let filter = `_type == "product"`
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

  return sanityClient.fetch(
    `*[${filter}] | order(registryNo asc) {${PRODUCT_CARD_FRAGMENT}}`,
    params,
    { next: { tags: ['products'] } }
  )
}

export async function getProductBySlug(slug: string) {
  return sanityClient.fetch(
    `*[_type == "product" && slug.current == $slug][0] {${PRODUCT_FULL_FRAGMENT}}`,
    { slug },
    { next: { tags: [`product-${slug}`] } }
  )
}

export async function getRelatedProducts(category: string, excludeSlug: string, limit = 4) {
  return sanityClient.fetch(
    `*[_type == "product" && category == $category && slug.current != $excludeSlug]
      | order(publishedAt desc) [0...$limit] {${PRODUCT_CARD_FRAGMENT}}`,
    { category, excludeSlug, limit },
    { next: { tags: ['products'] } }
  )
}

export async function getProductCount(): Promise<number> {
  return sanityClient.fetch(
    `count(*[_type == "product"])`,
    {},
    { next: { tags: ['products'] } }
  )
}

export async function getFeaturedProducts(limit = 4) {
  return sanityClient.fetch(
    `*[_type == "product" && status == "certified"] | order(publishedAt desc) [0...$limit] {${PRODUCT_CARD_FRAGMENT}}`,
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

// ── Koleksiyon Sorguları ──────────────────────────────────

export async function getAllCollections() {
  return sanityClient.fetch(
    `*[_type == "collection"] | order(sortOrder asc) {
      _id,
      key,
      ${LOCALIZED_FIELD('name')},
      ${LOCALIZED_FIELD('description')},
      "coverImage": coverImage{${IMAGE_FRAGMENT}}
    }`,
    {},
    { next: { tags: ['collections'] } }
  )
}

// ── Konfigüratör Sorguları ────────────────────────────────

export async function getLampPartsByCollection(collectionKey: string) {
  return sanityClient.fetch(
    `*[_type == "lampPart" && collection->key.current == $collectionKey]
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
        materials[]{
          materialId,
          color,
          roughness,
          metalness,
          priceModifierTRY,
          priceModifierUSD,
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
    `*[_type == "collection" && count(*[_type == "lampPart" && references(^._id)]) > 0]
      | order(sortOrder asc) {
        _id,
        key,
        ${LOCALIZED_FIELD('name')},
        ${LOCALIZED_FIELD('description')},
        "coverImage": coverImage{${IMAGE_FRAGMENT}}
      }`,
    {},
    { next: { tags: ['configurator-collections'] } }
  )
}

// ── Sitemap Sorguları ─────────────────────────────────────

export async function getAllProductSlugs(): Promise<Array<{ slug: { current: string }; _updatedAt: string }>> {
  return sanityClient.fetch(
    `*[_type == "product"]{ slug, _updatedAt }`,
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
