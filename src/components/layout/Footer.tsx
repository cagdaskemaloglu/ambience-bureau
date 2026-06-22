'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'

export function Footer() {
  const t = useTranslations('footer.protocols')
  const [email, setEmail] = useState('')

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault()
    // TODO: Resend ile newsletter entegrasyonu (Faz 10)
    setEmail('')
  }

  return (
    <footer className="border-t border-bureau-black">
      <div className="grid grid-cols-4 gap-0">
        {/* Protocol 01 */}
        <div className="border-r border-bureau-black px-8 py-7">
          <div className="font-mono text-[10px] tracking-widest text-bureau-amber mb-1.5">
            {t('01.code')}
          </div>
          <div className="text-[11.5px] uppercase tracking-bureau font-medium mb-1.5">
            {t('01.title')}
          </div>
          <div className="text-[11px] text-bureau-muted leading-relaxed">
            {t('01.desc')}
          </div>
        </div>

        {/* Protocol 02 */}
        <div className="border-r border-bureau-black px-8 py-7">
          <div className="font-mono text-[10px] tracking-widest text-bureau-amber mb-1.5">
            {t('02.code')}
          </div>
          <div className="text-[11.5px] uppercase tracking-bureau font-medium mb-1.5">
            {t('02.title')}
          </div>
          <div className="text-[11px] text-bureau-muted leading-relaxed">
            {t('02.desc')}
          </div>
        </div>

        {/* Protocol 03 */}
        <div className="border-r border-bureau-black px-8 py-7">
          <div className="font-mono text-[10px] tracking-widest text-bureau-amber mb-1.5">
            {t('03.code')}
          </div>
          <div className="text-[11.5px] uppercase tracking-bureau font-medium mb-1.5">
            {t('03.title')}
          </div>
          <div className="text-[11px] text-bureau-muted leading-relaxed">
            {t('03.desc')}
          </div>
        </div>

        {/* Protocol 04 — Newsletter */}
        <div className="px-8 py-7">
          <div className="font-mono text-[10px] tracking-widest text-bureau-amber mb-1.5">
            {t('04.code')}
          </div>
          <div className="text-[11.5px] uppercase tracking-bureau font-medium mb-1.5">
            {t('04.title')}
          </div>
          <div className="text-[11px] text-bureau-muted leading-relaxed mb-3">
            {t('04.desc')}
          </div>
          <form onSubmit={handleSubscribe} className="flex gap-0">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('04.placeholder')}
              required
              className="
                flex-1 border border-bureau-black bg-transparent
                px-3 py-2 font-mono text-[11px] tracking-wide
                placeholder:text-bureau-subtle
                focus:outline-none focus:border-bureau-amber
              "
            />
            <button
              type="submit"
              className="
                border border-l-0 border-bureau-black
                bg-bureau-black text-bureau-white
                px-4 py-2 font-mono text-[10px] tracking-wider uppercase
                hover:bg-bureau-amber hover:border-bureau-amber
                transition-colors duration-150
              "
            >
              →
            </button>
          </form>
        </div>
      </div>

      {/* Copyright strip */}
      <div className="border-t border-bureau-black px-10 py-4 flex justify-between items-center">
        <span className="font-mono text-[10px] tracking-widest text-bureau-subtle uppercase">
          © {new Date().getFullYear()} The Ambience Bureau. All rights reserved.
        </span>
        <span className="font-mono text-[10px] tracking-widest text-bureau-subtle uppercase">
          DOC. REF: TAB-2026-SYS-01
        </span>
      </div>
    </footer>
  )
}
