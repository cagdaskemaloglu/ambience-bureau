'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { formatPrice } from '@/lib/sanity'

const STATUS_LABELS: Record<string, { tr: string; en: string; color: string }> = {
  pending:    { tr: 'Ödeme Bekleniyor', en: 'Awaiting Payment', color: 'text-yellow-600' },
  received:   { tr: 'Alındı',      en: 'Received',   color: 'text-teal-600' },
  processing: { tr: 'İşleniyor',   en: 'Processing', color: 'text-blue-600' },
  shipped:    { tr: 'Kargoda',      en: 'Shipped',    color: 'text-purple-600' },
  delivered:  { tr: 'Teslim',       en: 'Delivered',  color: 'text-green-600' },
  cancelled:  { tr: 'İptal',        en: 'Cancelled',  color: 'text-red-600' },
  refunded:   { tr: 'İade',         en: 'Refunded',   color: 'text-gray-500' },
}

const SERVICE_STATUS_LABELS: Record<string, { tr: string; en: string }> = {
  pending:    { tr: 'Bekliyor',    en: 'Pending' },
  reviewing:  { tr: 'İnceleniyor', en: 'Reviewing' },
  in_service: { tr: 'Serviste',    en: 'In Service' },
  resolved:   { tr: 'Çözüldü',    en: 'Resolved' },
  rejected:   { tr: 'Reddedildi', en: 'Rejected' },
}

export default function AdminPage() {
  const locale = useLocale() as 'tr' | 'en'
  const tr = locale === 'tr'

  const [secret, setSecret] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState(false)
  const [tab, setTab] = useState<'orders' | 'service' | 'credits'>('orders')

  // Orders
  const [orders, setOrders] = useState<any[]>([])
  const [ordersTotal, setOrdersTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState('all')
  const [ordersLoading, setOrdersLoading] = useState(false)

  // Service requests
  const [serviceRequests, setServiceRequests] = useState<any[]>([])
  const [serviceLoading, setServiceLoading] = useState(false)

  // Credits grant
  const [creditUserId, setCreditUserId] = useState('')
  const [creditAmount, setCreditAmount] = useState('')
  const [creditCurrency, setCreditCurrency] = useState<'TRY' | 'USD'>('TRY')
  const [creditDesc, setCreditDesc] = useState('')
  const [creditLoading, setCreditLoading] = useState(false)
  const [creditResult, setCreditResult] = useState<string | null>(null)

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    setAuthError(false)
    const res = await fetch('/api/admin/orders', {
      headers: { 'x-admin-secret': secret },
    })
    if (res.ok) {
      setAuthed(true)
      localStorage.setItem('admin_secret', secret)
    } else {
      setAuthError(true)
    }
  }

  useEffect(() => {
    const stored = localStorage.getItem('admin_secret')
    if (stored) { setSecret(stored); setAuthed(true) }
  }, [])

  async function loadOrders() {
    setOrdersLoading(true)
    const res = await fetch(`/api/admin/orders?status=${statusFilter}`, {
      headers: { 'x-admin-secret': secret },
    })
    if (res.ok) {
      const data = await res.json()
      setOrders(data.orders ?? [])
      setOrdersTotal(data.total ?? 0)
    }
    setOrdersLoading(false)
  }

  async function loadServiceRequests() {
    setServiceLoading(true)
    const res = await fetch('/api/admin/service-requests', {
      headers: { 'x-admin-secret': secret },
    })
    if (res.ok) {
      const data = await res.json()
      setServiceRequests(data.requests ?? [])
    }
    setServiceLoading(false)
  }

  useEffect(() => {
    if (!authed) return
    if (tab === 'orders') loadOrders()
    if (tab === 'service') loadServiceRequests()
  }, [authed, tab, statusFilter])

  async function updateOrderStatus(orderId: string, status: string, trackingNumber?: string) {
    await fetch('/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
      body: JSON.stringify({ orderId, status, trackingNumber }),
    })
    loadOrders()
  }

  async function updateServiceRequest(id: string, status: string, adminNotes?: string) {
    await fetch('/api/admin/service-requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
      body: JSON.stringify({ id, status, adminNotes }),
    })
    loadServiceRequests()
  }

  async function grantCredits(e: React.FormEvent) {
    e.preventDefault()
    setCreditLoading(true)
    setCreditResult(null)
    const res = await fetch('/api/admin/grant-credits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${secret}` },
      body: JSON.stringify({
        userId: creditUserId,
        amount: parseFloat(creditAmount),
        currency: creditCurrency,
        description: creditDesc || undefined,
      }),
    })
    const data = await res.json()
    if (res.ok) {
      setCreditResult(`✓ ${data.accountId} — TRY: ${data.balanceTRY} BC, USD: ${data.balanceUSD} BC`)
      setCreditUserId('')
      setCreditAmount('')
      setCreditDesc('')
    } else {
      setCreditResult(`✗ ${data.error}`)
    }
    setCreditLoading(false)
  }

  if (!authed) {
    return (
      <div className="flex flex-1 items-center justify-center px-5 py-16">
        <div className="w-full max-w-sm border border-bureau-black">
          <div className="border-b border-bureau-black bg-bureau-black px-5 py-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/60">
              ADMIN // RESTRICTED ACCESS
            </span>
          </div>
          <form onSubmit={handleAuth} className="px-7 py-8 space-y-4">
            <div>
              <label className="mb-1 block font-mono text-[9.5px] uppercase tracking-wider text-bureau-muted">
                Admin Secret
              </label>
              <input
                type="password"
                value={secret}
                onChange={e => setSecret(e.target.value)}
                required
                className="w-full border border-bureau-black px-3 py-2 font-mono text-[12px] outline-none focus:border-bureau-amber"
              />
            </div>
            {authError && <p className="text-[11px] text-red-600">Yetkisiz erişim.</p>}
            <button type="submit" className="btn-bureau w-full">Giriş</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="px-5 py-8 sm:px-10">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between border-b border-bureau-black pb-4">
        <div>
          <div className="label-mono mb-1">ADMIN PANEL</div>
          <h1 className="text-[24px] font-light uppercase tracking-wide">
            {tr ? 'Yönetim Merkezi' : 'Management Center'}
          </h1>
        </div>
        <button
          onClick={() => { localStorage.removeItem('admin_secret'); setAuthed(false) }}
          className="font-mono text-[10px] uppercase tracking-wide text-bureau-muted hover:text-bureau-amber"
        >
          {tr ? 'Çıkış' : 'Logout'}
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex border-b border-bureau-black">
        {([
          { key: 'orders', label: tr ? 'Siparişler' : 'Orders' },
          { key: 'service', label: tr ? 'Servis Talepleri' : 'Service Requests' },
          { key: 'credits', label: tr ? 'Kredi Tanımla' : 'Grant Credits' },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${
              tab === t.key ? 'border-b-2 border-bureau-black text-bureau-black' : 'text-bureau-muted hover:text-bureau-black'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ORDERS TAB */}
      {tab === 'orders' && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <span className="font-mono text-[11px] text-bureau-muted">
              {ordersTotal} {tr ? 'sipariş' : 'orders'}
            </span>
            <div className="flex gap-2">
              {['all', 'pending', 'received', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`border px-3 py-1 font-mono text-[9.5px] uppercase tracking-wide transition-colors ${
                    statusFilter === s ? 'border-bureau-black bg-bureau-black text-white' : 'border-bureau-rule text-bureau-muted hover:border-bureau-black'
                  }`}
                >
                  {s === 'all' ? (tr ? 'Tümü' : 'All') : (STATUS_LABELS[s]?.[locale] ?? s)}
                </button>
              ))}
            </div>
          </div>

          {ordersLoading ? (
            <p className="font-mono text-[11px] text-bureau-muted">{tr ? 'Yükleniyor...' : 'Loading...'}</p>
          ) : (
            <div className="space-y-3">
              {orders.map((order: any) => (
                <OrderRow
                  key={order.id}
                  order={order}
                  locale={locale}
                  onUpdateStatus={updateOrderStatus}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* SERVICE REQUESTS TAB */}
      {tab === 'service' && (
        <div className="space-y-3">
          {serviceLoading ? (
            <p className="font-mono text-[11px] text-bureau-muted">{tr ? 'Yükleniyor...' : 'Loading...'}</p>
          ) : serviceRequests.length === 0 ? (
            <p className="font-mono text-[11px] text-bureau-subtle">{tr ? 'Servis talebi yok.' : 'No service requests.'}</p>
          ) : (
            serviceRequests.map((req: any) => (
              <ServiceRow
                key={req.id}
                req={req}
                locale={locale}
                onUpdate={updateServiceRequest}
              />
            ))
          )}
        </div>
      )}

      {/* CREDITS TAB */}
      {tab === 'credits' && (
        <div className="max-w-md">
          <form onSubmit={grantCredits} className="space-y-4 border border-bureau-black p-6">
            <div className="border-b border-bureau-rule pb-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-bureau-muted">
                {tr ? 'Kullanıcıya Kredi Tanımla' : 'Grant Credits to User'}
              </span>
            </div>
            <div>
              <label className="mb-1 block font-mono text-[9.5px] uppercase tracking-wider text-bureau-muted">User ID (UUID)</label>
              <input type="text" value={creditUserId} onChange={e => setCreditUserId(e.target.value)} required
                className="w-full border border-bureau-black px-3 py-2 font-mono text-[11px] outline-none focus:border-bureau-amber" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block font-mono text-[9.5px] uppercase tracking-wider text-bureau-muted">{tr ? 'Miktar (BC)' : 'Amount (BC)'}</label>
                <input type="number" step="0.01" value={creditAmount} onChange={e => setCreditAmount(e.target.value)} required
                  className="w-full border border-bureau-black px-3 py-2 font-mono text-[11px] outline-none focus:border-bureau-amber" />
              </div>
              <div>
                <label className="mb-1 block font-mono text-[9.5px] uppercase tracking-wider text-bureau-muted">{tr ? 'Para Birimi' : 'Currency'}</label>
                <select value={creditCurrency} onChange={e => setCreditCurrency(e.target.value as 'TRY' | 'USD')}
                  className="w-full border border-bureau-black px-3 py-2 font-mono text-[11px] outline-none focus:border-bureau-amber">
                  <option value="TRY">TRY (₺)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block font-mono text-[9.5px] uppercase tracking-wider text-bureau-muted">{tr ? 'Açıklama (opsiyonel)' : 'Description (optional)'}</label>
              <input type="text" value={creditDesc} onChange={e => setCreditDesc(e.target.value)}
                className="w-full border border-bureau-black px-3 py-2 font-mono text-[11px] outline-none focus:border-bureau-amber" />
            </div>
            {creditResult && (
              <p className={`font-mono text-[11px] ${creditResult.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>
                {creditResult}
              </p>
            )}
            <button type="submit" disabled={creditLoading} className="btn-bureau w-full disabled:opacity-50">
              {creditLoading ? (tr ? 'Tanımlanıyor...' : 'Granting...') : (tr ? 'Kredi Tanımla' : 'Grant Credits')}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

function OrderRow({ order, locale, onUpdateStatus }: {
  order: any
  locale: 'tr' | 'en'
  onUpdateStatus: (id: string, status: string, tracking?: string) => void
}) {
  const tr = locale === 'tr'
  const [expanded, setExpanded] = useState(false)
  const [tracking, setTracking] = useState(order.tracking_number ?? '')
  const currency = order.currency ?? 'TRY'
  const intlLocale = currency === 'TRY' ? 'tr-TR' : 'en-US'
  const statusInfo = STATUS_LABELS[order.status] ?? { tr: order.status, en: order.status, color: 'text-bureau-muted' }

  return (
    <div className="border border-bureau-rule">
      <div
        className="flex cursor-pointer items-center justify-between px-4 py-3 hover:bg-bureau-surface"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-4">
          <span className="font-mono text-[11px] font-semibold text-bureau-black">{order.order_number}</span>
          <span className={`font-mono text-[10px] uppercase ${statusInfo.color}`}>
            {statusInfo[locale]}
          </span>
          <span className="font-mono text-[10px] text-bureau-muted">
            {new Date(order.created_at).toLocaleDateString(intlLocale)}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[12px] font-semibold">
            {formatPrice(order.total_amount / 100, currency, intlLocale)}
          </span>
          <span className="font-mono text-[10px] text-bureau-subtle">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-bureau-rule px-4 py-4">
          {/* Müşteri bilgileri */}
          <div className="mb-4 grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="font-mono text-[9px] uppercase text-bureau-muted block">
                {tr ? 'Müşteri' : 'Customer'}
              </span>
              <span>{order.shipping_name}</span>
            </div>
            <div className="col-span-2">
              <span className="font-mono text-[9px] uppercase text-bureau-muted block">
                {tr ? 'Adres' : 'Address'}
              </span>
              <span>
                {[order.shipping_address1, order.shipping_address2, order.shipping_city, order.shipping_postal, order.shipping_country]
                  .filter(Boolean)
                  .join(', ')}
              </span>
            </div>
            <div>
              <span className="font-mono text-[9px] uppercase text-bureau-muted block">
                {tr ? 'Sipariş Telefonu' : 'Order Phone'}
              </span>
              <span>{order.shipping_phone || '—'}</span>
            </div>
            {order.user_id && (
              <div>
                <span className="font-mono text-[9px] uppercase text-bureau-muted block">
                  {tr ? 'Hesap Telefonu' : 'Account Phone'}
                </span>
                <span>{order.profiles?.phone || '—'}</span>
              </div>
            )}
            {order.guest_email && (
              <div>
                <span className="font-mono text-[9px] uppercase text-bureau-muted block">Email</span>
                <span>{order.guest_email}</span>
              </div>
            )}
            {order.bureau_credits_used > 0 && (
              <div>
                <span className="font-mono text-[9px] uppercase text-bureau-muted block">BC Used</span>
                <span className="text-bureau-amber">{order.bureau_credits_used} BC</span>
              </div>
            )}
          </div>

          {/* Ürünler */}
          <div className="mb-4 space-y-2">
            {(order.order_items ?? []).map((item: any) => {
              const dossierReady = ['processing', 'shipped', 'delivered'].includes(order.status) && item.certificate_no
              return (
              <div key={item.id} className="flex items-start gap-3 border border-bureau-rule p-2">
                {item.custom_designs?.snapshot_url && (
                  <img src={item.custom_designs.snapshot_url} alt={item.product_name}
                    className="h-16 w-16 flex-shrink-0 border border-bureau-rule object-contain bg-bureau-surface" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[10px] text-bureau-muted">{item.registry_no}</p>
                  <p className="text-[12px] font-semibold uppercase">{item.product_name}</p>
                  {item.collectionName && (
                    <p className="font-mono text-[9.5px] uppercase tracking-wide text-bureau-amber">
                      {tr ? 'Koleksiyon' : 'Collection'}: {item.collectionName[locale] ?? item.collectionName.tr}
                    </p>
                  )}
                  {item.custom_designs?.design_data?.parts && (
                    <div className="mt-1">
                      {item.custom_designs.design_data.parts.map((p: any, i: number) => (
                        <p key={i} className="font-mono text-[9.5px] text-bureau-muted">
                          [{p.slotType}] {p.partId} · {p.materialId}
                        </p>
                      ))}
                    </div>
                  )}
                  {dossierReady && (
                    <a
                      href={`/${locale}/dossier/${item.certificate_no}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block font-mono text-[9.5px] uppercase tracking-wide text-bureau-black underline hover:text-bureau-amber"
                    >
                      → {tr ? 'Ürün Kimlik Sayfası' : 'Product Identity Page'}
                    </a>
                  )}
                </div>
                <span className="font-mono text-[11px] font-semibold">
                  {formatPrice(item.total_price / 100, currency, intlLocale)}
                </span>
              </div>
              )
            })}
          </div>

          {/* Durum güncelleme */}
          <div className="flex flex-wrap items-center gap-2 border-t border-bureau-rule pt-3">
            <input
              type="text"
              value={tracking}
              onChange={e => setTracking(e.target.value)}
              placeholder={tr ? 'Takip no (opsiyonel)' : 'Tracking number (optional)'}
              className="border border-bureau-rule px-2 py-1 font-mono text-[10px] outline-none focus:border-bureau-black"
            />
            {['received', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
              <button
                key={s}
                onClick={() => onUpdateStatus(order.id, s, tracking || undefined)}
                className={`border px-3 py-1 font-mono text-[9.5px] uppercase tracking-wide transition-colors ${
                  order.status === s
                    ? 'border-bureau-black bg-bureau-black text-white'
                    : 'border-bureau-rule text-bureau-muted hover:border-bureau-black hover:text-bureau-black'
                }`}
              >
                {STATUS_LABELS[s]?.[locale] ?? s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ServiceRow({ req, locale, onUpdate }: {
  req: any
  locale: 'tr' | 'en'
  onUpdate: (id: string, status: string, notes?: string) => void
}) {
  const tr = locale === 'tr'
  const [expanded, setExpanded] = useState(false)
  const [notes, setNotes] = useState(req.admin_notes ?? '')

  return (
    <div className="border border-bureau-rule">
      <div
        className="flex cursor-pointer items-center justify-between px-4 py-3 hover:bg-bureau-surface"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] font-semibold text-bureau-black">
            {req.profiles?.account_id ?? req.user_id?.slice(0, 8)}
          </span>
          <span className="text-[11px] text-bureau-muted">
            {req.order_items?.product_name ?? '—'}
          </span>
          <span className="font-mono text-[9.5px] uppercase text-bureau-amber">
            {SERVICE_STATUS_LABELS[req.status]?.[locale] ?? req.status}
          </span>
        </div>
        <span className="font-mono text-[9px] text-bureau-subtle">
          {new Date(req.created_at).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US')}
        </span>
      </div>

      {expanded && (
        <div className="border-t border-bureau-rule px-4 py-4 space-y-3">
          <div>
            <p className="font-mono text-[9px] uppercase text-bureau-muted mb-1">
              {tr ? 'Müşteri' : 'Customer'}: {req.profiles?.full_name} ({req.profiles?.email})
            </p>
            <p className="text-[12px] leading-relaxed">{req.issue_description}</p>
          </div>
          <div>
            <label className="mb-1 block font-mono text-[9.5px] uppercase text-bureau-muted">
              {tr ? 'Admin Notu' : 'Admin Notes'}
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-bureau-rule px-2 py-1 font-mono text-[11px] outline-none focus:border-bureau-black"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {['reviewing', 'in_service', 'resolved', 'rejected'].map(s => (
              <button
                key={s}
                onClick={() => onUpdate(req.id, s, notes || undefined)}
                className={`border px-3 py-1 font-mono text-[9.5px] uppercase transition-colors ${
                  req.status === s
                    ? 'border-bureau-black bg-bureau-black text-white'
                    : 'border-bureau-rule text-bureau-muted hover:border-bureau-black'
                }`}
              >
                {SERVICE_STATUS_LABELS[s]?.[locale] ?? s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}