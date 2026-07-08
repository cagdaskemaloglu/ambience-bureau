import { PDFDocument } from 'pdf-lib'

// Vercel/Lambda gibi serverless ortamlarda @sparticuz/chromium + puppeteer-core,
// yerel geliştirmede ise tam 'puppeteer' paketi kullanılır (kendi Chromium'unu indirir).
async function launchBrowser() {
  const isServerless = !!process.env.VERCEL || process.env.NODE_ENV === 'production'

  if (isServerless) {
    const chromium = (await import('@sparticuz/chromium')).default
    const puppeteer = await import('puppeteer-core')
    return puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: true,
    })
  }

  const puppeteer = await import('puppeteer')
  return puppeteer.launch({ headless: true })
}

/**
 * Tek bir HTML string'ini A5 PDF buffer'ına çevirir.
 * @page { size: A5 } kuralı şablonların <style> içinde zaten tanımlı;
 * bu yüzden burada preferCSSPageSize: true kullanıyoruz.
 */
export async function htmlToPdfBuffer(html: string): Promise<Buffer> {
  const browser = await launchBrowser()
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}

/**
 * Ürün Kartı gibi 2 sayfalı belgeler için: iki ayrı HTML'i ayrı ayrı PDF'e
 * çevirip tek bir PDF'te (ön yüz + arka yüz) birleştirir.
 */
export async function mergeHtmlPagesToPdf(htmlPages: string[]): Promise<Buffer> {
  const pdfBuffers = await Promise.all(htmlPages.map((html) => htmlToPdfBuffer(html)))

  const merged = await PDFDocument.create()
  for (const buf of pdfBuffers) {
    const doc = await PDFDocument.load(buf)
    const pages = await merged.copyPages(doc, doc.getPageIndices())
    pages.forEach((p) => merged.addPage(p))
  }

  const mergedBytes = await merged.save()
  return Buffer.from(mergedBytes)
}
