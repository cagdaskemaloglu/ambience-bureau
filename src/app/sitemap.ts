import type { MetadataRoute } from 'next'
import { getAllProductSlugs } from '@/lib/queries'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ambiencebureau.com'
const LOCALES = ['tr', 'en'] as const

function entriesFor(
  path: string,
  lastModified?: Date,
  priority = 0.7
): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(LOCALES.map((l) => [l, `${BASE_URL}/${l}${path}`]))
  return LOCALES.map((locale) => ({
    url: `${BASE_URL}/${locale}${path}`,
    lastModified,
    changeFrequency: priority >= 0.9 ? 'daily' : priority >= 0.6 ? 'weekly' : 'monthly',
    priority,
    alternates: { languages },
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths: Array<{ path: string; priority: number }> = [
    { path: '', priority: 1 },
    { path: '/registry', priority: 0.9 },
    { path: '/custom-registry', priority: 0.9 },
    { path: '/bureau', priority: 0.5 },
    { path: '/archive', priority: 0.5 },
    { path: '/control-protocol', priority: 0.3 },
    { path: '/privacy-policy', priority: 0.3 },
    { path: '/terms-of-use', priority: 0.3 },
  ]

  const entries: MetadataRoute.Sitemap = staticPaths.flatMap((p) =>
    entriesFor(p.path, undefined, p.priority)
  )

  // Ürün detay sayfaları — Sanity'den dinamik olarak çekiliyor.
  // Bu sorgu zaten queries.ts'te vardı (getAllProductSlugs), sadece
  // hiçbir yerden çağrılmıyordu.
  try {
    const products = await getAllProductSlugs()
    for (const p of products ?? []) {
      if (!p.slug?.current) continue
      entries.push(
        ...entriesFor(
          `/registry/${p.slug.current}`,
          p._updatedAt ? new Date(p._updatedAt) : undefined,
          0.8
        )
      )
    }
  } catch (err) {
    console.error('[sitemap] Ürün slug\'ları alınamadı:', err)
  }

  return entries
}