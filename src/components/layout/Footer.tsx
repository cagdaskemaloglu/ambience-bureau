'use client'

import { useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'

const APP_STORE_URL = 'https://apps.apple.com/tr/app/ambience-bureau/id6794577754'

export function Footer() {
  const locale = useLocale()
  const tr = locale === 'tr'

  return (
    <footer className="hidden border-t border-bureau-line-header sm:block">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-10 py-3">
        {/* Sol: telif + marka */}
        <span className="flex flex-wrap items-baseline gap-x-1.5 font-mono text-[10px] tracking-widest text-bureau-subtle uppercase">
          <span>© 2026</span>
          <span className="font-sans text-lg font-black tracking-[0.12em] text-bureau-black sm:text-xl">
            THE AMBIENCE BUREAU.
          </span>
          <span>{tr ? 'Tüm hakları saklıdır.' : 'All rights reserved.'}</span>
        </span>

        {/* Orta: App Store + Play Store — artık yan yana (önceden alt alta),
            sol (marka) ve sağ (logo+linkler) bloklarının arasında, görsel
            olarak ortada. */}
        <div className="flex items-center gap-2">
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 border border-bureau-black bg-black px-3 py-1.5 text-white no-underline transition-colors hover:border-bureau-amber hover:bg-bureau-amber"
          >
            <span className="leading-tight">
              <span className="block font-mono text-[7px] uppercase tracking-wide text-white/70">
                {tr ? 'Uygulamayı İndirin' : 'Download on the'}
              </span>
              <span className="block font-mono text-[11px] font-semibold uppercase tracking-wide">
                App Store
              </span>
            </span>
          </a>

          {/* Play Store — henüz yayınlanmadı, bu yüzden tıklanınca hiçbir
              yere yönlendirmiyor (href/onClick yok, sadece görsel yer tutucu). */}
          <button
            type="button"
            className="flex items-center gap-2 border border-bureau-black bg-black px-3 py-1.5 text-white transition-colors hover:border-bureau-amber hover:bg-bureau-amber"
          >
            <span className="leading-tight">
              <span className="block font-mono text-[7px] uppercase tracking-wide text-white/70">
                {tr ? 'Uygulamayı İndirin' : 'Download on the'}
              </span>
              <span className="block font-mono text-[11px] font-semibold uppercase tracking-wide">
                Play Store
              </span>
            </span>
          </button>
        </div>

        {/* Sağ: linkler (2x2 — dikey yüksekliği yarıya indirir) */}
        <div className="flex items-center gap-6">
          {/* iyzico/Mastercard/Visa/Amex/Troy rozeti KALDIRILDI — iyzico
              anlaşması sona erdi, ödeme altyapısı PayTR'ye geçiyor. PayTR
              logosu hazır olunca buraya aynı yöntemle eklenebilir. */}

          {/* Sol sütun: Teslimat ve İade / Mesafeli Satış Sözleşmesi.
              Sağ sütun: Gizlilik Politikası / Kullanım Koşulları. */}
          <div className="flex gap-4">
            <div className="flex flex-col gap-1">
              <Link
                href="/shipping-returns"
                className="font-mono text-[8.5px] tracking-widest text-bureau-subtle uppercase no-underline hover:text-bureau-black"
              >
                {tr ? 'Teslimat ve İade' : 'Shipping & Returns'}
              </Link>
              <Link
                href="/distance-sales-agreement"
                className="font-mono text-[8.5px] tracking-widest text-bureau-subtle uppercase no-underline hover:text-bureau-black"
              >
                {tr ? 'Mesafeli Satış Sözleşmesi' : 'Distance Sales Agreement'}
              </Link>
            </div>
            <div className="flex flex-col gap-1">
              <Link
                href="/privacy-policy"
                className="font-mono text-[8.5px] tracking-widest text-bureau-subtle uppercase no-underline hover:text-bureau-black"
              >
                {tr ? 'Gizlilik Politikası' : 'Privacy Policy'}
              </Link>
              <Link
                href="/terms-of-use"
                className="font-mono text-[8.5px] tracking-widest text-bureau-subtle uppercase no-underline hover:text-bureau-black"
              >
                {tr ? 'Kullanım Koşulları' : 'Terms of Use'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}