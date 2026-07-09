import { PDFDocument } from 'pdf-lib'
import type { Browser } from 'puppeteer-core'

// NOT: @sparticuz/chromium'un tam sürümü yerine @sparticuz/chromium-min kullanıyoruz.
// Next.js'in output file tracing mekanizması, tam pakedin bin/ altındaki binary
// dosyalarını (libnss3.so dahil) bazen eksik taşıyor — "libnss3.so: cannot open
// shared object file" hatasının kaynağı bu. chromium-min ile Chromium binary'si
// build'e gömülmüyor, her cold start'ta bu tar.gz'den indiriliyor — bu paket
// sürümüyle BİREBİR aynı sürüm etiketini kullanmak önemli (bkz. package.json).
const CHROMIUM_PACK_URL =
  'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar'

async function launchBrowser(): Promise<Browser> {
  const isServerless = !!process.env.VERCEL || process.env.NODE_ENV === 'production'

  if (isServerless) {
    // @sparticuz/chromium-min, "AWS Lambda içinde miyim?" kontrolünü
    // AWS_EXECUTION_ENV / AWS_LAMBDA_JS_RUNTIME env değişkenlerine bakarak yapıyor.
    // Vercel bu değişkenleri set etmiyor (native AWS Lambda değil) — bu yüzden
    // paket kendi kendine "Lambda'da değilim" sanıp libnss3.so'yu içeren
    // al2023.tar.br'ı hiç açmıyor ve LD_LIBRARY_PATH'ı hiç ayarlamıyor.
    // Kütüphanenin kendisi zaten Netlify gibi platformlar için bu değişkeni
    // manuel set etmeyi destekliyor — aynı yolu Vercel için de kullanıyoruz.
    process.env.AWS_LAMBDA_JS_RUNTIME ??= 'nodejs20.x'

    const chromium = (await import('@sparticuz/chromium-min')).default
    const puppeteer = await import('puppeteer-core')
    return puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(CHROMIUM_PACK_URL),
      headless: chromium.headless,
    }) as unknown as Promise<Browser> as any
  }

  const puppeteer = await import('puppeteer')
  return puppeteer.launch({ headless: true }) as any
}

/** Sipariş başına TEK bir tarayıcı örneği açıp generateOrderDocuments'a veren yardımcı. */
export async function withBrowser<T>(fn: (browser: Browser) => Promise<T>): Promise<T> {
  const browser = await launchBrowser()
  try {
    return await fn(browser)
  } finally {
    await browser.close()
  }
}

/**
 * Tek bir HTML string'ini A5 PDF buffer'ına çevirir. Verimlilik için var olan
 * bir tarayıcı örneğini (browser) parametre olarak alır — her belge için ayrı
 * ayrı tarayıcı açıp kapatmaz.
 */
export async function htmlToPdfBuffer(browser: Browser, html: string): Promise<Buffer> {
  const page = await browser.newPage()
  try {
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true })
    return Buffer.from(pdf)
  } finally {
    await page.close()
  }
}

/**
 * Ürün Kartı gibi 2 sayfalı belgeler için: iki ayrı HTML'i ayrı ayrı PDF'e
 * çevirip tek bir PDF'te (ön yüz + arka yüz) birleştirir.
 */
export async function mergeHtmlPagesToPdf(browser: Browser, htmlPages: string[]): Promise<Buffer> {
  const pdfBuffers = await Promise.all(htmlPages.map((html) => htmlToPdfBuffer(browser, html)))

  const merged = await PDFDocument.create()
  for (const buf of pdfBuffers) {
    const doc = await PDFDocument.load(buf)
    const pages = await merged.copyPages(doc, doc.getPageIndices())
    pages.forEach((p) => merged.addPage(p))
  }

  const mergedBytes = await merged.save()
  return Buffer.from(mergedBytes)
}

