'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { signOut } from '@/lib/supabase/auth'

const WARRANTY_MONTHS = 24

function warrantyProgress(paidAt: string): { daysLeft: number; percent: number; expired: boolean } {
  const paid = new Date(paidAt)
  const expiry = new Date(paid)
  expiry.setMonth(expiry.getMonth() + WARRANTY_MONTHS)
  const now = new Date()
  const total = expiry.getTime() - paid.getTime()
  const remaining = expiry.getTime() - now.getTime()
  const percent = Math.max(0, Math.min(100, (remaining / total) * 100))
  const daysLeft = Math.max(0, Math.ceil(remaining / (1000 * 60 * 60 * 24)))
  return { daysLeft, percent, expired: remaining <= 0 }
}

export function RegistryStatus({
  profile,
  orders,
  creditTransactions,
  locale,
}: {
  profile: any
  orders: any[]
  creditTransactions: any[]
  locale: 'tr' | 'en'
}) {
  const router = useRouter()
  const tr = locale === 'tr'
  const [activeTab, setActiveTab] = useState<'status' | 'archive' | 'credits'>('status')
  const [signingOut, setSigningOut] = useState(false)

  const bureauCredits = parseFloat(profile?.bureau_credits ?? '0')

  async function handleSignOut() {
    setSigningOut(true)
    await signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-10">

      {/* Header card */}
      <div className="mb-6 border border-bureau-black">
        <div className="border-b border-bureau-black bg-bureau-black px-5 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/60">
              FORM 200 // REGISTRY STATUS DOCUMENT
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-bureau-amber">
              CERTIFIED
            </span>
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bureau-amber opacity-50" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-bureau-amber" />
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-bureau-amber">
                  REGISTRY STATUS: CERTIFIED
                </span>
              </div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-bureau-muted">
                ACCOUNT ID: #{profile?.account_id ?? '—'}
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-bureau-muted">
                {profile?.full_name || profile?.email}
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[9px] uppercase tracking-widest text-bureau-muted">
                {tr ? 'Mevcut Büro Kredisi' : 'Available Bureau Credits'}
              </p>
              <p className="mt-1 text-[28px] font-light text-bureau-amber">
                {bureauCredits.toFixed(2)} <span className="text-[14px]">BC</span>
              </p>
            </div>
          </div>

          <div className="mt-4 border border-bureau-rule bg-bureau-surface px-4 py-3">
            <p className="font-mono text-[9.5px] leading-relaxed text-bureau-subtle">
              [SYSTEM NOTE: Bureau Credits are non-transferable and formally assigned to regulate your future hardware acquisitions.]
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex border-b border-bureau-black">
        {([
          { key: 'status', label: tr ? 'Durum' : 'Status' },
          { key: 'archive', label: tr ? 'Ürün Arşivi' : 'Object Archive' },
          { key: 'credits', label: tr ? 'Kredi Geçmişi' : 'Credit Log' },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${
              activeTab === tab.key
                ? 'border-b-2 border-bureau-black text-bureau-black'
                : 'text-bureau-muted hover:text-bureau-black'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Status tab */}
      {activeTab === 'status' && (
        <div className="space-y-3">
          <div className="border border-bureau-rule">
            {[
              { label: tr ? 'Hesap Durumu' : 'Account Status', value: 'CERTIFIED' },
              { label: 'Account ID', value: `#${profile?.account_id ?? '—'}` },
              { label: tr ? 'E-posta' : 'Email', value: profile?.email },
              { label: tr ? 'Ad Soyad' : 'Full Name', value: profile?.full_name || '—' },
              { label: tr ? 'Toplam Sipariş' : 'Total Orders', value: String(orders.length) },
              { label: tr ? 'Büro Kredisi' : 'Bureau Credits', value: `${bureauCredits.toFixed(2)} BC` },
            ].map((row, i) => (
              <div key={i} className={`flex items-center ${i < 5 ? 'border-b border-bureau-rule' : ''}`}>
                <span className="w-[45%] border-r border-bureau-rule px-4 py-2.5 font-mono text-[9.5px] uppercase tracking-wider text-bureau-muted">
                  {row.label}
                </span>
                <span className="px-4 py-2.5 font-mono text-[11px] text-bureau-black">
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full border border-bureau-rule py-2.5 font-mono text-[10px] uppercase tracking-wider text-bureau-muted transition-colors hover:border-bureau-black hover:text-bureau-black disabled:opacity-50"
          >
            {signingOut ? '...' : (tr ? 'Çıkış Yap' : 'Sign Out')}
          </button>
        </div>
      )}

      {/* Archive tab */}
      {activeTab === 'archive' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="border border-dashed border-bureau-rule p-8 text-center">
              <p className="font-mono text-[10px] uppercase tracking-widest text-bureau-subtle">
                {tr ? 'Henüz satın alınan nesne yok.' : 'No objects acquired yet.'}
              </p>
            </div>
          ) : (
            orders.flatMap((order: any) =>
              (order.order_items ?? []).map((item: any) => {
                const warranty = order.paid_at ? warrantyProgress(order.paid_at) : null
                return (
                  <div key={item.id} className="border border-bureau-black">
                    <div className="border-b border-bureau-rule bg-bureau-surface px-4 py-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9.5px] uppercase tracking-wider text-bureau-muted">
                          {item.registry_no}
                        </span>
                        <span className="font-mono text-[9px] uppercase text-bureau-subtle">
                          {order.paid_at ? new Date(order.paid_at).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-GB') : '—'}
                        </span>
                      </div>
                    </div>
                    <div className="px-4 py-4">
                      <p className="mb-3 text-[14px] font-light uppercase tracking-wide">
                        {item.product_name}
                      </p>

                      {/* Garanti progress bar */}
                      {warranty && (
                        <div className="mb-3">
                          <div className="mb-1 flex justify-between font-mono text-[9px] uppercase tracking-wider text-bureau-muted">
                            <span>{tr ? 'Garanti Kapsamı' : 'Warranty Coverage'}</span>
                            <span>
                              {warranty.expired
                                ? (tr ? 'Süresi Doldu' : 'Expired')
                                : `${warranty.daysLeft} ${tr ? 'gün kaldı' : 'days remaining'}`}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-bureau-rule">
                            <div
                              className={`h-full transition-all ${warranty.percent > 25 ? 'bg-bureau-amber' : 'bg-red-500'}`}
                              style={{ width: `${warranty.percent}%` }}
                            />
                          </div>
                          <div className="mt-0.5 flex justify-between font-mono text-[8.5px] text-bureau-subtle">
                            <span>{tr ? 'Satın Alma' : 'Purchase'}</span>
                            <span>{tr ? '24 Ay Garanti' : '24-Month Warranty'}</span>
                          </div>
                        </div>
                      )}

                      <ServiceRequestButton
                        orderItemId={item.id}
                        locale={locale}
                      />
                    </div>
                  </div>
                )
              })
            )
          )}
        </div>
      )}

      {/* Credits tab */}
      {activeTab === 'credits' && (
        <div>
          <div className="mb-4 border border-bureau-amber bg-bureau-amber/5 px-5 py-4">
            <p className="font-mono text-[9.5px] uppercase tracking-widest text-bureau-amber">
              {tr ? 'Mevcut Büro Kredisi' : 'Available Bureau Credits'}
            </p>
            <p className="mt-1 text-[32px] font-light text-bureau-black">
              {bureauCredits.toFixed(2)} <span className="text-[16px] text-bureau-amber">BC</span>
            </p>
          </div>

          {creditTransactions.length === 0 ? (
            <div className="border border-dashed border-bureau-rule p-8 text-center">
              <p className="font-mono text-[10px] uppercase tracking-widest text-bureau-subtle">
                {tr ? 'Henüz kredi işlemi yok.' : 'No credit transactions yet.'}
              </p>
            </div>
          ) : (
            <div className="border border-bureau-rule">
              {creditTransactions.map((tx: any, i: number) => (
                <div key={tx.id} className={`flex items-center justify-between px-4 py-3 ${i < creditTransactions.length - 1 ? 'border-b border-bureau-rule' : ''}`}>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-wide text-bureau-black">
                      {tx.description ?? tx.type}
                    </p>
                    <p className="font-mono text-[9px] text-bureau-subtle">
                      {new Date(tx.created_at).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-GB')}
                    </p>
                  </div>
                  <span className={`font-mono text-[13px] ${tx.amount > 0 ? 'text-bureau-amber' : 'text-red-600'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)} BC
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ServiceRequestButton({ orderItemId, locale }: { orderItemId: string; locale: 'tr' | 'en' }) {
  const tr = locale === 'tr'
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/service-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderItemId, issueDescription: text }),
    })
    if (res.ok) setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <p className="font-mono text-[10px] uppercase tracking-wider text-bureau-amber">
        ✓ {tr ? 'Servis talebi alındı.' : 'Service request received.'}
      </p>
    )
  }

  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        className="font-mono text-[10px] uppercase tracking-wider text-bureau-muted underline hover:text-bureau-amber"
      >
        {open ? (tr ? 'İptal' : 'Cancel') : (tr ? 'Servis Talebi Oluştur' : 'Request Service')}
      </button>
      {open && (
        <form onSubmit={handleSubmit} className="mt-3 space-y-2">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            required
            rows={3}
            placeholder={tr ? 'Sorunu kısaca açıklayın...' : 'Briefly describe the issue...'}
            className="w-full border border-bureau-rule px-3 py-2 font-mono text-[11px] outline-none focus:border-bureau-amber"
          />
          <button type="submit" disabled={loading} className="btn-bureau-outline text-[10px] disabled:opacity-50">
            {loading ? '...' : (tr ? 'Gönder' : 'Submit')}
          </button>
        </form>
      )}
    </div>
  )
}