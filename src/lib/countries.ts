import countries from 'i18n-iso-countries'
import en from 'i18n-iso-countries/langs/en.json'
import tr from 'i18n-iso-countries/langs/tr.json'

countries.registerLocale(en)
countries.registerLocale(tr)

type Lang = 'tr' | 'en'

/** ISO numeric (örn. "792", "4") → alpha-2 ("TR"). Bulunamazsa null. */
export function numericToAlpha2(id: string | number | undefined | null): string | null {
  if (id === undefined || id === null || id === '') return null
  const padded = String(id).padStart(3, '0')
  return countries.numericToAlpha2(padded) ?? null
}

export function countryName(alpha2: string, lang: Lang): string {
  return countries.getName(alpha2, lang) ?? alpha2
}

/** Bayrak emojisi (regional indicator çifti). */
export function flagEmoji(alpha2: string | null | undefined): string {
  if (!alpha2 || alpha2.length !== 2) return ''
  const base = 0x1f1e6
  const a = alpha2.toUpperCase().charCodeAt(0) - 65
  const b = alpha2.toUpperCase().charCodeAt(1) - 65
  if (a < 0 || a > 25 || b < 0 || b > 25) return ''
  return String.fromCodePoint(base + a, base + b)
}

/** Form seçicisi için: yerelleştirilmiş isme göre sıralı tüm ülkeler. */
export function countryOptions(lang: Lang): { code: string; name: string }[] {
  const names = countries.getNames(lang, { select: 'official' }) as Record<string, string>
  return Object.entries(names)
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name, lang))
}

export function isValidAlpha2(code: string): boolean {
  return countries.isValid(code)
}
