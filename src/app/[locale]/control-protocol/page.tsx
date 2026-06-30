type PageProps = {
  params: {
    locale: string
  }
}

const content = {
  tr: {
    title: 'Kontrol Protokolü',
    description:
      'Kayıtlı her nesne, tek bir kontrol arayüzüne rapor eder. Aşağıdaki adımları izleyerek nesnenizi sisteme bağlayın.',
    section: 'SECTION 02',
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
    section: 'SECTION 02',
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

export default function ControlProtocolPage({
  params,
}: PageProps) {
  const isTR = params.locale === 'tr'
  const t = isTR ? content.tr : content.en

  return (
    <>
      <div className="border-b border-bureau-black px-6 py-3.5 font-mono text-[11px] text-bureau-muted sm:px-10">
        DOCUMENT REF: TAB-2026-APP-01 // CLASSIFICATION: CONTROL
        PROTOCOL
      </div>

      <section className="px-6 py-12 sm:px-10">
        <div className="mx-auto max-w-2xl">

          <div className="label-mono mb-2">
            {t.section}
          </div>

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

          {/* Download */}
          <div className="border border-bureau-black p-6 text-center">

            <p className="mb-5 font-mono text-[11px] uppercase tracking-wide text-bureau-muted">
              {t.download}
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">

              <a
                href="#"
                aria-label="Download from App Store"
                className="btn-bureau-outline inline-flex items-center justify-center"
              >
                App Store
              </a>

              <a
                href="#"
                aria-label="Download from Google Play"
                className="btn-bureau-outline inline-flex items-center justify-center"
              >
                Google Play
              </a>

            </div>

            <p className="mt-4 text-[10.5px] text-bureau-subtle">
              {t.footnote}
            </p>

          </div>

        </div>
      </section>
    </>
  )
}