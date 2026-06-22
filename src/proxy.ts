import createMiddleware from 'next-intl/middleware'
import { type NextRequest } from 'next/server'
import { routing } from './i18n/routing'
import { updateSupabaseSession } from './lib/supabase/middleware'

const intlMiddleware = createMiddleware(routing)

export async function proxy(request: NextRequest) {
  // 1. Önce next-intl locale yönlendirmesini çalıştır
  const response = intlMiddleware(request)

  // 2. Supabase session'ını next-intl'in ürettiği response üzerine yenile
  //    (response NextResponse tipinde, intl middleware'i bunu garanti eder)
  return updateSupabaseSession(request, response)
}

export const config = {
  matcher: [
    // next-intl: locale prefix gereken tüm path'ler
    // /studio, /api, /auth/callback Supabase session yenilemesine de ihtiyaç duymaz, hariç tutulur
    '/((?!_next|_vercel|studio|api|auth/callback|.*\\..*).*)',
  ],
}
