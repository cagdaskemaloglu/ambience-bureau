'use client'

import { useTranslations, useLocale } from 'next-intl'
import { usePathname } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'
import { useRouter } from '@/i18n/navigation'
import { useEffect, useState } from 'react'
import { useCartStore } from '@/lib/store/cart'

export function Header() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const cartCount = useCartStore((state) => state.getCount())

  // Hydration mismatch'i önlemek için: server'da her zaman 0 göster,
  // client mount olduktan sonra gerçek (localStorage'dan gelen) sayıyı göster.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const displayCount = mounted ? cartCount : 0

  const otherLocale = locale === 'tr' ? 'en' : 'tr'

  function switchLocale() {
    router.replace(pathname, { locale: otherLocale })
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <header className="border-b border-bureau-black">
      <div className="flex items-start justify-between px-10 pb-5 pt-7">
        {/* Brand */}
        <Link href="/" className="group no-underline">
          <div className="text-base font-semibold tracking-[0.12em] uppercase text-bureau-black">
            The Ambience Bureau
          </div>
          <div className="mt-1 font-mono text-[10px] tracking-widest text-bureau-muted uppercase">
            REGULATION OF SPATIAL PHOTONS // EST. 2026
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-8 mt-1">
          {/* Custom Registry — highlighted CTA */}
          <Link
            href="/custom-registry"
            className={`
              flex items-center gap-2 border border-bureau-black px-3.5 py-1.5
              font-mono text-[11px] tracking-wider uppercase
              transition-colors duration-150 no-underline
              ${isActive('/custom-registry')
                ? 'bg-bureau-black text-bureau-white'
                : 'bg-bureau-white text-bureau-black hover:bg-bureau-black hover:text-bureau-white'}
            `}
          >
            <span className="h-[5px] w-[5px] rounded-full bg-bureau-amber flex-shrink-0" />
            {t('customRegistry')}
          </Link>

          {/* Standard nav items */}
          {[
            { href: '/registry' as const, label: t('registry') },
            { href: '/control-protocol' as const, label: t('controlProtocol') },
            { href: '/bureau' as const, label: t('bureau') },
            { href: '/archive' as const, label: t('archive') },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`
                font-mono text-[11px] tracking-wider uppercase no-underline
                transition-opacity duration-150
                ${isActive(href)
                  ? 'text-bureau-black font-semibold'
                  : 'text-bureau-black opacity-70 hover:opacity-100'}
              `}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right: locale + cart */}
        <div className="flex items-center gap-6 mt-1">
          {/* Locale toggle */}
          <button
            onClick={switchLocale}
            className="font-mono text-[10px] tracking-wider uppercase text-bureau-muted hover:text-bureau-black transition-colors"
            aria-label={`Switch to ${otherLocale.toUpperCase()}`}
          >
            <span className={locale === 'tr' ? 'text-bureau-black font-semibold' : 'opacity-50'}>TR</span>
            <span className="mx-1 opacity-30">/</span>
            <span className={locale === 'en' ? 'text-bureau-black font-semibold' : 'opacity-50'}>EN</span>
          </button>

          {/* Cart */}
          <Link
            href="/cart"
            className="border-l border-bureau-black pl-6 font-mono text-[11px] tracking-wider uppercase text-bureau-black no-underline hover:text-bureau-amber transition-colors"
          >
            Cart ({String(displayCount).padStart(2, '0')})
          </Link>
        </div>
      </div>
    </header>
  )
}
