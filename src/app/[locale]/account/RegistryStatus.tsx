'use client'

import { useEffect, useState } from 'react'
import { useRouter, Link } from '@/i18n/navigation'
import { signOut } from '@/lib/supabase/auth'

type TabKey = 'status' | 'orders' | 'archive' | 'credits'

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

const ORDER_STATUS: Record<string, { tr: string; en: string; color: string }> = {
  pending:    { tr: 'Bekliyor',   en: 'Pending',    color: 'text-yellow-600' },
  processing: { tr: 'İşleniyor', en: 'Processing', color: 'text-blue-600' },
  shipped:    { tr: 'Kargoda',   en: 'Shipped',    color: 'text-purple-600' },
  delivered:  { tr: 'Teslim Edildi', en: 'Delivered', color: 'text-green-600' },
  cancelled:  { tr: 'İptal',     en: 'Cancelled',  color: 'text-red-600' },
}

// Sipariş takibi görsel adımları — 'cancelled' bu çizgide ayrı gösteriliyor.
const ORDER_TRACK_STEPS: Array<{ key: string; tr: string; en: string }> = [
  { key: 'pending', tr: 'Alındı', en: 'Received' },
  { key: 'processing', tr: 'İşleniyor', en: 'Processing' },
  { key: 'shipped', tr: 'Kargoda', en: 'Shipped' },
  { key: 'delivered', tr: 'Teslim Edildi', en: 'Delivered' },
]

function orderStepIndex(status: string): number {
  return ORDER_TRACK_STEPS.findIndex((s) => s.key === status)
}

const SERVICE_STATUS: Record<string, { tr: string; en: string }> = {
  pending:    { tr: 'Bekliyor',    en: 'Pending' },
  reviewing:  { tr: 'İnceleniyor', en: 'Reviewing' },
  in_service: { tr: 'Serviste',    en: 'In Service' },
  resolved:   { tr: 'Çözüldü',    en: 'Resolved' },
  rejected:   { tr: 'Reddedildi', en: 'Rejected' },
}

export function RegistryStatus({
  profile,
  orders,
  creditTransactions,
  serviceRequests = [],
  locale,
  initialTab = 'status',
}: {
  profile: any
  orders: any[]
  creditTransactions: any[]
  serviceRequests?: any[]
  locale: 'tr' | 'en'
  initialTab?: TabKey
}) {
  const router = useRouter()
  const tr = locale === 'tr'
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab)
  const [signingOut, setSigningOut] = useState(false)

  // ── Profil düzenleme ──
  const [editingProfile, setEditingProfile] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileForm, setProfileForm] = useState({
    fullName: profile?.full_name ?? '',
    phone: profile?.phone ?? '',
    addressLine1: profile?.address_line1 ?? '',
    addressLine2: profile?.address_line2 ?? '',
    city: profile?.city ?? '',
    postalCode: profile?.postal_code ?? '',
  })

  function startEditingProfile() {
    setProfileForm({
      fullName: profile?.full_name ?? '',
      phone: profile?.phone ?? '',
      addressLine1: profile?.address_line1 ?? '',
      addressLine2: profile?.address_line2 ?? '',
      city: profile?.city ?? '',
      postalCode: profile?.postal_code ?? '',
    })
    setProfileError(null)
    setEditingProfile(true)
  }

  async function handleSaveProfile() {
    setSavingProfile(true)
    setProfileError(null)
    try {
      const res = await fetch('/api/account/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: profileForm.fullName,
          phone: profileForm.phone,
          addressLine1: profileForm.addressLine1,
          addressLine2: profileForm.addressLine2,
          city: profileForm.city,
          postalCode: profileForm.postalCode,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? 'Update failed')
      }
      setEditingProfile(false)
      router.refresh()
    } catch (err) {
      setProfileError(
        tr ? 'Kaydedilemedi, lütfen tekrar deneyin.' : 'Could not save, please try again.'
      )
    } finally {
      setSavingProfile(false)
    }
  }

  // Header'daki "Sicilim" dropdown'ından ?tab=... değişince
  // (aynı route içinde kalındığı için component yeniden mount olmuyor,
  // bu yüzden initialTab prop'u her değiştiğinde activeTab'ı senkronize et)
  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  const bureauCreditsTRY = parseFloat(profile?.bureau_credits_try ?? '0')
  const bureauCreditsUSD = parseFloat(profile?.bureau_credits_usd ?? '0')
  const bureauCredits = tr ? bureauCreditsTRY : bureauCreditsUSD
  const creditSymbol = tr ? '₺' : '$'

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
              {tr ? 'FORM 200 // SİCİL DURUM BELGESİ' : 'FORM 200 // REGISTRY STATUS DOCUMENT'}
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-bureau-amber">
              {tr ? 'SERTİFİKALI' : 'CERTIFIED'}
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
                  {tr ? 'SİCİL DURUMU: SERTİFİKALI' : 'REGISTRY STATUS: CERTIFIED'}
                </span>
              </div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-bureau-muted">
                {tr ? 'HESAP KİMLİĞİ' : 'ACCOUNT ID'}: #{profile?.account_id ?? '—'}
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
                {bureauCredits.toFixed(2)} <span className="text-[14px]">BC {creditSymbol}</span>
              </p>
            </div>
          </div>

          <div className="mt-4 border border-bureau-rule bg-bureau-surface px-4 py-3">
            <p className="font-mono text-[9.5px] leading-relaxed text-bureau-subtle">
              {tr ? '[SİSTEM NOTU: Büro Kredileri devredilemez ve gelecekteki donanım alımlarınızı düzenlemek üzere resmi olarak size tahsis edilmiştir.]' : '[SYSTEM NOTE: Bureau Credits are non-transferable and formally assigned to regulate your future hardware acquisitions.]'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex border-b border-bureau-black">
        {([
          { key: 'status', label: tr ? 'Durum' : 'Status' },
          { key: 'orders', label: tr ? 'Siparişlerim' : 'My Orders' },
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
              { label: tr ? 'Toplam Sipariş' : 'Total Orders', value: String(orders.length) },
              { label: tr ? 'Büro Kredisi' : 'Bureau Credits', value: `${bureauCredits.toFixed(2)} BC ${creditSymbol}` },
            ].map((row, i, arr) => (
              <div key={i} className={`flex items-center ${i < arr.length - 1 ? 'border-b border-bureau-rule' : ''}`}>
                <span className="w-[45%] border-r border-bureau-rule px-4 py-2.5 font-mono text-[9.5px] uppercase tracking-wider text-bureau-muted">
                  {row.label}
                </span>
                <span className="px-4 py-2.5 font-mono text-[11px] text-bureau-black">
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* Düzenlenebilir kimlik bilgileri (Ad Soyad / Telefon / Adres) */}
          <div className="border border-bureau-black">
            <div className="flex items-center justify-between border-b border-bureau-rule bg-bureau-surface px-4 py-2">
              <span className="font-mono text-[9.5px] uppercase tracking-widest text-bureau-muted">
                {tr ? 'Kimlik & Teslimat Bilgileri' : 'Identity & Delivery Details'}
              </span>
              {!editingProfile && (
                <button
                  onClick={startEditingProfile}
                  className="font-mono text-[9.5px] uppercase tracking-wider text-bureau-amber hover:underline"
                >
                  {tr ? 'Düzenle' : 'Edit'}
                </button>
              )}
            </div>

            {editingProfile ? (
              <div className="space-y-3 p-4">
                <ProfileField
                  label={tr ? 'Ad Soyad' : 'Full Name'}
                  value={profileForm.fullName}
                  onChange={(v) => setProfileForm((f) => ({ ...f, fullName: v }))}
                />
                <ProfileField
                  label={tr ? 'Telefon' : 'Phone'}
                  value={profileForm.phone}
                  onChange={(v) => setProfileForm((f) => ({ ...f, phone: v }))}
                  type="tel"
                />
                <ProfileField
                  label={tr ? 'Adres Satırı 1' : 'Address Line 1'}
                  value={profileForm.addressLine1}
                  onChange={(v) => setProfileForm((f) => ({ ...f, addressLine1: v }))}
                />
                <ProfileField
                  label={tr ? 'Adres Satırı 2 (opsiyonel)' : 'Address Line 2 (optional)'}
                  value={profileForm.addressLine2}
                  onChange={(v) => setProfileForm((f) => ({ ...f, addressLine2: v }))}
                />
                <div className="grid grid-cols-2 gap-3">
                  <ProfileField
                    label={tr ? 'Şehir' : 'City'}
                    value={profileForm.city}
                    onChange={(v) => setProfileForm((f) => ({ ...f, city: v }))}
                  />
                  <ProfileField
                    label={tr ? 'Posta Kodu' : 'Postal Code'}
                    value={profileForm.postalCode}
                    onChange={(v) => setProfileForm((f) => ({ ...f, postalCode: v }))}
                  />
                </div>

                {profileError && (
                  <p className="text-[11px] text-red-600">{profileError}</p>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="btn-bureau flex-1 disabled:opacity-50"
                  >
                    {savingProfile ? (tr ? 'Kaydediliyor...' : 'Saving...') : (tr ? 'Kaydet' : 'Save')}
                  </button>
                  <button
                    onClick={() => setEditingProfile(false)}
                    disabled={savingProfile}
                    className="flex-1 border border-bureau-rule py-2.5 font-mono text-[10px] uppercase tracking-wider text-bureau-muted transition-colors hover:border-bureau-black hover:text-bureau-black disabled:opacity-50"
                  >
                    {tr ? 'Vazgeç' : 'Cancel'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {[
                  { label: tr ? 'Ad Soyad' : 'Full Name', value: profile?.full_name || '—' },
                  { label: tr ? 'Telefon' : 'Phone', value: profile?.phone || '—' },
                  {
                    label: tr ? 'Adres' : 'Address',
                    value: [profile?.address_line1, profile?.address_line2, profile?.city, profile?.postal_code]
                      .filter(Boolean)
                      .join(', ') || '—',
                  },
                ].map((row, i, arr) => (
                  <div key={i} className={`flex items-center ${i < arr.length - 1 ? 'border-b border-bureau-rule' : ''}`}>
                    <span className="w-[45%] border-r border-bureau-rule px-4 py-2.5 font-mono text-[9.5px] uppercase tracking-wider text-bureau-muted">
                      {row.label}
                    </span>
                    <span className="px-4 py-2.5 font-mono text-[11px] text-bureau-black">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
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

      {/* Orders tab — sipariş bazlı takip (görsel durum çubuğu) */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="border border-dashed border-bureau-rule p-8 text-center">
              <p className="font-mono text-[10px] uppercase tracking-widest text-bureau-subtle">
                {tr ? 'Henüz siparişiniz yok.' : 'You have no orders yet.'}
              </p>
            </div>
          ) : (
            orders.map((order: any) => {
              const isCancelled = order.status === 'cancelled'
              const stepIdx = orderStepIndex(order.status)
              const itemCount = (order.order_items ?? []).length
              return (
                <div key={order.id} className="border border-bureau-black">
                  <div className="flex items-center justify-between border-b border-bureau-rule bg-bureau-surface px-4 py-2.5">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-bureau-black">
                      {order.order_number}
                    </span>
                    <span className={`font-mono text-[10px] uppercase tracking-widest ${ORDER_STATUS[order.status]?.color ?? 'text-bureau-muted'}`}>
                      {tr ? ORDER_STATUS[order.status]?.tr : ORDER_STATUS[order.status]?.en ?? order.status}
                    </span>
                  </div>

                  <div className="px-4 py-4">
                    <p className="mb-4 font-mono text-[9.5px] uppercase tracking-wider text-bureau-muted">
                      {new Date(order.created_at).toLocaleDateString(tr ? 'tr-TR' : 'en-GB')}
                      {'  •  '}
                      {itemCount} {tr ? (itemCount === 1 ? 'ürün' : 'ürün') : (itemCount === 1 ? 'item' : 'items')}
                    </p>

                    {isCancelled ? (
                      <div className="border border-red-200 bg-red-50 px-3 py-2 font-mono text-[10px] uppercase tracking-wide text-red-600">
                        {tr ? 'Bu sipariş iptal edildi.' : 'This order was cancelled.'}
                      </div>
                    ) : (
                      <div className="flex items-center">
                        {ORDER_TRACK_STEPS.map((step, i) => {
                          const reached = stepIdx >= i
                          const isLast = i === ORDER_TRACK_STEPS.length - 1
                          return (
                            <div key={step.key} className="flex flex-1 items-center last:flex-none">
                              <div className="flex flex-col items-center">
                                <div
                                  className={`h-2.5 w-2.5 rounded-full ${
                                    reached ? 'bg-bureau-amber' : 'bg-bureau-rule'
                                  }`}
                                />
                                <span
                                  className={`mt-1.5 whitespace-nowrap font-mono text-[8.5px] uppercase tracking-wide ${
                                    reached ? 'text-bureau-black' : 'text-bureau-subtle'
                                  }`}
                                >
                                  {tr ? step.tr : step.en}
                                </span>
                              </div>
                              {!isLast && (
                                <div
                                  className={`mx-1 h-[2px] flex-1 ${
                                    stepIdx > i ? 'bg-bureau-amber' : 'bg-bureau-rule'
                                  }`}
                                />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Archive tab */}
      {activeTab === 'archive' && (
        <div className="space-y-4">
          {orders.filter((o: any) => ['processing', 'shipped', 'delivered'].includes(o.status)).length === 0 ? (
            <div className="border border-dashed border-bureau-rule p-8 text-center">
              <p className="font-mono text-[10px] uppercase tracking-widest text-bureau-subtle">
                {tr ? 'Henüz satın alınan nesne yok.' : 'No objects acquired yet.'}
              </p>
            </div>
          ) : (
            orders
              .filter((o: any) => ['processing', 'shipped', 'delivered'].includes(o.status))
              .flatMap((order: any) =>
              (order.order_items ?? []).map((item: any) => {
                const warranty = order.paid_at ? warrantyProgress(order.paid_at) : null
                return (
                  <div key={item.id} className="border border-bureau-black">
                    <div className="border-b border-bureau-rule bg-bureau-surface px-4 py-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9.5px] uppercase tracking-wider text-bureau-muted">
                          {item.registry_no}
                        </span>
                        <div className="flex items-center gap-3">
                          {order.status && (
                            <span className={`font-mono text-[9px] uppercase ${ORDER_STATUS[order.status]?.color ?? 'text-bureau-muted'}`}>
                              {ORDER_STATUS[order.status]?.[locale] ?? order.status}
                            </span>
                          )}
                          <span className="font-mono text-[9px] uppercase text-bureau-subtle">
                            {order.paid_at ? new Date(order.paid_at).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-GB') : '—'}
                          </span>
                        </div>
                      </div>
                      {order.tracking_number && (
                        <p className="mt-1 font-mono text-[9px] text-bureau-muted">
                          {tr ? 'Takip No' : 'Tracking'}: <span className="text-bureau-black">{order.tracking_number}</span>
                        </p>
                      )}
                    </div>
                    <div className="px-4 py-4">
                      {/* Custom design snapshot */}
                      {item.snapshot_url && (
                        <div className="mb-3 overflow-hidden border border-bureau-rule">
                          <img
                            src={item.snapshot_url}
                            alt={item.product_name}
                            className="h-48 w-full object-contain bg-bureau-surface p-2"
                          />
                        </div>
                      )}

                      <p className="mb-3 text-[14px] font-light uppercase tracking-wide">
                        {item.product_name}
                      </p>

                      {item.certificate_no && (
                        <Link
                          href={`/dossier/${item.certificate_no}`}
                          className="mb-3 inline-block font-mono text-[9.5px] uppercase tracking-wider text-bureau-amber no-underline hover:underline"
                        >
                          {tr ? '→ Ürün Kimlik Sayfası' : '→ Product Identity Page'}
                        </Link>
                      )}

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
                        existingRequests={serviceRequests.filter((r: any) => r.order_item_id === item.id)}
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
              {bureauCredits.toFixed(2)} <span className="text-[16px] text-bureau-amber">BC {creditSymbol}</span>
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
                    {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)} BC {tx.currency === 'USD' ? '$' : '₺'}
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

function ProfileField({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <div>
      <label className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-bureau-muted">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-bureau-rule px-3 py-2 font-mono text-[12px] outline-none focus:border-bureau-amber"
      />
    </div>
  )
}

function ServiceRequestButton({
  orderItemId,
  locale,
  existingRequests = [],
}: {
  orderItemId: string
  locale: 'tr' | 'en'
  existingRequests?: any[]
}) {
  const tr = locale === 'tr'
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  // Aktif (çözülmemiş) talep var mı?
  const activeRequest = existingRequests.find(
    (r: any) => !['resolved', 'rejected'].includes(r.status)
  )

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

  // Aktif talep varsa durumu göster
  if (activeRequest) {
    return (
      <div className="border border-bureau-rule bg-bureau-surface px-3 py-2">
        <p className="font-mono text-[9px] uppercase tracking-wider text-bureau-muted">
          {tr ? 'Mevcut Servis Talebi' : 'Active Service Request'}
        </p>
        <p className="mt-0.5 font-mono text-[10px] uppercase text-bureau-amber">
          {SERVICE_STATUS[activeRequest.status]?.[locale] ?? activeRequest.status}
        </p>
        {activeRequest.admin_notes && (
          <p className="mt-1 text-[11px] text-bureau-muted">{activeRequest.admin_notes}</p>
        )}
        <p className="mt-1 font-mono text-[9px] text-bureau-subtle">
          {new Date(activeRequest.created_at).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-GB')}
        </p>
      </div>
    )
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