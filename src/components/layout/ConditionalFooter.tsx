'use client'

import { usePathname } from '@/i18n/navigation'
import { Footer } from './Footer'

// Footer'ın GÖRÜNMEYECEĞİ sayfalar — tam ekran/tool tarzı deneyim istenen yerler
const HIDE_FOOTER_PATHS = ['/custom-registry']

export function ConditionalFooter() {
  const pathname = usePathname()
  const shouldHide = HIDE_FOOTER_PATHS.some((path) => pathname.startsWith(path))

  if (shouldHide) return null
  return <Footer />
}
