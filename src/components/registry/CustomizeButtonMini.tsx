'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'

/**
 * Registry kartlarında (anasayfa + /registry grid) "Nesne Talep Et"in hemen
 * altında görüntülenir. `isConfigurable` false olduğunda buton görünmeye
 * devam eder ama tıklanamaz ve soluk görünür (Sanity'den aktif/deaktif
 * edilir — bkz. product.ts şemasındaki `isConfigurable` alanı).
 */
export function CustomizeButtonMini({
  slug,
  href,
  isConfigurable,
  compact,
  className,
}: {
  slug: string
  /** Verilirse ?preset=<slug> yerine buraya gider (Montajlı Model kartları). */
  href?: string
  isConfigurable: boolean
  compact?: boolean
  /** Verilirse varsayılan dış boşluk (mt/py) yerine bu kullanılır. */
  className?: string
}) {
  const t = useTranslations('product')
  const router = useRouter()

  function handleClick(e: React.MouseEvent) {
    // Kart tamamen bir <Link> — bu butona tıklamak ürün detay sayfasına
    // yönlendirmeyi TETİKLEMEMELİ.
    e.preventDefault()
    e.stopPropagation()

    if (!isConfigurable) return
    // Anasayfadaysak konfigüratör AYNI SAYFADA, ilk ekranın içinde açılır
    // (HomeIndex 'bureau:open-studio' olayını dinler ve preventDefault eder).
    if (href) {
      const q = new URLSearchParams(href.split('?')[1] ?? '')
      const collection = q.get('collection')
      if (collection) {
        const ev = new CustomEvent('bureau:open-studio', {
          detail: { collection, model: q.get('model') ?? undefined },
          cancelable: true,
        })
        if (!window.dispatchEvent(ev)) return
      }
    }
    router.push(href ?? `/custom-registry?preset=${slug}`)
  }

  return (
    <button
      onClick={handleClick}
      disabled={!isConfigurable}
      aria-disabled={!isConfigurable}
      className={`w-full border border-bureau-amber font-mono text-[9px] font-semibold uppercase tracking-wide text-bureau-amber transition-colors enabled:hover:bg-bureau-amber enabled:hover:text-white disabled:cursor-not-allowed disabled:border-bureau-rule disabled:text-bureau-subtle ${className ?? (compact ? 'mt-1 py-1' : 'mt-1.5 py-1.5')}`}
    >
      {t('customize')}
    </button>
  )
}