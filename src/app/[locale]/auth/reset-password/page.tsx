'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const locale = useLocale()
  const tr = locale === 'tr'
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createSupabaseClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/${locale}/auth/update-password`,
    })

    if (error) {
      setError(tr ? 'E-posta gönderilemedi.' : 'Could not send email.')
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-1 items-center justify-center px-5 py-16">
      <div className="w-full max-w-md border border-bureau-black">
        <div className="border-b border-bureau-black bg-bureau-black px-5 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/60">
              FORM 100-C // PASSWORD RESET
            </span>
          </div>
        </div>

        <div className="px-7 py-8">
          {sent ? (
            <div className="text-center">
              <div className="mb-3 flex items-center justify-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bureau-amber opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-bureau-amber" />
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-bureau-amber">
                  {tr ? 'Bağlantı Gönderildi' : 'Link Dispatched'}
                </span>
              </div>
              <p className="mb-5 text-[13px] leading-relaxed text-bureau-muted">
                {tr
                  ? `${email} adresine şifre sıfırlama bağlantısı gönderildi.`
                  : `A password reset link has been sent to ${email}.`}
              </p>
              <Link href="/auth/login" className="btn-bureau-outline inline-block">
                {tr ? 'Giriş Sayfasına Dön' : 'Return to Sign In'}
              </Link>
            </div>
          ) : (
            <>
              <h1 className="mb-1 text-[24px] font-light uppercase tracking-wide text-bureau-black">
                {tr ? 'Şifremi Unuttum' : 'Reset Password'}
              </h1>
              <p className="mb-6 font-mono text-[10px] uppercase tracking-wider text-bureau-muted">
                {tr ? 'Sıfırlama bağlantısı gönderilecek' : 'Reset link will be dispatched'}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                  {loading
                    ? (tr ? 'Gönderiliyor...' : 'Sending...')
                    : (tr ? 'Sıfırlama Bağlantısı Gönder' : 'Send Reset Link')}
                </button>
              </form>

              <div className="mt-5 border-t border-bureau-rule pt-5 text-center">
                <Link href="/auth/login" className="font-mono text-[10px] uppercase tracking-wide text-bureau-muted underline hover:text-bureau-black">
                  {tr ? 'Giriş Yap' : 'Sign In'}
                </Link>
              </div>
            </>
          )}
        </div>

        <div className="border-t border-bureau-rule bg-bureau-surface px-5 py-2.5">
          <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-bureau-subtle">
            The Ambience Bureau // Registry Access System
          </span>
        </div>
      </div>
    </div>
  )
}