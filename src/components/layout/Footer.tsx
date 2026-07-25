'use client'

import { useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'

export function Footer() {
  const locale = useLocale()
  const tr = locale === 'tr'

  return (
    <footer className="hidden border-t border-bureau-black sm:block">
      <div className="flex items-center justify-between px-10 py-4">
        <span className="font-mono text-[10px] tracking-widest text-bureau-subtle uppercase">
          © 2026 The Ambience Bureau. {tr ? 'Tüm hakları saklıdır.' : 'All rights reserved.'}
        </span>
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
    </footer>
  )
}