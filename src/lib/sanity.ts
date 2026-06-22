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
