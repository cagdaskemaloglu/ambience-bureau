import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'

export const metadata: Metadata = {
  title: '404 · Kayıt bulunamadı / No record found',
  robots: { index: false },
}

/**
 * Markalı 404 — büro dilinde "kayıt bulunamadı" belgesi. Header/footer
 * [locale]/layout.tsx'ten gelir; ziyaretçinin her zaman bir çıkışı var.
 */
export default async function NotFound() {
  const locale = await getLocale()
  const tr = locale === 'tr'
  return (
    <section className="flex flex-1 items-center px-5 py-16 md:px-9">
      <div className="w-full max-w-[720px] border border-bureau-black">
        <div className="flex items-center justify-between border-b border-bureau-black px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-widest">
          <span className="text-bureau-black">{tr ? 'Form 404 · Sicil sorgusu' : 'Form 404 · Register query'}</span>
          <span className="text-bureau-muted">{tr ? 'Sonuç: Yok' : 'Result: None'}</span>
        </div>
        <div className="relative overflow-hidden px-6 py-10 md:px-10 md:py-14">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-4 -top-6 select-none font-mono text-[160px] font-semibold leading-none text-bureau-rule md:text-[220px]"
          >
            404
          </span>
          <h1 className="relative text-[36px] font-semibold leading-[0.95] tracking-[-0.03em] text-bureau-black md:text-[56px]">
            {tr ? 'Kayıt bulunamadı.' : 'No record found.'}
          </h1>
          <p className="relative mt-4 max-w-[46ch] text-[15px] leading-relaxed text-bureau-muted">
            {tr
              ? 'Aradığınız sayfa sicilde yok; taşınmış, hizmet dışı bırakılmış ya da hiç dosyalanmamış olabilir.'
              : 'The page you asked for is not on the register. It may have been moved, decommissioned or never filed.'}
          </p>
          <span className="relative mt-6 inline-block -rotate-3 border-2 border-bureau-amber px-3 py-1.5 font-mono text-[12px] font-semibold uppercase tracking-widest text-bureau-amber">
            {tr ? 'Dosyalanmadı' : 'Not filed'}
          </span>
        </div>
        <nav aria-label={tr ? 'Çıkışlar' : 'Exits'} className="flex flex-wrap gap-3 border-t border-bureau-black px-6 py-4 md:px-10">
          <Link href="/" className="btn-file focus-bureau">
            <span>{tr ? 'Bültene dön' : 'Back to the bulletin'}</span>
          </Link>
          <Link href="/registry" className="btn-file focus-bureau">
            <span>{tr ? 'Envanteri incele' : 'Browse the register'}</span>
          </Link>
        </nav>
      </div>
    </section>
  )
}
