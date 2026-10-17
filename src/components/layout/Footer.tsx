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
            aria-label="App Store"
            className="block transition-opacity hover:opacity-80"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/badges/app-store.svg" alt="Download on the App Store" className="h-9 w-auto" />
          </a>

          {/* Play Store — henüz yayınlanmadı, bu yüzden tıklanınca hiçbir
              yere yönlendirmiyor (href/onClick yok, sadece görsel yer tutucu). */}
          <button
            type="button"
            aria-label="Google Play"
            className="block cursor-default p-0 transition-opacity hover:opacity-80"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/badges/google-play.svg" alt="Get it on Google Play" className="h-9 w-auto" />
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
            {/* Arşiv / Büro — artık header menüsünde değil, burada. */}
            <div className="flex flex-col gap-1">
              <Link
                href="/archive"
                className="font-mono text-[8.5px] tracking-widest text-bureau-subtle uppercase no-underline hover:text-bureau-black"
              >
                {tr ? 'Arşiv' : 'Archive'}
              </Link>
              <Link
                href="/bureau"
                className="font-mono text-[8.5px] tracking-widest text-bureau-subtle uppercase no-underline hover:text-bureau-black"
              >
                {tr ? 'Büro' : 'Bureau'}
              </Link>
            </div>
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