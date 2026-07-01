'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useRouter } from '@/i18n/navigation'
import { signInWithEmail, signInWithGoogle } from '@/lib/supabase/auth'

export default function LoginPage() {
  const locale = useLocale()
  const router = useRouter()
  const [mode, setMode] = useState<'password' | 'magic'>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [magicSent, setMagicSent] = useState(false)

  const tr = locale === 'tr'

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await signInWithEmail(email, password)
    if (error) {
      setError(tr ? 'E-posta veya şifre hatalı.' : 'Invalid email or password.')
    } else {
      router.push('/account')
    }
    setLoading(false)
  }

  async function handleGoogleLogin() {
    setLoading(true)
    setError(null)
    const { error } = await signInWithGoogle(locale)
    if (error) {
      setError(tr ? 'Google ile giriş başarısız.' : 'Google sign-in failed.')
      setLoading(false)
    }
    // Google redirect — sayfa değişir, loading true kalır
  }

  return (
    <div className="flex flex-1 items-center justify-center px-5 py-16">
      <div className="w-full max-w-md border border-bureau-black">

        {/* Header */}
        <div className="border-b border-bureau-black bg-bureau-black px-5 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/60">
              FORM 100-A // IDENTITY VERIFICATION
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-bureau-amber">
              SECURE
            </span>
          </div>
        </div>

        <div className="px-7 py-8">
          <h1 className="mb-1 text-[26px] font-light uppercase tracking-wide text-bureau-black">
            {tr ? 'Giriş Yap' : 'Sign In'}
          </h1>
          <p className="mb-6 font-mono text-[10px] uppercase tracking-wider text-bureau-muted">
            {tr ? 'Sicil Sistemine Erişim' : 'Registry System Access'}
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
            {tr ? 'Google ile Giriş Yap' : 'Continue with Google'}
          </button>

          <div className="mb-5 flex items-center gap-3">
            <div className="flex-1 border-t border-bureau-rule" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-bureau-subtle">
              {tr ? 'veya' : 'or'}
            </span>
            <div className="flex-1 border-t border-bureau-rule" />
          </div>

          {/* Mode toggle */}
          <div className="mb-5 flex border border-bureau-rule">
            <button
              onClick={() => setMode('password')}
              className={`flex-1 py-2 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                mode === 'password' ? 'bg-bureau-black text-white' : 'text-bureau-muted hover:text-bureau-black'
              }`}
            >
              {tr ? 'Şifre ile' : 'Password'}
            </button>
            <button
              onClick={() => setMode('magic')}
              className={`flex-1 border-l border-bureau-rule py-2 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                mode === 'magic' ? 'bg-bureau-black text-white' : 'text-bureau-muted hover:text-bureau-black'
              }`}
            >
              Magic Link
            </button>
          </div>

          {mode === 'password' ? (
            <form onSubmit={handleEmailLogin} className="space-y-3">
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
                  {tr ? 'Şifre' : 'Password'}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full border border-bureau-black px-3 py-2 font-mono text-[12px] outline-none focus:border-bureau-amber"
                />
              </div>
              {error && <p className="text-[11px] text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="btn-bureau w-full disabled:opacity-50"
              >
                {loading ? (tr ? 'Giriş yapılıyor...' : 'Signing in...') : (tr ? 'Giriş Yap' : 'Sign In')}
              </button>
            </form>
          ) : (
            <MagicLinkForm locale={locale} />
          )}

          <div className="mt-5 border-t border-bureau-rule pt-5 text-center">
            <span className="font-mono text-[10px] text-bureau-muted">
              {tr ? 'Hesabın yok mu?' : "Don't have an account?"}{' '}
            </span>
            <Link href="/auth/signup" className="font-mono text-[10px] uppercase tracking-wide text-bureau-black underline hover:text-bureau-amber">
              {tr ? 'Kayıt Ol' : 'Register'}
            </Link>
          </div>
        </div>

        <div className="border-t border-bureau-rule bg-bureau-surface px-5 py-2.5">
          <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-bureau-subtle">
            The Ambience Bureau // Secure Registry Access
          </span>
        </div>
      </div>
    </div>
  )
}

function MagicLinkForm({ locale }: { locale: string }) {
  const tr = locale === 'tr'
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { signInWithMagicLink } = await import('@/lib/supabase/auth')
    const { error } = await signInWithMagicLink(email, locale)
    if (error) {
      setError(tr ? 'Bağlantı gönderilemedi.' : 'Could not send link.')
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="border border-bureau-amber bg-bureau-amber/5 p-4 text-center">
        <p className="font-mono text-[10px] uppercase tracking-widest text-bureau-amber">
          {tr ? 'Bağlantı Gönderildi' : 'Link Dispatched'}
        </p>
        <p className="mt-1 text-[12px] text-bureau-muted">
          {tr ? `${email} adresine giriş bağlantısı gönderildi.` : `A sign-in link has been sent to ${email}.`}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
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
      {error && <p className="text-[11px] text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className="btn-bureau w-full disabled:opacity-50">
        {loading ? (tr ? 'Gönderiliyor...' : 'Sending...') : (tr ? 'Bağlantı Gönder' : 'Send Link')}
      </button>
    </form>
  )
}