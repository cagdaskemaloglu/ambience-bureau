'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'ambience-bureau-theme'

/**
 * <head>'e enjekte edilen ve hydration'dan ÖNCE çalışan blocking script ile
 * BİREBİR AYNI mantık (bkz. src/app/layout.tsx). Aralarında tutarsızlık
 * olursa React hydration sırasında class'ı geri değiştirip "flaş" yaratır.
 */
function resolveInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const ThemeContext = createContext<{
  theme: Theme
  toggleTheme: () => void
  setTheme: (t: Theme) => void
} | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // ÖNEMLİ: Sunucuda `window` yok, bu yüzden sunucu HER ZAMAN 'light' ile
  // render eder. Client'taki hydration (ilk) render'ı da BİREBİR AYNI
  // değerle başlamak ZORUNDA — aksi halde React "sunucu ile istemci
  // uyuşmuyor" hatası fırlatır (tam olarak bu hatayı aldınız: ikon sunucuda
  // "light", client'ın ilk render'ında doğrudan localStorage okunduğu için
  // "dark" çıkmıştı). Bu yüzden başlangıç değeri sabit 'light'.
  //
  // Gerçek tercih (localStorage/sistem) aşağıdaki useEffect'te, mount
  // olduktan SONRA okunup state'e yansıtılıyor — bu, hydration bittikten
  // sonraki normal bir state güncellemesi olduğu için hataya yol açmaz.
  // <html>'deki "dark" class'ı zaten layout.tsx'teki blocking script
  // tarafından hydration'dan ÖNCE doğru ayarlanmış durumda (sayfa genelinde
  // "flaş" yok); burada sadece ikon gibi React state'ine bağımlı küçük
  // detaylar bir sonraki frame'de gerçek değere kavuşuyor.
  const [theme, setThemeState] = useState<Theme>('light')

  const applyTheme = useCallback((t: Theme) => {
    setThemeState(t)
    window.localStorage.setItem(STORAGE_KEY, t)
    document.documentElement.classList.toggle('dark', t === 'dark')
  }, [])

  // Mount olur olmaz gerçek tercihi oku ve state'i buna göre güncelle.
  // DİKKAT: localStorage'a burada YAZMIYORUZ — kullanıcı henüz elle bir
  // seçim yapmadı, sadece mevcut (sistem/önceki) durumu React state'ine
  // yakalıyoruz. class'ı da tekrar set ediyoruz (blocking script'le
  // tutarlı olduğunu doğrulamak için, zaten aynı sonucu verir).
  useEffect(() => {
    const resolved = resolveInitialTheme()
    setThemeState(resolved)
    document.documentElement.classList.toggle('dark', resolved === 'dark')
  }, [])

  // Kullanıcı hiç elle seçim yapmadıysa (localStorage boşsa) ve işletim
  // sistemi teması değişirse (ör. gün batımında otomatik karanlık moda
  // geçen bir Mac) siteyi de otomatik takip ettir.
  useEffect(() => {
    if (window.localStorage.getItem(STORAGE_KEY)) return
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      if (window.localStorage.getItem(STORAGE_KEY)) return
      const t: Theme = e.matches ? 'dark' : 'light'
      setThemeState(t)
      document.documentElement.classList.toggle('dark', t === 'dark')
    }
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  const toggleTheme = useCallback(() => {
    applyTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, applyTheme])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: applyTheme }}>{children}</ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme() sadece ThemeProvider içinde kullanılabilir')
  return ctx
}
