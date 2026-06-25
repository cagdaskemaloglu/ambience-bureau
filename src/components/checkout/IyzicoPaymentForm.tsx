'use client'

import { useEffect, useRef } from 'react'
import { useLocale } from 'next-intl'

/**
 * iyzico Checkout Form Initialize'dan dönen `checkoutFormContent`,
 * bir <script> tag'i içerir (iyzico'nun kendi widget script'i, formu
 * gömülü olarak render eder). React'in dangerouslySetInnerHTML'i
 * <script> tag'lerini ÇALIŞTIRMAZ (güvenlik nedeniyle), bu yüzden
 * script'i manuel olarak DOM'a ekleyip çalıştırmamız gerekiyor.
 */
export function IyzicoPaymentForm({ htmlContent }: { htmlContent: string }) {
  const locale = useLocale()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // İçeriği geçici bir elemana parse et, script ve diğer node'ları ayır
    const temp = document.createElement('div')
    temp.innerHTML = htmlContent

    const originalScripts = Array.from(temp.querySelectorAll('script'))

    containerRef.current.innerHTML = ''
    containerRef.current.appendChild(temp)

    // Script'leri manuel olarak yeniden oluşturup DOM'a ekle — bu, tarayıcının
    // onları gerçekten çalıştırmasını sağlar (innerHTML ile eklenen script'ler çalışmaz).
    // Eklenen yeni script elementlerine referans tutuyoruz, cleanup'ta SADECE
    // bunları kaldırıyoruz (başka script'lerle çakışma riski olmadan).
    const injectedScripts: HTMLScriptElement[] = []

    originalScripts.forEach((oldScript) => {
      const newScript = document.createElement('script')
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value)
      })
      newScript.textContent = oldScript.textContent
      document.body.appendChild(newScript)
      injectedScripts.push(newScript)
    })

    return () => {
      // Cleanup: SADECE bu component'in eklediği script elemanlarını kaldır
      injectedScripts.forEach((script) => script.remove())
    }
  }, [htmlContent])

  return (
    <div>
      <div className="mb-4 border-b border-dashed border-bureau-rule pb-3">
        <p className="font-mono text-[11px] uppercase tracking-wide text-bureau-muted">
          {locale === 'tr'
            ? 'Güvenli ödeme sayfası yükleniyor...'
            : 'Loading secure payment page...'}
        </p>
      </div>
      <div ref={containerRef} id="iyzipay-checkout-form" />
    </div>
  )
}
