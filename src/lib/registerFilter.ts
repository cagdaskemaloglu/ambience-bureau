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
  // Anasayfada "Tüm Kayıtlar" ancak menüden seçilince açılır: önce seçim
  // alanında aç (hash), RegisterSection yerleşince süzgeci gönder.
  if (window.location.hash !== `#${REGISTER_SECTION_ID}`) history.replaceState(null, '', `#${REGISTER_SECTION_ID}`)
  window.dispatchEvent(new HashChangeEvent('hashchange'))
  window.setTimeout(() => {
    window.dispatchEvent(new CustomEvent<RegisterFilterDetail>(REGISTER_FILTER_EVENT, { detail }))
  }, 80)
}
