import { createSupabaseClient } from './client'

// ── Üyelik İşlemleri (Client-side) ────────────────────────

export async function signUpWithEmail(email: string, password: string, fullName?: string) {
  const supabase = createSupabaseClient()
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName ?? '' },
    },
  })
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = createSupabaseClient()
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signInWithGoogle(locale: string = 'tr') {
  const supabase = createSupabaseClient()
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback?next=/${locale}/account`,
    },
  })
}

export async function signInWithMagicLink(email: string, locale: string = 'tr') {
  const supabase = createSupabaseClient()
  return supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback?next=/${locale}/account`,
    },
  })
}

export async function signOut() {
  const supabase = createSupabaseClient()
  return supabase.auth.signOut()
}

export async function getCurrentUser() {
  const supabase = createSupabaseClient()
  const { data } = await supabase.auth.getUser()
  return data.user
}

export async function getProfile(userId: string) {
  const supabase = createSupabaseClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) return null
  return data
}

// ── Misafir Session Yönetimi ──────────────────────────────

const GUEST_SESSION_KEY = 'tab_guest_session_id'

export function getOrCreateGuestSessionId(): string {
  if (typeof window === 'undefined') return ''
  let sessionId = localStorage.getItem(GUEST_SESSION_KEY)
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem(GUEST_SESSION_KEY, sessionId)
  }
  return sessionId
}

export function clearGuestSessionId() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(GUEST_SESSION_KEY)
}