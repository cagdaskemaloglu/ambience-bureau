import createMiddleware from 'next-intl/middleware'
import type { NextRequest } from 'next/server'
import { routing } from '@/i18n/routing'
import { updateSupabaseSession } from '@/lib/supabase/middleware'

const handleI18nRouting = createMiddleware(routing)

/**
 * KRİTİK: Bu dosya projede hiç yoktu. Sonucu:
 *  1) "/" (çıplak kök domain) next-intl tarafından hiç yönetilmiyordu —
 *     localePrefix:'always' olduğu için muhtemelen 404 dönüyordu, çünkü
 *     onu /tr'ye yönlendirecek middleware çalışmıyordu.
 *  2) src/lib/supabase/middleware.ts içindeki updateSupabaseSession hiçbir
 *     yerden çağrılmıyordu — tarayıcıdaki Supabase session cookie'leri
 *     otomatik yenilenmiyordu.
 *  3) <html lang="tr"> src/app/layout.tsx'te sabit kodluydu; İngilizce
 *     sayfalarda bile "tr" kalıyordu (SEO/erişilebilirlik sorunu).
 * Bu dosya üçünü birden çözüyor: next-intl routing çalışır hale geliyor,
 * Supabase cookie'leri her istekte yenileniyor, ve algılanan dil bir
 * response header'ına yazılıp root layout'ta <html lang> için okunuyor.
 */
export default async function middleware(request: NextRequest) {
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
