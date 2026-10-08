'use client'

import { useEffect } from 'react'
import { useLocale } from 'next-intl'

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
    // PayTR'nin resmi resizer script'i — zaten yüklenmişse tekrar eklemiyoruz.
    const existing = document.getElementById('paytr-iframe-resizer')
    const script = existing ?? document.createElement('script')
    if (!existing) {
      script.id = 'paytr-iframe-resizer'
      script.src = 'https://www.paytr.com/js/iframeResizer.min.js'
      document.body.appendChild(script)
    }

    function initResize() {
      // @ts-expect-error — iFrameResize, PayTR'nin script'i tarafından global olarak tanımlanıyor.
      if (typeof window.iFrameResize === 'function') {
        // @ts-expect-error
        window.iFrameResize({}, '#paytr-iframe')
      }
    }

    if (existing) {
      initResize()
    } else {
      script.addEventListener('load', initResize)
    }

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
