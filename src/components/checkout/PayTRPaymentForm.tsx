'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'

const RESIZER_SCRIPT_ID = 'paytr-iframe-resizer'
const RESIZER_SCRIPT_SRC = 'https://www.paytr.com/js/iframeResizer.min.js'

// PayTR'nin resizer script'i global olarak window.iFrameResize tanımlıyor.
type IFrameResizeFn = (options: Record<string, unknown>, selector: string) => unknown

function initResize() {
  const fn = (window as unknown as { iFrameResize?: IFrameResizeFn }).iFrameResize
  if (typeof fn === 'function') {
    fn({}, '#paytr-iframe')
  }
}

/**
 * PayTR iFrame API — IyzicoPaymentForm.tsx'in yerini alıyor. iyzico'nun
 * script-enjeksiyonu gerektiren karmaşık widget'ının aksine, PayTR sadece
 * bir <iframe> + PayTR'nin resmi "iframeResizer" script'i (iframe'in
 * içeriğine göre yüksekliğini otomatik ayarlıyor, aksi halde kaydırma
 * çubuğu/kesik görünüm olabilir).
 */
export function PayTRPaymentForm({ token }: { token: string }) {
  const locale = useLocale()
  // Karanlık modda PayTR formu görsel olarak koyulaştırılır (bkz. aşağıdaki not).
  const [darkForm, setDarkForm] = useState(true)

  useEffect(() => {
    const existing = document.getElementById(RESIZER_SCRIPT_ID)

    // Script zaten yüklüyse tekrar eklemiyoruz, sadece yeniden başlatıyoruz.
    if (existing) {
      initResize()
      return
    }

    const script = document.createElement('script')
    script.id = RESIZER_SCRIPT_ID
    script.src = RESIZER_SCRIPT_SRC
    script.addEventListener('load', initResize)
    document.body.appendChild(script)

    return () => {
      script.removeEventListener('load', initResize)
    }
  }, [token])

  return (
    <div className="mx-auto w-full max-w-[720px]">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-dashed border-bureau-rule pb-3">
        <p className="font-mono text-[11px] uppercase tracking-wide text-bureau-muted">
          {locale === 'tr'
            ? 'Güvenli ödeme sayfası yükleniyor...'
            : 'Loading secure payment page...'}
        </p>
        {/* Sadece karanlık modda görünür: formu açık/koyu arasında çevirir. */}
        <button
          type="button"
          onClick={() => setDarkForm((v) => !v)}
          className="hidden flex-shrink-0 font-mono text-[9.5px] uppercase tracking-wider text-bureau-subtle hover:text-bureau-amber dark:block"
        >
          {darkForm
            ? locale === 'tr' ? 'Açık form' : 'Light form'
            : locale === 'tr' ? 'Koyu form' : 'Dark form'}
        </button>
      </div>
      {/*
        PayTR formu KENDİ sayfası (cross-origin iframe) — içindeki renkleri
        CSS/JS ile doğrudan değiştiremeyiz. Karanlık modda iframe'in
        GÖRÜNÜŞÜNÜ tarayıcı filtresiyle çeviriyoruz: invert(.95) beyazı
        site zeminiyle aynı #0D0D0D yapar, hue-rotate(180deg) mavi/turuncu
        gibi renk tonlarını yaklaşık özgün haline döndürür. Sadece görsel —
        formun çalışması/güvenliği etkilenmez. Okunaksız gelirse yukarıdaki
        "Açık form" düğmesi filtreyi kapatır.
      */}
      <iframe
        id="paytr-iframe"
        src={`https://www.paytr.com/odeme/guvenli/${token}`}
        frameBorder={0}
        scrolling="no"
        className={darkForm ? 'dark:[filter:invert(.95)_hue-rotate(180deg)]' : ''}
        style={{ width: '100%', minHeight: 600 }}
      />
    </div>
  )
}
