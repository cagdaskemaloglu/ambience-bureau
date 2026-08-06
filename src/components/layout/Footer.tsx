'use client'

import { useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'

const APP_STORE_URL = 'https://apps.apple.com/tr/app/ambience-bureau/id6794577754'

export function Footer() {
  const locale = useLocale()
  const tr = locale === 'tr'

  return (
    <footer className="hidden border-t border-bureau-black sm:block">
      <div className="flex items-center justify-between px-10 py-4">
        <span className="font-mono text-[10px] tracking-widest text-bureau-subtle uppercase">
          © 2026 The Ambience Bureau. {tr ? 'Tüm hakları saklıdır.' : 'All rights reserved.'}
        </span>

        <div className="flex items-center gap-6">
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