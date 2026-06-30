export default async function BureauPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const isTR = locale === 'tr'

  return (
    <>
      <div className="border-b border-bureau-black px-6 py-3.5 font-mono text-[11px] text-bureau-muted sm:px-10">
        DOCUMENT REF: TAB-2026-CHR-01 // CLASSIFICATION: CHARTER
      </div>

      <div className="mx-auto max-w-2xl px-6 py-12 sm:px-10">
        <div className="label-mono mb-2">SECTION 04</div>
        <h1 className="mb-8 text-[30px] font-light uppercase tracking-wide">
          {isTR ? 'Büro' : 'Bureau'}
        </h1>

        <div className="space-y-5 text-[14px] leading-relaxed text-bureau-ink">
          <p>
            {isTR
              ? 'The Ambience Bureau, mekânsal foton düzenlemesi üzerine kurulu bir kayıt sistemidir. Her nesne, zanaat ile teknolojinin görünmez birleşimini temsil eder.'
              : 'The Ambience Bureau is a registry system founded on the regulation of spatial photons. Each object represents the invisible union of craft and technology.'}
          </p>

          <p>
            {isTR
              ? 'Atölyemizde üretilen her aydınlatma nesnesi, malzeme içine gizlenmiş teknoloji felsefesiyle tasarlanır — ışık, görünür biçimin ötesinde bir işlev kazanır.'
              : 'Every lighting object produced in our workshop is designed with a philosophy of technology hidden within material — light gains function beyond visible form.'}
          </p>

          <div className="border-t border-dashed border-bureau-rule pt-6">
            <h2 className="mb-3 font-mono text-[11px] uppercase tracking-wide text-bureau-muted">
              {isTR ? 'Protokol' : 'Protocol'}
            </h2>
            <p>
              {isTR
                ? 'Kayıt altına alınan her nesne, sertifikasyon süreci öncesinde malzeme, ışık performansı ve dijital entegrasyon açısından test edilir.'
                : 'Every registered object undergoes testing for material, light performance, and digital integration prior to certification.'}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}