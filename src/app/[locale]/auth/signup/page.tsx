'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useRouter } from '@/i18n/navigation'
import { signUpWithEmail, signInWithGoogle } from '@/lib/supabase/auth'

export default function SignupPage() {
  const locale = useLocale()
  const router = useRouter()
  const tr = locale === 'tr'

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError(tr ? 'Şifre en az 8 karakter olmalıdır.' : 'Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    setError(null)

    const { error } = await signUpWithEmail(email, password, fullName)
    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  async function handleGoogleLogin() {
    setLoading(true)
    const { error } = await signInWithGoogle(locale)
    if (error) {
      setError(tr ? 'Google ile giriş başarısız.' : 'Google sign-in failed.')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-5 py-16">
      <div className="w-full max-w-md border border-bureau-black">

        {/* Header */}
        <div className="border-b border-bureau-black bg-bureau-black px-5 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/60">
              FORM 100-B // NEW REGISTRY APPLICANT
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-bureau-amber">
              OPEN
            </span>
          </div>
        </div>

        <div className="px-7 py-8">
          {success ? (
            <div className="text-center">
              <div className="mb-4 flex items-center justify-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bureau-amber opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-bureau-amber" />
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-bureau-amber">
                  {tr ? 'Başvuru Alındı' : 'Application Received'}
                </span>
              </div>
              <h2 className="mb-3 text-[20px] font-light uppercase tracking-wide">
                {tr ? 'E-postanızı Doğrulayın' : 'Verify Your Email'}
              </h2>
              <p className="mb-5 text-[12px] leading-relaxed text-bureau-muted">
                {tr
                  ? `${email} adresine bir doğrulama bağlantısı gönderildi. Sicil sistemine erişmek için e-postanızı doğrulayın.`
                  : `A verification link has been dispatched to ${email}. Please verify your email to access the registry system.`}
              </p>
              <Link href="/auth/login" className="btn-bureau-outline inline-block">
                {tr ? 'Giriş Sayfasına Dön' : 'Return to Sign In'}
              </Link>
            </div>
          ) : (
            <>
              <h1 className="mb-1 text-[26px] font-light uppercase tracking-wide text-bureau-black">
                {tr ? 'Kayıt Ol' : 'Register'}
              </h1>
              <p className="mb-6 font-mono text-[10px] uppercase tracking-wider text-bureau-muted">
                {tr ? 'Yeni Sicil Başvurusu' : 'New Registry Application'}
              </p>

              {/* Google */}
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="mb-5 flex w-full items-center justify-center gap-3 border border-bureau-black py-2.5 font-mono text-[11px] uppercase tracking-wider transition-colors hover:bg-bureau-surface disabled:opacity-50"
              >
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {tr ? 'Google ile Kayıt Ol' : 'Continue with Google'}
              </button>

              <div className="mb-5 flex items-center gap-3">
                <div className="flex-1 border-t border-bureau-rule" />
                <span className="font-mono text-[9px] uppercase tracking-widest text-bureau-subtle">
                  {tr ? 'veya' : 'or'}
                </span>
                <div className="flex-1 border-t border-bureau-rule" />
              </div>

              <form onSubmit={handleSignup} className="space-y-3">
                <div>
                  <label className="mb-1 block font-mono text-[9.5px] uppercase tracking-wider text-bureau-muted">
                    {tr ? 'Ad Soyad' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required
                    className="w-full border border-bureau-black px-3 py-2 font-mono text-[12px] outline-none focus:border-bureau-amber"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-mono text-[9.5px] uppercase tracking-wider text-bureau-muted">
                    {tr ? 'E-posta' : 'Email'}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full border border-bureau-black px-3 py-2 font-mono text-[12px] outline-none focus:border-bureau-amber"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-mono text-[9.5px] uppercase tracking-wider text-bureau-muted">
                    {tr ? 'Şifre (en az 8 karakter)' : 'Password (min. 8 characters)'}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full border border-bureau-black px-3 py-2 font-mono text-[12px] outline-none focus:border-bureau-amber"
                  />
                </div>
                {error && <p className="text-[11px] text-red-600">{error}</p>}
                <button type="submit" disabled={loading} className="btn-bureau w-full disabled:opacity-50">
                  {loading ? (tr ? 'Kaydediliyor...' : 'Registering...') : (tr ? 'Kayıt Ol' : 'Register')}
                </button>
              </form>

              <div className="mt-5 border-t border-bureau-rule pt-5 text-center">
                <span className="font-mono text-[10px] text-bureau-muted">
                  {tr ? 'Zaten üye misin?' : 'Already registered?'}{' '}
                </span>
                <Link href="/auth/login" className="font-mono text-[10px] uppercase tracking-wide text-bureau-black underline hover:text-bureau-amber">
                  {tr ? 'Giriş Yap' : 'Sign In'}
                </Link>
              </div>
            </>
          )}
        </div>

        <div className="border-t border-bureau-rule bg-bureau-surface px-5 py-2.5">
          <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-bureau-subtle">
            The Ambience Bureau // Registry Application System
          </span>
        </div>
      </div>
    </div>
  )
}