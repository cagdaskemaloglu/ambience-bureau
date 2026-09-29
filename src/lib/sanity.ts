import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? '2024-01-01'

// Public read-only client (Next.js server components için)
export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: process.env.NODE_ENV === 'production', // prod'da CDN, dev'de live
})

// Mutasyon için (sadece server-side, service token ile)
export const sanityAdminClient = createClient({
  projectId,
  dataset,
  apiVersion,
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

// Image URL builder
const builder = imageUrlBuilder(sanityClient)

export function urlFor(source: SanityImageSource) {
  return builder.image(source)
}

// Locale helper: Sanity'deki locale-array'den doğru dil değerini çeker
export function getLocalizedValue<T = string>(
  arr: Array<{ locale: string; value: T }> | undefined | null,
  locale: string,
  fallback: T | undefined = undefined
): T | undefined {
  if (!arr || arr.length === 0) return fallback
  return (
    arr.find((item) => item.locale === locale)?.value ??
    arr.find((item) => item.locale === 'en')?.value ?? // EN fallback
    arr[0]?.value ??
    fallback
  )
}

// Para birimi formatlama
export function formatPrice(price: number, currency = 'TRY', locale = 'tr-TR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

/**
 * Locale'e göre doğru fiyat alanını ve para birimini seçer.
 * TR locale → priceTRY + "TRY", diğer her locale → priceUSD + "USD".
 * Otomatik kur çevrimi YOK — her iki fiyat Sanity'de elle girilir.
 */
export function getPriceForLocale(
  product: { priceTRY: number; priceUSD: number },
  locale: string
): { amount: number; currency: 'TRY' | 'USD' } {
  if (locale === 'tr') {
    return { amount: product.priceTRY, currency: 'TRY' }
  }
  return { amount: product.priceUSD, currency: 'USD' }
}

/**
 * Locale'e göre fiyatı doğrudan formatlanmış string olarak döndürür.
 * Kısayol: formatPrice + getPriceForLocale birleşimi.
 */
export function formatPriceForLocale(
  product: { priceTRY: number; priceUSD: number },
  locale: string
): string {
  const { amount, currency } = getPriceForLocale(product, locale)
  return formatPrice(amount, currency, locale === 'tr' ? 'tr-TR' : 'en-US')
}

type DiscountableProduct = {
  priceTRY: number
  priceUSD: number
  discountPriceTRY?: number
  discountPriceUSD?: number
}

/**
 * Locale'e göre indirim durumunu çözer. Sanity'de ilgili para biriminin
 * "İndirimli Fiyat" alanı doluysa VE normal fiyattan düşükse indirimli
 * kabul edilir (Studio'da da aynı kural doğrulanıyor, ama veri elle GROQ
 * dışından da gelebileceği için burada tekrar kontrol ediliyor).
 * Geçerli bir indirim yoksa `discounted` alanı yoktur.
 */
export function getPricingForLocale(
  product: DiscountableProduct,
  locale: string
): {
  currency: 'TRY' | 'USD'
  original: number
  discounted?: number
} {
  const { amount: original, currency } = getPriceForLocale(product, locale)
  const discountAmount = currency === 'TRY' ? product.discountPriceTRY : product.discountPriceUSD
  const discounted =
    typeof discountAmount === 'number' && discountAmount > 0 && discountAmount < original
      ? discountAmount
      : undefined
  return { currency, original, discounted }
}

/**
 * Sepete eklenecek satırın fiyatını hesaplar — locale'den BAĞIMSIZ,
 * çünkü CartItem her zaman iki para birimini de saklar (kullanıcı sonradan
 * dil değiştirebilir). Her para birimi kendi indirimini KENDİ başına
 * kontrol eder (biri indirimli, diğeri olmayabilir).
 *
 * Döndürülen priceTRY/priceUSD ZATEN İNDİRİMLİ TUTARDIR — sepet toplamı
 * (cart.ts -> getTotal), CartSummary, checkout API ve iyzico'ya giden
 * tutar hep bu alanları doğrudan kullanır; ayrı bir indirim hesaplaması
 * yapmazlar. originalPriceTRY/USD SADECE üstü çizili eski fiyatı
 * göstermek için var, hiçbir toplam hesaplamasında kullanılmaz.
 */
export function getCartPricing(product: DiscountableProduct): {
  priceTRY: number
  priceUSD: number
  originalPriceTRY?: number
  originalPriceUSD?: number
} {
  const discountedTRY =
    typeof product.discountPriceTRY === 'number' &&
    product.discountPriceTRY > 0 &&
    product.discountPriceTRY < product.priceTRY
      ? product.discountPriceTRY
      : undefined
  const discountedUSD =
    typeof product.discountPriceUSD === 'number' &&
    product.discountPriceUSD > 0 &&
    product.discountPriceUSD < product.priceUSD
      ? product.discountPriceUSD
      : undefined

  return {
    priceTRY: discountedTRY ?? product.priceTRY,
    priceUSD: discountedUSD ?? product.priceUSD,
    originalPriceTRY: discountedTRY !== undefined ? product.priceTRY : undefined,
    originalPriceUSD: discountedUSD !== undefined ? product.priceUSD : undefined,
  }
}
