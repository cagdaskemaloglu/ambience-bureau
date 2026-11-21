/**
 * Anasayfadaki "Tüm Kayıtlar" bölümünü (RegisterSection) sayfadan
 * ayrılmadan süzmek için küçük olay köprüsü. Dosya dolabındaki sınıf
 * satırları, bülten linkleri vb. bunu çağırır; RegisterSection dinler.
 */
export const REGISTER_SECTION_ID = 'tum-kayitlar'
export const REGISTER_FILTER_EVENT = 'bureau:register-filter'

export interface RegisterFilterDetail {
  mode?: 'all' | 'limited' | 'standing'
  category?: string | null
}

export function requestRegisterFilter(detail: RegisterFilterDetail) {
  window.dispatchEvent(new CustomEvent<RegisterFilterDetail>(REGISTER_FILTER_EVENT, { detail }))
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  document.getElementById(REGISTER_SECTION_ID)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
}
