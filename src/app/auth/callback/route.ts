import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

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
    console.error('[auth/callback] exchangeCodeForSession error:', error)
  }

  const errorParam = searchParams.get('error') ?? 'auth_callback_failed'
  const errorDesc = searchParams.get('error_description') ?? ''
  console.error('[auth/callback] OAuth error:', errorParam, errorDesc)

  return NextResponse.redirect(
    `${origin}/tr/auth/login?error=${errorParam}`
  )
}