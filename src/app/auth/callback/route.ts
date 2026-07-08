import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')
  const type = searchParams.get('type') // 'signup' | 'recovery' | 'magiclink' vb.

  if (code) {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // E-posta doğrulaması → doğrulandı sayfasına yönlendir
      if (type === 'signup' || type === 'email') {
        return NextResponse.redirect(`${origin}/tr/auth/verified`)
      }
      // Şifre sıfırlama → yeni şifre sayfasına
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/tr/auth/update-password`)
      }
      // Diğer (Google, magic link) → next parametresi veya account
      return NextResponse.redirect(`${origin}${next ?? '/tr/account'}`)
    }
    console.error('[auth/callback] exchangeCodeForSession error:', error)
  }

  const errorParam = searchParams.get('error') ?? 'auth_callback_failed'
  console.error('[auth/callback] OAuth error:', errorParam)
  return NextResponse.redirect(`${origin}/tr/auth/login?error=${errorParam}`)
}