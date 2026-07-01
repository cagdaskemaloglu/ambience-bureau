'use client'

import { useTranslations, useLocale } from 'next-intl'
import { usePathname } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'
import { useRouter } from '@/i18n/navigation'
import { useEffect, useRef, useState } from 'react'
import { useCartStore } from '@/lib/store/cart'
import Image from 'next/image'
import { getLocalizedValue } from '@/lib/sanity'
import type { Collection } from '@/types'

const NAV_ITEMS = [
  { href: '/registry' as const, labelKey: 'registry', isCTA: false },
  { href: '/control-protocol' as const, labelKey: 'controlProtocol', isCTA: false },
  { href: '/bureau' as const, labelKey: 'bureau', isCTA: false },
  { href: '/archive' as const, labelKey: 'archive', isCTA: false },
] as const

export function Header({ collections = [] }: { collections?: Collection[] }) {
  const t = useTranslations('nav')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const cartCount = useCartStore((state) => state.getCount())

  const [mounted, setMounted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [desktopDropdownOpen, setDesktopDropdownOpen] = useState(false)
  const [mobileSubOpen, setMobileSubOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => setMounted(true), [])
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  // Dropdown dışına tıklanınca kapat
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDesktopDropdownOpen(false)
      }
    }
    if (desktopDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [desktopDropdownOpen])

  const displayCount = mounted ? cartCount : 0
  const otherLocale = locale === 'tr' ? 'en' : 'tr'

  function switchLocale() {
    router.replace(pathname, { locale: otherLocale })
    setMenuOpen(false)
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  function goToCollection(key: string) {
    router.push(`/custom-registry?collection=${key}`)
    setDesktopDropdownOpen(false)
    setMenuOpen(false)
    setMobileSubOpen(false)
  }

  return (
    <>
      <header className="relative z-40 flex-shrink-0 border-b border-bureau-black bg-white">
        <div className="flex items-center justify-between px-5 py-4 sm:px-10 sm:pb-5 sm:pt-7 sm:items-start">

          {/* Brand */}
          <Link href="/" className="group no-underline flex items-center gap-3" onClick={() => setMenuOpen(false)}>
            <Image
              src="/logo.png"
              alt="The Ambience Bureau"
              width={100}
              height={100}
              priority
            />
            <div>
              <div className="text-sm font-semibold tracking-[0.12em] uppercase text-bureau-black sm:text-base">
                The Ambience Bureau
              </div>
              <div className="hidden mt-1 font-mono text-[10px] tracking-widest text-bureau-muted uppercase sm:block">
                REGULATION OF SPATIAL PHOTONS // EST. 2026
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-8 mt-1 lg:flex">
            {/* Custom Registry — link + dropdown trigger birlikte */}
            <div ref={dropdownRef} className="relative flex items-stretch">
              <div
                className={`
                  flex items-center border border-bureau-black
                  font-mono text-[11px] tracking-wider uppercase
                  transition-colors duration-150
                  ${isActive('/custom-registry')
                    ? 'bg-bureau-black text-bureau-white'
                    : 'bg-white text-bureau-black'}
                `}
              >
                <Link
                  href="/custom-registry"
                  className={`flex items-center gap-2 px-3.5 py-1.5 no-underline transition-colors ${
                    isActive('/custom-registry') ? '' : 'hover:bg-bureau-black hover:text-bureau-white'
                  }`}
                >
                  <span className="h-[5px] w-[5px] rounded-full bg-bureau-amber flex-shrink-0" />
                  {t('customRegistry')}
                </Link>

                {collections.length > 0 && (
                  <button
                    onClick={() => setDesktopDropdownOpen((v) => !v)}
                    aria-label={locale === 'tr' ? 'Koleksiyonları göster' : 'Show collections'}
                    aria-expanded={desktopDropdownOpen}
                    className={`flex h-full items-center border-l px-2 transition-colors ${
                      isActive('/custom-registry')
                        ? 'border-white/30 hover:bg-white/10'
                        : 'border-bureau-black hover:bg-bureau-black hover:text-bureau-white'
                    }`}
                  >
                    <svg
                      width="9"
                      height="6"
                      viewBox="0 0 9 6"
                      fill="none"
                      className={`transition-transform duration-150 ${desktopDropdownOpen ? 'rotate-180' : ''}`}
                    >
                      <path d="M1 1L4.5 5L8 1" stroke="currentColor" strokeWidth="1.3" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Dropdown panel */}
              {desktopDropdownOpen && collections.length > 0 && (
                <div className="absolute left-0 top-[calc(100%+6px)] z-50 w-[260px] border border-bureau-black bg-white shadow-lg">
                  <div className="border-b border-bureau-rule px-3.5 py-2">
                    <span className="font-mono text-[9.5px] uppercase tracking-widest text-bureau-muted">
                      {locale === 'tr' ? 'Koleksiyonlar' : 'Collections'}
                    </span>
                  </div>
                  <div className="max-h-[320px] overflow-y-auto py-1">
                    {collections.map((collection) => {
                      const key = collection.key.current
                      const name = getLocalizedValue(collection.name, locale, '—')
                      return (
                        <button
                          key={collection._id}
                          onClick={() => goToCollection(key)}
                          className="block w-full px-3.5 py-2 text-left font-mono text-[11px] uppercase tracking-wide text-bureau-black transition-colors hover:bg-bureau-surface hover:text-bureau-amber"
                        >
                          {name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {NAV_ITEMS.map(({ href, labelKey }) => (
              <Link
                key={href}
                href={href}
                className={`
                  font-mono text-[11px] tracking-wider uppercase no-underline
                  transition-opacity duration-150
                  ${isActive(href) ? 'text-bureau-black font-semibold' : 'text-bureau-black opacity-70 hover:opacity-100'}
                `}
              >
                {t(labelKey)}
              </Link>
            ))}
          </nav>

          {/* Desktop right */}
          <div className="hidden items-center gap-6 mt-1 lg:flex">
            <button
              onClick={switchLocale}
              className="font-mono text-[10px] tracking-wider uppercase text-bureau-muted hover:text-bureau-black transition-colors"
              aria-label={`Switch to ${otherLocale.toUpperCase()}`}
            >
              <span className={locale === 'tr' ? 'text-bureau-black font-semibold' : 'opacity-50'}>TR</span>
              <span className="mx-1 opacity-30">/</span>
              <span className={locale === 'en' ? 'text-bureau-black font-semibold' : 'opacity-50'}>EN</span>
            </button>
            <Link
              href="/cart"
              className="border-l border-bureau-black pl-6 font-mono text-[11px] tracking-wider uppercase text-bureau-black no-underline hover:text-bureau-amber transition-colors"
            >
              Cart ({String(displayCount).padStart(2, '0')})
            </Link>
          </div>

          {/* Mobile right: cart + hamburger */}
          <div className="flex items-center gap-4 lg:hidden">
            <Link
              href="/cart"
              className="font-mono text-[11px] tracking-wider uppercase text-bureau-black no-underline"
              onClick={() => setMenuOpen(false)}
            >
              Cart ({String(displayCount).padStart(2, '0')})
            </Link>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-8 w-8 flex-col items-center justify-center gap-1.5"
              aria-label={menuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
            >
              <span className={`block h-px w-6 bg-bureau-black transition-all duration-200 ${menuOpen ? 'translate-y-[3.5px] rotate-45' : ''}`} />
              <span className={`block h-px w-6 bg-bureau-black transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-px w-6 bg-bureau-black transition-all duration-200 ${menuOpen ? '-translate-y-[3.5px] -rotate-45' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-30 flex flex-col bg-white lg:hidden">
          {/* Overlay header */}
          <div className="flex items-center justify-between border-b border-bureau-black px-5 py-4">
            <Link href="/" className="no-underline flex items-center gap-3" onClick={() => setMenuOpen(false)}>
              <Image
                src="/logo.png"
                alt="The Ambience Bureau"
                width={40}
                height={40}
              />
              <div className="text-sm font-semibold tracking-[0.12em] uppercase text-bureau-black">
                The Ambience Bureau
              </div>
            </Link>
            <button
              onClick={() => setMenuOpen(false)}
              className="flex h-8 w-8 flex-col items-center justify-center gap-1.5"
              aria-label="Menüyü kapat"
            >
              <span className="block h-px w-6 bg-bureau-black translate-y-[3.5px] rotate-45" />
              <span className="block h-px w-6 bg-bureau-black -translate-y-[3.5px] -rotate-45" />
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex flex-col divide-y divide-bureau-rule overflow-y-auto flex-1">
            {/* Custom Registry — link + açılır alt liste */}
            <div>
              <div className={`flex items-stretch ${isActive('/custom-registry') ? 'text-bureau-amber' : 'text-bureau-black'}`}>
                <Link
                  href="/custom-registry"
                  onClick={() => setMenuOpen(false)}
                  className="flex flex-1 items-center gap-3 px-5 py-5 font-mono text-[12px] tracking-wider uppercase no-underline"
                >
                  <span className="h-[5px] w-[5px] rounded-full bg-bureau-amber flex-shrink-0" />
                  {t('customRegistry')}
                </Link>
                {collections.length > 0 && (
                  <button
                    onClick={() => setMobileSubOpen((v) => !v)}
                    aria-label={locale === 'tr' ? 'Koleksiyonları göster' : 'Show collections'}
                    className="flex items-center px-5"
                  >
                    <svg
                      width="11"
                      height="7"
                      viewBox="0 0 9 6"
                      fill="none"
                      className={`transition-transform duration-150 ${mobileSubOpen ? 'rotate-180' : ''}`}
                    >
                      <path d="M1 1L4.5 5L8 1" stroke="currentColor" strokeWidth="1.3" />
                    </svg>
                  </button>
                )}
              </div>

              {mobileSubOpen && collections.length > 0 && (
                <div className="border-t border-bureau-rule bg-bureau-surface">
                  {collections.map((collection) => {
                    const key = collection.key.current
                    const name = getLocalizedValue(collection.name, locale, '—')
                    return (
                      <button
                        key={collection._id}
                        onClick={() => goToCollection(key)}
                        className="block w-full px-8 py-3.5 text-left font-mono text-[11.5px] uppercase tracking-wide text-bureau-black"
                      >
                        {name}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {NAV_ITEMS.map(({ href, labelKey }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`block px-5 py-5 font-mono text-[12px] tracking-wider uppercase no-underline transition-colors ${
                  isActive(href) ? 'text-bureau-amber font-semibold' : 'text-bureau-black'
                }`}
              >
                {t(labelKey)}
              </Link>
            ))}
          </nav>

          {/* Bottom: locale + cart */}
          <div className="flex items-center justify-between border-t border-bureau-black px-5 py-5">
            <button
              onClick={switchLocale}
              className="font-mono text-[11px] tracking-wider uppercase text-bureau-muted"
            >
              <span className={locale === 'tr' ? 'text-bureau-black font-semibold' : 'opacity-50'}>TR</span>
              <span className="mx-1 opacity-30">/</span>
              <span className={locale === 'en' ? 'text-bureau-black font-semibold' : 'opacity-50'}>EN</span>
            </button>
            <Link
              href="/cart"
              onClick={() => setMenuOpen(false)}
              className="font-mono text-[11px] tracking-wider uppercase text-bureau-black no-underline"
            >
              Cart ({String(displayCount).padStart(2, '0')})
            </Link>
          </div>
        </div>
      )}
    </>
  )
}