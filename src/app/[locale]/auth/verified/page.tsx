'use client'

import { useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'

export default function VerifiedPage() {
  const locale = useLocale()
  const tr = locale === 'tr'

  return (
    <div className="flex flex-1 items-center justify-center px-5 py-16">
      <div className="w-full max-w-md border border-bureau-black">

        <div className="border-b border-bureau-black bg-bureau-black px-5 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/60">
              FORM 100-E // IDENTITY CONFIRMED
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-bureau-amber">
              VERIFIED
            </span>
          </div>
        </div>

        <div className="px-7 py-10 text-center">
          {/* Animasyonlu onay */}
          <div className="mb-6 flex items-center justify-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bureau-amber opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-bureau-amber" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-bureau-amber">
              {tr ? 'Kimlik Doğrulandı' : 'Identity Confirmed'}
            </span>
          </div>

          <h1 className="mb-2 text-[26px] font-light uppercase leading-tight tracking-wide text-bureau-black">
            {tr ? 'E-postanız' : 'Your Email'}
          </h1>
          <h1 className="mb-6 text-[26px] font-light uppercase leading-tight tracking-wide text-bureau-amber">
            {tr ? 'Doğrulandı' : 'Has Been Verified'}
          </h1>

          <div className="mx-auto mb-6 max-w-xs border border-bureau-rule bg-bureau-surface px-4 py-3">
            <p className="font-mono text-[9.5px] leading-relaxed text-bureau-subtle">
              {tr
                ? '[SİSTEM: Kimliğiniz sicil sistemine kayıt edilmiştir. Giriş yaparak hesabınıza erişebilirsiniz.]'
                : '[SYSTEM: Your identity has been registered in the registry system. You may now access your account.]'}
            </p>
          </div>

          <p className="mb-8 text-[13px] leading-relaxed text-bureau-muted">
            {tr
              ? 'Hesabınız aktif edildi. Sicil sistemine erişmek için giriş yapın.'
              : 'Your account has been activated. Sign in to access the registry system.'}
          </p>

          <div className="space-y-3">
            <Link href="/auth/login" className="btn-bureau block w-full text-center">
              {tr ? 'Giriş Yap' : 'Sign In'}
            </Link>
            <Link href="/registry" className="btn-bureau-outline block w-full text-center">
              {tr ? 'Kayda Göz At' : 'Browse Registry'}
            </Link>
          </div>
        </div>

        <div className="border-t border-bureau-rule bg-bureau-surface px-5 py-2.5">
          <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-bureau-subtle">
            The Ambience Bureau // Registry System // Est. 2026
          </span>
        </div>
      </div>
    </div>
  )
}