import createMiddleware from 'next-intl/middleware'
import type { NextRequest } from 'next/server'
import { routing } from '@/i18n/routing'
import { updateSupabaseSession } from '@/lib/supabase/middleware'

const handleI18nRouting = createMiddleware(routing)

// next-intl'in kendi cookie konvansiyonu — bir kere set edilince, bir
// sonraki tüm istekler için Accept-Language'den DAHA ÖNCELİKLİ okunur.
// Kullanıcı elle dil değiştirdiğinde de next-intl bu cookie'yi otomatik
// günceller — yani geo-tespiti aşağıda SADECE bu cookie hiç yoksa
// (gerçekten ilk ziyaret) devreye giriyor, sonraki ziyaretlerde veya
// elle yapılan değişikliklerde tekrar araya girmiyor.
const LOCALE_COOKIE = 'NEXT_LOCALE'

/**
 * NOT: Bu proje önceden next-intl'in varsayılan davranışına göre dili
 * TARAYICI DİLİNE (Accept-Language header) göre seçiyordu — ülkeye göre
 * DEĞİL. "Türkiye'deki kullanıcıya Türkçe, dışarıdaki kullanıcıya
 * İngilizce" kuralı için bunun yerine Vercel'in her isteğe otomatik
 * eklediği `x-vercel-ip-country` header'ını (gerçek coğrafi konum)
 * kullanıyoruz. Bu header sadece Vercel'de üretim ortamında mevcuttur —
 * yerel geliştirmede (`next dev`) bulunmaz, o durumda sessizce eski
 * (Accept-Language tabanlı) davranışa düşülür.
 */
function resolveGeoLocale(request: NextRequest): 'tr' | 'en' | null {
  const country = request.headers.get('x-vercel-ip-country')
  if (!country) return null // Vercel dışı/yerel ortam — geo verisi yok
  return country === 'TR' ? 'tr' : 'en'
}

export async function proxy(request: NextRequest) {
  const hasLocaleCookie = request.cookies.has(LOCALE_COOKIE)
  let geoLocale: 'tr' | 'en' | null = null

  if (!hasLocaleCookie) {
    geoLocale = resolveGeoLocale(request)
    if (geoLocale) {
      // next-intl'in middleware'i bu isteği işlerken cookie'yi Accept-
      // Language'den önce okuyacak şekilde, gelen request'in cookie
      // jar'ına şimdiden yazıyoruz.
      request.cookies.set(LOCALE_COOKIE, geoLocale)
    }
  }

  const response = handleI18nRouting(request)

  if (geoLocale) {
    // Kararı response'a da yaz ki tarayıcı bunu kalıcı olarak saklasın —
    // bir sonraki ziyarette tekrar geo-tespiti yapılmasın.
    response.cookies.set(LOCALE_COOKIE, geoLocale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 yıl
      sameSite: 'lax',
    })
  }

  const firstSegment = request.nextUrl.pathname.split('/')[1]
  if ((routing.locales as readonly string[]).includes(firstSegment)) {
    response.headers.set('x-locale', firstSegment)
  }

  await updateSupabaseSession(request, response)
  return response
}

export const config = {
  // /api, /auth (Supabase OAuth callback — locale-agnostic olmalı), /studio
  // (Sanity Studio — kendi yönlendirmesini yapar), Next.js dahili yolları
  // (_next, _vercel) ve statik dosyaları (uzantılı olanlar) hariç tutar.
  matcher: ['/((?!api|auth|studio|_next|_vercel|.*\\..*).*)'],
}