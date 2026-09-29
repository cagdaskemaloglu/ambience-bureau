'use client'

import { useTheme } from './ThemeProvider'

/**
 * Güneş/ay ikonu geçiş butonu. `className` ile boyut/konum override
 * edilebilir — Header.tsx'te masaüstü ve mobil satırlarda iki farklı
 * boyutta kullanılıyor.
 */
export function ThemeToggle({
  locale,
  className = '',
}: {
  locale: string
  className?: string
}) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        isDark
          ? locale === 'tr'
            ? 'Aydınlık moda geç'
            : 'Switch to light mode'
          : locale === 'tr'
            ? 'Karanlık moda geç'
            : 'Switch to dark mode'
      }
      title={isDark ? (locale === 'tr' ? 'Aydınlık mod' : 'Light mode') : locale === 'tr' ? 'Karanlık mod' : 'Dark mode'}
      className={`flex h-7 w-7 flex-shrink-0 items-center justify-center text-bureau-black transition-colors hover:text-bureau-amber ${className}`}
    >
      {isDark ? (
        // Güneş — tıklanınca aydınlık moda geçer
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        // Ay — tıklanınca karanlık moda geçer
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
        </svg>
      )}
    </button>
  )
}
