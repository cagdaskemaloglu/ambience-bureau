'use client'

import { useLocale } from 'next-intl'

export function Footer() {
  const locale = useLocale()
  const tr = locale === 'tr'

  return (
    <footer className="hidden border-t border-bureau-black sm:block">
      <div className="px-10 py-4">
        <span className="font-mono text-[10px] tracking-widest text-bureau-subtle uppercase">
          © 2026 The Ambience Bureau. {tr ? 'Tüm hakları saklıdır.' : 'All rights reserved.'}
        </span>
      </div>
    </footer>
  )
}