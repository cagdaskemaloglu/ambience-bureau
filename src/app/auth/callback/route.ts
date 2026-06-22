import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * Magic link / email doğrulama sonrası Supabase'in yönlendirdiği route.
 * Bu route locale prefix DIŞINDA çalışır (middleware matcher'da hariç tutulmalı,
 * çünkü Supabase redirect URL'i sabit olmalı).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/tr/account'

  if (code) {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Hata durumunda login sayfasına geri dön
  return NextResponse.redirect(`${origin}/tr/auth/login?error=auth_callback_failed`)
}
