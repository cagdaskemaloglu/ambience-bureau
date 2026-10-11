/**
 * Drop'un zamana bağlı görünürlük durumu.
 *
 *  - active !== false                    → 'live'   (normal, yayında)
 *  - active === false + scheduledAt gelecekte → 'upcoming' (anasayfada "yakında":
 *                                                 geri sayım, ürünler gizli)
 *  - active === false + scheduledAt geçmişte  → 'live'   (zamanlanmış yayın
 *                                                 zamanı geldi, OTOMATİK yayında)
 *  - active === false + scheduledAt yok       → 'hidden' (hiçbir yerde görünmez)
 *
 * Bu fonksiyon SAF ve sunucu/istemci ortak — Sanity sonucu cache'lense bile
 * durum her istekte `now` ile yeniden hesaplanabilsin diye sorgu içinde değil
 * burada hesaplanıyor.
 */
export type DropState = 'live' | 'upcoming' | 'hidden'

export function resolveDropState(
  active: boolean | null | undefined,
  scheduledAt: string | null | undefined,
  now: number = Date.now()
): DropState {
  if (active !== false) return 'live'
  if (!scheduledAt) return 'hidden'
  const t = new Date(scheduledAt).getTime()
  if (Number.isNaN(t)) return 'hidden'
  return t > now ? 'upcoming' : 'live'
}
