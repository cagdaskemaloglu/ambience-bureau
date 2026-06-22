import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['tr', 'en'],
  defaultLocale: 'tr',
  localePrefix: 'always',
  // NOT: pathnames mapping kasıtlı olarak kullanılmıyor.
  // Tüm route isimleri (registry, custom-registry, bureau, archive, cart...)
  // TR ve EN'de birebir aynı string olarak kalacak — yani URL yapısı
  // /tr/registry ve /en/registry şeklinde, sadece locale prefix değişiyor.
  // Bu hem basitlik hem de "/" kök path yönlendirmesinin güvenilir
  // çalışması için tercih edildi.
})

export type Locale = (typeof routing.locales)[number]
