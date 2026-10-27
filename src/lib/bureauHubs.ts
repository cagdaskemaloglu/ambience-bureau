/**
 * Ülke koduna (ISO 3166-1 alpha-2) göre AKTİF Bölge Bürosu sayısı.
 * Haritada burada olmayan her ülke 0 sayılır. Yeni bir büro açıldığında
 * sadece buraya satır eklemek yeterli.
 */
export const ACTIVE_BUREAUS: Record<string, number> = {
  TR: 1,
}

export function activeBureauCount(alpha2: string | null | undefined): number {
  return alpha2 ? (ACTIVE_BUREAUS[alpha2] ?? 0) : 0
}
