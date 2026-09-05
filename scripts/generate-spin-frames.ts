/**
 * scripts/generate-spin-frames.ts
 *
 * "Customize edilebilir" (isConfigurable + configuratorCollection +
 * configuratorParts dolu) ürünler için 360° dönüş kare dizisi üretir.
 *
 * Her ürünün Custom Registry'deki TAM parça/malzeme kombinasyonunu
 * (?preset=<slug>&capture=1) headless Chrome'da açar, kamerayı
 * SPIN_FRAME_COUNT kez döndürüp her açıda bir kare yakalar ve Supabase
 * Storage'daki `product-spins` public bucket'ına yükler:
 *   product-spins/<slug>/00.webp ... 23.webp
 *
 * Frontend (ProductCardMedia.tsx) bu kareleri doğrudan bu URL deseninden
 * okur — ayrıca bir Sanity alanı YOK. Kareler yoksa (henüz üretilmediyse)
 * kart sessizce sadece fotoğraf gösterir.
 *
 * KULLANIM:
 *   npm run spin-frames                        → tüm configurable ürünler
 *   npm run spin-frames -- --slug=totem-01      → tek ürün
 *   npm run spin-frames -- --base-url=https://ambiencebureau.com
 *
 * ÖNEMLİ: --base-url ile verilen site (varsayılan http://localhost:3000)
 * ÇALIŞIYOR olmalı — bu script sayfayı gerçek bir tarayıcıda açıp canvas'ı
 * yakalıyor, kendi başına bir 3D render motoru değil. Bir ürünün
 * configuratorParts/configuratorCollection'ını Sanity'de değiştirdiğinizde,
 * o ürün için bu script'i YENİDEN çalıştırmanız gerekir.
 *
 * Gerekli ortam değişkenleri (.env.local'den okunur):
 *   NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { config as loadEnv } from 'dotenv'
// Next.js'in katman sırasını taklit ediyoruz: önce .env, sonra .env.local
// onun üzerine yazar (override).
loadEnv({ path: '.env', quiet: true })
loadEnv({ path: '.env.local', override: true, quiet: true })

import puppeteer, { type Browser, type Page } from 'puppeteer'
import { createSupabaseAdminClient } from '../src/lib/supabase/server'

// NOT: sanityClient'ı BİLEREK dinamik import ediyoruz. src/lib/sanity.ts
// modülü yüklendiği ANDA (top-level kod) Sanity client'ı kurar ve
// process.env.NEXT_PUBLIC_SANITY_* değerlerini okur. Statik bir import
// kullansaydık, ES module import'ları dosyadaki konumlarından bağımsız
// olarak dosyanın geri kalanından ÖNCE ("hoisted") çalıştığı için,
// sanity.ts yukarıdaki loadEnv() çağrılarından ÖNCE değerlendirilir ve
// ortam değişkenlerini boş okur. Dinamik import, loadEnv() çalıştıktan
// SONRA gerçekleşmesini garantiler.
async function getSanityClient() {
  const { sanityClient } = await import('../src/lib/sanity')
  return sanityClient
}

const SPIN_FRAME_COUNT = 24 // src/lib/spinFrames.ts ile senkron tutulmalı
const SPIN_FRAME_BUCKET = 'product-spins' // src/lib/spinFrames.ts ile senkron tutulmalı
const ISO_AZIMUTH_DEG = 45 // src/components/configurator/CameraFit.tsx#ISO_AZIMUTH_DEG ile senkron tutulmalı
// 3:4 (portre) — ürün fotoğraflarıyla aynı oran (bkz. ProductCard.tsx'teki
// aspect-[3/4] ve urlFor(...).width(600).height(800)).
// deviceScaleFactor:2 ile birlikte Scene.tsx'in capture-modu dpr=[1,3]
// ayarı devreye girer — kareler daha keskin/net render edilir. Bu SADECE
// bu script'in headless Chrome'unda etkili olur, siteyi ziyaret eden
// kullanıcıların performansını ETKİLEMEZ (kareler önceden üretilip
// dosya olarak servis ediliyor).
const VIEWPORT = { width: 1050, height: 1400, deviceScaleFactor: 2 }

function parseArgs() {
  const args = process.argv.slice(2)
  const get = (name: string) => {
    const found = args.find((a) => a.startsWith(`--${name}=`))
    return found ? found.slice(`--${name}=`.length) : undefined
  }
  return {
    slug: get('slug'),
    baseUrl: get('base-url') ?? process.env.SPIN_BASE_URL ?? 'http://localhost:3000',
  }
}

async function getConfigurableSlugs(onlySlug: string | undefined): Promise<string[]> {
  if (onlySlug) return [onlySlug]
  const sanityClient = await getSanityClient()
  return sanityClient.fetch<string[]>(
    `*[_type == "product" && isConfigurable == true && defined(configuratorCollection) && count(configuratorParts) > 0].slug.current`
  )
}

async function ensureBucket(): Promise<void> {
  const admin = createSupabaseAdminClient() as any
  const { error } = await admin.storage.createBucket(SPIN_FRAME_BUCKET, { public: true })
  if (error && !String(error.message ?? error).toLowerCase().includes('already exists')) {
    console.warn(`  (uyarı) Bucket oluşturulamadı — muhtemelen zaten var: ${error.message ?? error}`)
  }
}

/** Model tamamen yüklenip kamera metrikleri stabilize olana kadar bekler; son (stabil) metrikleri döner. */
async function waitForStableMetrics(
  page: Page,
  timeoutMs = 20000
): Promise<{ partCount: number; totalHeight: number }> {
  const start = Date.now()
  let lastSnapshot = ''
  let stableCount = 0
  let lastMetrics: { partCount: number; totalHeight: number } | null = null

  while (Date.now() - start < timeoutMs) {
    const metrics = await page.evaluate(() => {
      const capture = (window as any).__spinCapture
      return capture ? capture.getMetrics() : null
    })

    if (metrics && metrics.partCount > 0) {
      lastMetrics = metrics
      const snapshot = JSON.stringify(metrics)
      if (snapshot === lastSnapshot) {
        stableCount += 1
        if (stableCount >= 2) return metrics // iki ardışık ölçüm aynı → stabil kabul edildi
      } else {
        stableCount = 0
      }
      lastSnapshot = snapshot
    }

    await new Promise((resolve) => setTimeout(resolve, 350))
  }

  if (lastMetrics) return lastMetrics // stabil olmadı ama en azından bir ölçüm var — devam et
  throw new Error('Model metrikleri zaman aşımı içinde stabilize olmadı (parçalar/malzemeler yüklenemedi mi?)')
}

async function captureProduct(browser: Browser, baseUrl: string, slug: string): Promise<void> {
  const page = await browser.newPage()
  await page.setViewport(VIEWPORT)

  try {
    const url = `${baseUrl}/tr/custom-registry?preset=${encodeURIComponent(slug)}&capture=1`
    console.log(`  → ${url}`)
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 })

    await page.waitForFunction(() => !!(window as any).__spinCapture, { timeout: 15000 })
    const { totalHeight } = await waitForStableMetrics(page)

    const admin = createSupabaseAdminClient() as any
    const azimuthStep = 360 / SPIN_FRAME_COUNT

    for (let i = 0; i < SPIN_FRAME_COUNT; i++) {
      const azimuth = (ISO_AZIMUTH_DEG + i * azimuthStep) % 360

      await page.evaluate((deg) => (window as any).__spinCapture.setAngle(deg), azimuth)
      const dataUrl: string = await page.evaluate(() => (window as any).__spinCapture.captureFrame())

      const base64 = dataUrl.replace(/^data:image\/webp;base64,/, '')
      const buffer = Buffer.from(base64, 'base64')
      const fileName = `${slug}/${String(i).padStart(2, '0')}.webp`

      const { error } = await admin.storage.from(SPIN_FRAME_BUCKET).upload(fileName, buffer, {
        contentType: 'image/webp',
        upsert: true,
      })
      if (error) throw new Error(`Supabase upload hatası (${fileName}): ${error.message ?? error}`)

      process.stdout.write(`\r  ${slug}: ${i + 1}/${SPIN_FRAME_COUNT} kare yüklendi   `)
    }

    // Boy (mm) değeri — kare görsellerinin yanına küçük bir JSON dosyası
    // olarak yüklenir. Product card'da bu değer, sahneye YAKILMAK yerine
    // sabit bir HTML rozeti olarak gösteriliyor (bkz. ProductCardMedia.tsx)
    // — kart döndükçe dönüp durmasın diye.
    const metaBuffer = Buffer.from(JSON.stringify({ heightMm: Math.round(totalHeight) }), 'utf-8')
    const { error: metaError } = await admin.storage.from(SPIN_FRAME_BUCKET).upload(`${slug}/meta.json`, metaBuffer, {
      contentType: 'application/json',
      upsert: true,
    })
    if (metaError) throw new Error(`Supabase meta.json upload hatası: ${metaError.message ?? metaError}`)

    console.log(`\n  ✓ ${slug} tamamlandı (boy: ${Math.round(totalHeight)} mm)`)
  } finally {
    await page.close()
  }
}

function checkRequiredEnv(): void {
  const required = [
    'NEXT_PUBLIC_SANITY_PROJECT_ID',
    'NEXT_PUBLIC_SANITY_DATASET',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ]
  const missing = required.filter((k) => !process.env[k])
  if (missing.length > 0) {
    console.error(`Eksik ortam değişkenleri: ${missing.join(', ')}`)
    console.error('Bu değerler proje kök dizinindeki .env.local dosyasında tanımlı olmalı.')
    process.exit(1)
  }
}

async function main() {
  checkRequiredEnv()
  const { slug, baseUrl } = parseArgs()

  console.log(`Hedef site: ${baseUrl}`)
  await ensureBucket()

  const slugs = await getConfigurableSlugs(slug)
  if (slugs.length === 0) {
    console.log(
      'Customize edilebilir (isConfigurable=true + configuratorCollection + configuratorParts dolu) ürün bulunamadı.'
    )
    return
  }
  console.log(`${slugs.length} ürün işlenecek: ${slugs.join(', ')}\n`)

  const browser = await puppeteer.launch({ headless: true })
  const failed: string[] = []

  try {
    for (const s of slugs) {
      console.log(`[${s}]`)
      try {
        await captureProduct(browser, baseUrl, s)
      } catch (err) {
        console.error(`  ✗ ${s} başarısız:`, err instanceof Error ? err.message : err)
        failed.push(s)
      }
    }
  } finally {
    await browser.close()
  }

  if (failed.length > 0) {
    console.log(`\nBaşarısız olan ürünler: ${failed.join(', ')}`)
    process.exitCode = 1
  } else {
    console.log('\nTüm kareler başarıyla üretildi.')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})