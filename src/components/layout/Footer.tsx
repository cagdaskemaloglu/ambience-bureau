'use client'

import Image from 'next/image'
import { useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'

const APP_STORE_URL = 'https://apps.apple.com/tr/app/ambience-bureau/id6794577754'

export function Footer() {
  const locale = useLocale()
  const tr = locale === 'tr'

  return (
    <footer className="hidden border-t border-bureau-line-header sm:block">
      <div className="flex flex-wrap items-center justify-between gap-y-2 px-10 py-4">
        <span className="flex flex-wrap items-baseline gap-x-1.5 font-mono text-[10px] tracking-widest text-bureau-subtle uppercase">
          <span>© 2026</span>
          <span className="font-sans text-lg font-black tracking-[0.12em] text-bureau-black sm:text-xl">
            THE AMBIENCE BUREAU.
          </span>
          <span>{tr ? 'Tüm hakları saklıdır.' : 'All rights reserved.'}</span>
        </span>

        <div className="flex items-center gap-6">
          {/* iyzico + Mastercard/Visa/Amex/Troy — güven rozeti, iyzico'nun
              onay kriterlerinden biri ("Visa ve MasterCard Logoları" +
              "iyzico ile Öde Logosu"). Tek bir birleşik görsel, dilden
              bağımsız (ödeme ağı logoları genelde çevrilmez). */}
          <Image
            src="/payments/footer-logo.png"
            alt="iyzico ile Öde — Mastercard, Visa, American Express, Troy"
            width={214}
            height={16}
            className="h-4 w-auto opacity-90"
          />

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

          <div className="flex items-center gap-5">
            <Link
              href="/shipping-returns"
              className="font-mono text-[10px] tracking-widest text-bureau-subtle uppercase no-underline hover:text-bureau-black"
            >
              {tr ? 'Teslimat ve İade' : 'Shipping & Returns'}
            </Link>
            <Link
              href="/distance-sales-agreement"
              className="font-mono text-[10px] tracking-widest text-bureau-subtle uppercase no-underline hover:text-bureau-black"
            >
              {tr ? 'Mesafeli Satış Sözleşmesi' : 'Distance Sales Agreement'}
            </Link>
            <Link
              href="/privacy-policy"
              className="font-mono text-[10px] tracking-widest text-bureau-subtle uppercase no-underline hover:text-bureau-black"
            >
              {tr ? 'Gizlilik Politikası' : 'Privacy Policy'}
            </Link>
            <Link
              href="/terms-of-use"
              className="font-mono text-[10px] tracking-widest text-bureau-subtle uppercase no-underline hover:text-bureau-black"
            >
              {tr ? 'Kullanım Koşulları' : 'Terms of Use'}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}