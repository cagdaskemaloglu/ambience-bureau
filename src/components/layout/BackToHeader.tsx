'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'

/**
 * "Header'a ışınla" oku: içerik (header ile footer arasındaki alan) ilk
 * ekranın yarısından fazla kayınca sağ altta, footer'ın hemen üstünde
 * belirir. Tıklayınca kaydırma animasyonu OLMADAN anında en üste ışınlar
 * (header + ilk ekran), ardından kısa bir ışın izi bırakır.
 */
export function BackToHeader() {
  const tr = useLocale() === 'tr'
  const [visible, setVisible] = useState(false)
  const [beam, setBeam] = useState(false)

  useEffect(() => {
    const main = document.getElementById('main-content')
    if (!main) return
    const onScroll = () => setVisible(main.scrollTop > main.clientHeight * 0.6)
    onScroll()
    main.addEventListener('scroll', onScroll, { passive: true })
    return () => main.removeEventListener('scroll', onScroll)
  }, [])

  function teleport() {
    const main = document.getElementById('main-content')
    if (!main) return
    main.scrollTo({ top: 0, behavior: 'auto' })
    setBeam(true)
    window.setTimeout(() => setBeam(false), 650)
    // Klavye kullanıcısı için odağı içeriğin başına taşı.
    main.focus({ preventScroll: true })
  }

  const label = tr ? "Header'a ışınla" : 'Beam to header'

  return (
    <>
      {beam && (
        <span
          aria-hidden="true"
          className="beam-trail pointer-events-none absolute bottom-0 right-[42px] top-0 z-40 w-px bg-gradient-to-t from-transparent via-bureau-amber to-transparent"
        />
      )}
      <button
        type="button"
        onClick={teleport}
        aria-label={label}
        title={label}
        tabIndex={visible ? 0 : -1}
        aria-hidden={!visible}
        className={`focus-bureau group absolute bottom-4 right-5 z-40 flex h-11 items-center gap-2 border border-bureau-amber bg-bureau-white/85 px-3 font-mono text-[10px] uppercase tracking-widest text-bureau-amber backdrop-blur-[3px] transition-all duration-200 hover:bg-bureau-amber hover:text-bureau-white ${
          visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'
        }`}
      >
        <span aria-hidden="true" className="text-[16px] leading-none transition-transform duration-200 group-hover:-translate-y-0.5">
          ↑
        </span>
        <span className="hidden sm:inline">{label}</span>
      </button>
    </>
  )
}
