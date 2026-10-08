'use client'

import { useEffect } from 'react'
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
    <div>
      <div className="mb-4 border-b border-dashed border-bureau-rule pb-3">
        <p className="font-mono text-[11px] uppercase tracking-wide text-bureau-muted">
          {locale === 'tr'
            ? 'Güvenli ödeme sayfası yükleniyor...'
            : 'Loading secure payment page...'}
        </p>
      </div>
      <iframe
        id="paytr-iframe"
        src={`https://www.paytr.com/odeme/guvenli/${token}`}
        frameBorder={0}
        scrolling="no"
        style={{ width: '100%', minHeight: 600 }}
      />
    </div>
  )
}
