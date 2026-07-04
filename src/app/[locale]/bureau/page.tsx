import { ContactForm } from '@/components/bureau/ContactForm'

export default async function BureauPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const tr = locale === 'tr'

  return (
    <>
      <div className="border-b border-bureau-black px-6 py-3.5 font-mono text-[11px] text-bureau-muted sm:px-10">
        DOCUMENT REF: TAB-2026-CHR-01 // CLASSIFICATION: CHARTER
      </div>

      <div className="mx-auto max-w-3xl px-6 py-12 sm:px-10">
        {/* Başlık */}
        <div className="label-mono mb-2">SECTION 04</div>
        <h1 className="mb-8 text-[30px] font-light uppercase tracking-wide">
          {tr ? 'Büro' : 'Bureau'}
        </h1>

        {/* Hakkında */}
        <div className="mb-10 space-y-5 text-[14px] leading-relaxed text-bureau-ink">
          <p>
            {tr
              ? 'The Ambience Bureau, mekânsal foton düzenlemesi üzerine kurulu bir kayıt sistemidir. Her nesne, zanaat ile teknolojinin görünmez birleşimini temsil eder.'
              : 'The Ambience Bureau is a registry system founded on the regulation of spatial photons. Each object represents the invisible union of craft and technology.'}
          </p>
          <p>
            {tr
              ? 'Atölyemizde üretilen her aydınlatma nesnesi, malzeme içine gizlenmiş teknoloji felsefesiyle tasarlanır — ışık, görünür biçimin ötesinde bir işlev kazanır.'
              : 'Every lighting object produced in our workshop is designed with a philosophy of technology hidden within material — light gains function beyond visible form.'}
          </p>
          <div className="border-t border-dashed border-bureau-rule pt-6">
            <h2 className="mb-3 font-mono text-[11px] uppercase tracking-wide text-bureau-muted">
              {tr ? 'Protokol' : 'Protocol'}
            </h2>
            <p>
              {tr
                ? 'Kayıt altına alınan her nesne, sertifikasyon süreci öncesinde malzeme, ışık performansı ve dijital entegrasyon açısından test edilir.'
                : 'Every registered object undergoes testing for material, light performance, and digital integration prior to certification.'}
            </p>
          </div>
        </div>

        {/* Adres + İletişim Formu yan yana (desktop) */}
        <div className="grid grid-cols-1 gap-10 border-t border-bureau-black pt-10 lg:grid-cols-[1fr_2fr]">

          {/* Sol: Adres */}
          <div>
            <h2 className="mb-5 font-mono text-[11px] uppercase tracking-widest text-bureau-muted">
              {tr ? 'İletişim Bilgileri' : 'Contact Information'}
            </h2>

            <div className="space-y-5 font-mono text-[12px]">
              <div>
                <p className="mb-1 text-[9.5px] uppercase tracking-wider text-bureau-subtle">
                  {tr ? 'Atölye Adresi' : 'Workshop Address'}
                </p>
                <p className="leading-relaxed text-bureau-black">
                  The Ambience Bureau<br />
                  {tr ? 'Organize Sanayi Bölgesi' : 'Organized Industrial Zone'}<br />
                  Eskişehir, Türkiye
                </p>
              </div>

              <div>
                <p className="mb-1 text-[9.5px] uppercase tracking-wider text-bureau-subtle">
                  {tr ? 'E-posta' : 'Email'}
                </p>
                <a
                  href="mailto:ambiencebureau@gmail.com"
                  className="text-bureau-black underline hover:text-bureau-amber transition-colors"
                >
                  ambiencebureau@gmail.com
                </a>
              </div>

              <div>
                <p className="mb-1 text-[9.5px] uppercase tracking-wider text-bureau-subtle">
                  {tr ? 'Çalışma Saatleri' : 'Working Hours'}
                </p>
                <p className="leading-relaxed text-bureau-black">
                  {tr ? 'Pzt – Cum: 09:00 – 18:00' : 'Mon – Fri: 09:00 – 18:00'}
                </p>
              </div>
            </div>

            {/* Bürokratik not */}
            <div className="mt-8 border border-bureau-rule bg-bureau-surface p-4">
              <p className="font-mono text-[9.5px] leading-relaxed text-bureau-subtle">
                [{tr
                  ? 'TÜM İLETİŞİM KAYITLARI FORM 300-A KAPSAMINDA İŞLENMEKTEDİR.'
                  : 'ALL TRANSMISSIONS ARE PROCESSED UNDER FORM 300-A PROTOCOL.'}]
              </p>
            </div>
          </div>

          {/* Sağ: İletişim formu */}
          <div>
            <div className="mb-5 border-b border-bureau-black pb-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-bureau-muted">
                FORM 300-A // {tr ? 'GİRİŞ İLETİŞİMİ' : 'INCOMING TRANSMISSION'}
              </span>
              <h2 className="mt-1 text-[20px] font-light uppercase tracking-wide text-bureau-black">
                {tr ? 'İletişim' : 'Contact'}
              </h2>
            </div>
            <ContactForm />
          </div>
        </div>
      </div>
    </>
  )
}