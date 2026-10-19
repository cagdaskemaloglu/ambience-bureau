import { AppShowcase } from '@/components/control-protocol/AppShowcase'

type PageProps = {
  params: Promise<{
    locale: string
  }>
}
const content = {
  tr: {
    title: 'Kontrol Protokolü',
    description:
      'Kayıtlı her nesne, tek bir kontrol arayüzüne rapor eder. Aşağıdaki adımları izleyerek nesnenizi sisteme bağlayın.',
    download: 'Uygulamayı İndirin',
    footnote: 'Uygulama bağlantıları yakında aktif olacaktır.',
    steps: [
      {
        title: 'Uygulamayı İndirin',
        desc: 'App Store veya Google Play üzerinden The Ambience Bureau uygulamasını indirin.',
      },
      {
        title: 'Cihazı Eşleştirin',
        desc: 'Nesnenizin üzerindeki QR kodu tarayın veya manuel olarak ağa bağlayın.',
      },
      {
        title: 'Protokolleri Yapılandırın',
        desc: 'Işık programları, sesli komut entegrasyonu ve zamanlama ayarlarını yapın.',
      },
    ],
  },

  en: {
    title: 'Control Protocol',
    description:
      'Every registered object reports to a single control interface. Follow the steps below to connect your object to the system.',
    download: 'Download the App',
    footnote: 'App store links will be active soon.',
    steps: [
      {
        title: 'Download the App',
        desc: 'Download The Ambience Bureau app from the App Store or Google Play.',
      },
      {
        title: 'Pair Your Device',
        desc: 'Scan the QR code on your object or connect manually to the network.',
      },
      {
        title: 'Configure Protocols',
        desc: 'Set up light programs, voice command integration, and scheduling.',
      },
    ],
  },
} as const

export default async function ControlProtocolPage({
  params,
}: PageProps) {
  const { locale } = await params
  const isTR = locale === 'tr'
  const t = isTR ? content.tr : content.en

  return (
    <>
      <div className="border-b border-bureau-black px-6 py-3.5 font-mono text-[11px] text-bureau-muted sm:px-10">
        DOCUMENT REF: TAB-2026-APP-01 // CLASSIFICATION: CONTROL
        PROTOCOL
      </div>

      <section className="px-6 py-12 sm:px-10">
        <div className="mx-auto max-w-2xl">

          {/* İndirme — sayfanın en üstünde (footer'daki orijinal rozetlerle) */}
          <div className="mb-12 border border-bureau-black p-6 text-center">
            <p className="mb-5 font-mono text-[11px] uppercase tracking-wide text-bureau-muted">
              {t.download}
            </p>

            <div className="flex flex-row items-center justify-center gap-3">
              <a
                href="https://apps.apple.com/tr/app/ambience-bureau/id6794577754"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Download on the App Store"
                className="block transition-opacity hover:opacity-80"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/badges/app-store.svg" alt="Download on the App Store" className="h-11 w-auto" />
              </a>

              {/* Play Store henüz yayınlanmadı — footer'daki gibi tıklanınca
                  yönlendirmeyen görsel yer tutucu. */}
              <button
                type="button"
                aria-label="Google Play"
                className="block cursor-default p-0 transition-opacity hover:opacity-80"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/badges/google-play.svg" alt="Get it on Google Play" className="h-11 w-auto" />
              </button>
            </div>

            <p className="mt-4 text-[10.5px] text-bureau-subtle">
              {t.footnote}
            </p>
          </div>

          {/* Uygulama içi paneller — sayfanın en üstünde */}
          <AppShowcase locale={isTR ? 'tr' : 'en'} />

          <h1 className="mb-4 text-[30px] font-light uppercase tracking-wide">
            {t.title}
          </h1>

          <p className="mb-10 text-[14px] leading-relaxed text-bureau-muted">
            {t.description}
          </p>

          {/* Setup Steps */}
          <div className="mb-12 overflow-hidden border border-bureau-black">

            {t.steps.map((step, idx) => (
              <div
                key={step.title}
                className={`flex gap-5 p-5 ${
                  idx !== t.steps.length - 1
                    ? 'border-b border-dashed border-bureau-rule'
                    : ''
                }`}
              >
                <div className="min-w-[34px] font-mono text-[20px] font-light text-bureau-amber">
                  {String(idx + 1).padStart(2, '0')}
                </div>

                <div>
                  <h2 className="mb-1 text-[13px] font-semibold uppercase tracking-wide">
                    {step.title}
                  </h2>

                  <p className="text-[13px] leading-relaxed text-bureau-muted">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}

          </div>

        </div>
      </section>
    </>
  )
}