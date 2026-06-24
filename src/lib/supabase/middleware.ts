import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Supabase auth session'ını her request'te yeniler (cookie refresh).
 * Middleware içinde next-intl'den SONRA çağrılır, response'a cookie'leri ekler.
 *
 * NOT: .env.local'de Supabase değişkenleri henüz gerçek değerlerle
 * doldurulmadıysa (placeholder/boş ise) bu fonksiyon sessizce atlanır.
 * Bu, Supabase kurulumu tamamlanmadan önce de geliştirmeye devam
 * edilebilmesi için kasıtlı bir güvenlik ağıdır.
 */
export async function updateSupabaseSession(
  request: NextRequest,
  response: NextResponse
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const isConfigured =
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-project') &&
    !supabaseAnonKey.includes('your_anon_key')

  if (!isConfigured) {
    // Supabase henüz kurulmadı — session yenilemeyi atla, response'u olduğu gibi döndür
    return response
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    })

    // Session'ı tetikle — bu çağrı cookie'leri yeniler
    await supabase.auth.getUser()
  } catch (error) {
    // Supabase'e bağlanamazsa middleware'i çökertme, sadece logla
    console.error('[Supabase Middleware] Session yenilenemedi:', error)
  }

  return response
}
