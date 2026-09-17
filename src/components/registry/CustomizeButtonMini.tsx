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
  isConfigurable,
  compact,
}: {
  slug: string
  isConfigurable: boolean
  compact?: boolean
}) {
  const t = useTranslations('product')
  const router = useRouter()

  function handleClick(e: React.MouseEvent) {
    // Kart tamamen bir <Link> — bu butona tıklamak ürün detay sayfasına
    // yönlendirmeyi TETİKLEMEMELİ.
    e.preventDefault()
    e.stopPropagation()

    if (!isConfigurable) return
    router.push(`/custom-registry?preset=${slug}`)
  }

  return (
    <button
      onClick={handleClick}
      disabled={!isConfigurable}
      aria-disabled={!isConfigurable}
      className={`w-full border border-bureau-amber font-mono text-[9px] font-semibold uppercase tracking-wide text-bureau-amber transition-colors enabled:hover:bg-bureau-amber enabled:hover:text-white disabled:cursor-not-allowed disabled:border-bureau-rule disabled:text-bureau-subtle ${compact ? 'mt-1 py-1' : 'mt-1.5 py-1.5'}`}
    >
      {t('customize')}
    </button>
  )
}