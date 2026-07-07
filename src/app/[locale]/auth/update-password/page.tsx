'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'

export default function UpdatePasswordPage() {
  const locale = useLocale()
  const router = useRouter()
  const tr = locale === 'tr'
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError(tr ? 'Şifre en az 8 karakter olmalıdır.' : 'Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError(tr ? 'Şifreler eşleşmiyor.' : 'Passwords do not match.')
      return
    }
    setLoading(true)
    setError(null)

    const supabase = createSupabaseClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(tr ? 'Şifre güncellenemedi.' : 'Could not update password.')
      setLoading(false)
    } else {
      router.push('/account')
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-5 py-16">
      <div className="w-full max-w-md border border-bureau-black">
        <div className="border-b border-bureau-black bg-bureau-black px-5 py-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/60">
            FORM 100-D // NEW PASSWORD
          </span>
        </div>

        <div className="px-7 py-8">
          <h1 className="mb-1 text-[24px] font-light uppercase tracking-wide text-bureau-black">
            {tr ? 'Yeni Şifre' : 'New Password'}
          </h1>
          <p className="mb-6 font-mono text-[10px] uppercase tracking-wider text-bureau-muted">
            {tr ? 'Yeni şifrenizi belirleyin' : 'Set your new password'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block font-mono text-[9.5px] uppercase tracking-wider text-bureau-muted">
                {tr ? 'Yeni Şifre' : 'New Password'}
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
            <div>
              <label className="mb-1 block font-mono text-[9.5px] uppercase tracking-wider text-bureau-muted">
                {tr ? 'Şifre Tekrar' : 'Confirm Password'}
              </label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                className="w-full border border-bureau-black px-3 py-2 font-mono text-[12px] outline-none focus:border-bureau-amber"
              />
            </div>
            {error && <p className="text-[11px] text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="btn-bureau w-full disabled:opacity-50">
              {loading ? (tr ? 'Güncelleniyor...' : 'Updating...') : (tr ? 'Şifreyi Güncelle' : 'Update Password')}
            </button>
          </form>
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