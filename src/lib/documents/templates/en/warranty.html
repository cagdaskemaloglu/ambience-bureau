import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as 'signup' | 'recovery' | 'magiclink' | 'email' | null
  const next = searchParams.get('next')

  const supabase = await createSupabaseServerClient()

  // Format 1: PKCE flow — code parametresi (Google, magic link)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/tr/auth/update-password`)
      }
      return NextResponse.redirect(`${origin}${next ?? '/tr/account'}`)
    }
    console.error('[auth/callback] code exchange error:', error.message)
  }

  // Format 2: token_hash flow — e-posta doğrulama, şifre sıfırlama
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    })
    if (!error) {
      if (type === 'signup' || type === 'email') {
        return NextResponse.redirect(`${origin}/tr/auth/verified`)
      }
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/tr/auth/update-password`)
      }
      return NextResponse.redirect(`${origin}${next ?? '/tr/account'}`)
    }
    console.error('[auth/callback] token_hash verify error:', error.message)
  }

  console.error('[auth/callback] no valid params', Object.fromEntries(searchParams))
  return NextResponse.redirect(`${origin}/tr/auth/login?error=auth_callback_failed`)
}