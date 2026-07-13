import createMiddleware from 'next-intl/middleware'
import type { NextRequest } from 'next/server'
import { routing } from '@/i18n/routing'
import { updateSupabaseSession } from '@/lib/supabase/middleware'

const handleI18nRouting = createMiddleware(routing)

/**
 * NOT: Next.js 16'da dosya konvansiyonu "middleware.ts" -> "proxy.ts" ve
 * export edilen fonksiyon adı "middleware" -> "proxy" olarak değişti.
 * (next-intl'in kendi createMiddleware() fonksiyonunun adı aynı kalıyor —
 * sadece BİZİM dışa aktardığımız fonksiyonun adı ve dosya adı değişti.)
 *
 * Bu dosya önceden hiç yoktu. Sonucu:
 *  1) "/" (çıplak kök domain) next-intl tarafından hiç yönetilmiyordu —
 *     localePrefix:'always' olduğu için muhtemelen 404 dönüyordu.
 *  2) src/lib/supabase/middleware.ts içindeki updateSupabaseSession hiçbir
 *     yerden çağrılmıyordu — tarayıcıdaki Supabase session cookie'leri
 *     otomatik yenilenmiyordu.
 *  3) <html lang="tr"> src/app/layout.tsx'te sabit kodluydu.
 * Bu dosya üçünü birden çözüyor.
 */
export async function proxy(request: NextRequest) {
  const response = handleI18nRouting(request)

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