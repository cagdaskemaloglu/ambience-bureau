'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

/**
 * Ürün detay sayfasında "Nesne Talep Et" butonunun hemen altında görüntülenir.
 * `isConfigurable` false olduğunda buton görünmeye devam eder ama tıklanamaz
 * ve soluk görünür (Sanity'den aktif/deaktif edilir — bkz. product.ts
 * şemasındaki `isConfigurable` alanı).
 */
export function CustomizeButton({ slug, isConfigurable }: { slug: string; isConfigurable: boolean }) {
  const t = useTranslations('product')

  if (!isConfigurable) {
    return (
      <button disabled className="btn-bureau-outline mt-2.5 w-full cursor-not-allowed opacity-40">
        {t('customize')}
      </button>
    )
  }

  return (
    <Link href={`/custom-registry?preset=${slug}`} className="btn-bureau-outline mt-2.5 block w-full text-center">
      {t('customize')}
    </Link>
  )
}