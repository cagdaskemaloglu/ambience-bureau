/**
 * Bir bültenin panelde/arşivde gösterilecek "etiket → değer" satırları.
 * Link bir drop ise o drop'un CANLI satırları (tahsis, kalan adet, durum)
 * otomatik üretilir; elle girilen satırlar onların altına eklenir.
 * Saf modül — sunucu ve istemci ortak kullanır.
 */
import { resolveDropState } from '@/lib/dropSchedule'
import { getLocalizedValue } from '@/lib/sanity'
import type { Bulletin } from '@/types'

export interface InfoRow {
  k: string
  v: string
  href?: string
}

export function bulletinRows(b: Bulletin, locale: string): InfoRow[] {
  const tr = locale === 'tr'
  const intl = tr ? 'tr-TR' : 'en-US'
  const rows: InfoRow[] = []

  if (b.drop) {
    const d = b.drop
    const name = getLocalizedValue(d.name, locale, '') ?? ''
    rows.push({
      k: tr ? 'Tahsis' : 'Allocation',
      v: `DROP-${d.dropNo}${name ? ` · ${name}` : ''}`,
      href: `#drop-${d.dropNo}`,
    })
    const planned = typeof d.plannedQuantity === 'number' ? d.plannedQuantity : null
    const remaining = planned !== null ? Math.max(0, planned - (d.soldCount ?? 0)) : null
    if (planned !== null && remaining !== null) {
      rows.push({ k: tr ? 'Kalan adet' : 'Units remaining', v: `${remaining.toLocaleString(intl)} / ${planned.toLocaleString(intl)}` })
    }
    const state = resolveDropState(d.active, d.scheduledAt)
    let status: string
    if (remaining === 0) status = tr ? 'Tahsis tamamlandı' : 'Fully allocated'
    else if (state === 'upcoming' && d.scheduledAt)
      status = `${tr ? 'Yakında' : 'Upcoming'} · ${new Date(d.scheduledAt).toLocaleDateString(intl, { day: '2-digit', month: '2-digit', year: 'numeric' })}`
    else if (state === 'hidden') status = tr ? 'Kapalı' : 'Closed'
    else status = tr ? 'Yayında' : 'Live'
    rows.push({ k: tr ? 'Durum' : 'Status', v: status })
  }

  for (const r of b.rows ?? []) {
    const k = getLocalizedValue(r.label, locale, '') ?? ''
    const v = getLocalizedValue(r.value, locale, '') ?? ''
    if (k || v) rows.push({ k, v })
  }
  return rows
}
