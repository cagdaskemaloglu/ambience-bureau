'use client'

import { useState } from 'react'
import Image from 'next/image'

type Locale = 'tr' | 'en'

interface ShowcaseItem {
  imageTr: string
  imageEn: string
  titleTr: string
  titleEn: string
  descTr: string
  descEn: string
}

interface ShowcaseGroup {
  labelTr: string
  labelEn: string
  items: ShowcaseItem[]
}

// ── Ekran görüntüleri ──────────────────────────────────────
// Bu dosyaları public/app-showcase/ altına, tam olarak bu adlarla ekle.
// Önerilen oran: gerçek iPhone ekran görüntüsü oranı (yakl. 9:19.5).
const GROUPS: ShowcaseGroup[] = [
  {
    labelTr: 'Kayıt İşlemleri',
    labelEn: 'Onboarding',
    items: [
      {
        imageTr: '/app-showcase/tr/onboarding-1.png',
        imageEn: '/app-showcase/en/onboarding-1.png',
        titleTr: 'İlk Tescil / Birimi Bul',
        titleEn: 'New Registration / Find Unit',
        descTr:
          'Uygulamayı ilk açtığınızda karşınıza "İlk Tescil" ve "Birimi Bul" seçenekleri çıkar — yeni bir cihaz mı kaydediyorsunuz, yoksa ağınızdaki mevcut bir cihazı mı arıyorsunuz, buradan seçersiniz.',
        descEn:
          'When you first open the app, you\'re greeted with "New Registration" and "Find Unit" — choose whether you\'re registering a new device or searching for an existing one on your network.',
      },
      {
        imageTr: '/app-showcase/tr/onboarding-2.png',
        imageEn: '/app-showcase/en/onboarding-2.png',
        titleTr: 'Tescili Başlat → Wi-Fi Tanıtımı',
        titleEn: 'Start Registration → Wi-Fi Setup',
        descTr:
          '"Tescili Başlat"a dokunduğunuzda cihazınızın kurduğu geçici ESP32 ağına bağlanırsınız, ardından kendi Wi-Fi ağınızı cihaza tanıtırsınız.',
        descEn:
          'Tapping "Start Registration" connects you to the temporary ESP32 network your device creates, then lets you introduce your own Wi-Fi network to it.',
      },
      {
        imageTr: '/app-showcase/tr/onboarding-3.png',
        imageEn: '/app-showcase/en/onboarding-3.png',
        titleTr: 'Birimi Bul → Cihaz Tarama',
        titleEn: 'Find Unit → Device Scan',
        descTr:
          '"Birimi Bul" ile Tarama Ekranı açılır; ağınızdaki Bureau cihazları otomatik taranır ve tek dokunuşla hesabınıza eklenir.',
        descEn:
          '"Find Unit" opens the Scan Screen; Bureau devices on your network are detected automatically and added to your account with a single tap.',
      },
    ],
  },
  {
    labelTr: 'Sahne Kontrolü',
    labelEn: 'Scene Control',
    items: [
      {
        imageTr: '/app-showcase/tr/scene-control-1.png',
        imageEn: '/app-showcase/en/scene-control-1.png',
        titleTr: 'Model & Aç/Kapa',
        titleEn: 'Model & On/Off',
        descTr:
          'Fiziksel ışığınız ekranda birebir karşınıza çıkar — modele dokunarak ışığı doğrudan açıp kapatabilirsiniz.',
        descEn:
          'Your physical light appears on screen as a matching model — tap it to turn the light on or off directly.',
      },
      {
        imageTr: '/app-showcase/tr/scene-control-2.png',
        imageEn: '/app-showcase/en/scene-control-2.png',
        titleTr: 'Renk (Color)',
        titleEn: 'Color',
        descTr: 'Renk seçeneğiyle ışığın tonunu ve sıcaklığını dilediğiniz gibi ayarlayabilirsiniz.',
        descEn: 'The Color option lets you adjust the light\'s hue and warmth exactly how you like.',
      },
      {
        imageTr: '/app-showcase/tr/scene-control-3.png',
        imageEn: '/app-showcase/en/scene-control-3.png',
        titleTr: 'Sahneler',
        titleEn: 'Scenes',
        descTr:
          'Sahneler seçeneğiyle geniş bir yelpazede hazır ışık efektlerini (dinamik atmosferler) tek dokunuşla oynatabilirsiniz.',
        descEn:
          'The Scenes option lets you trigger a wide range of pre-built light effects (dynamic atmospheres) with a single tap.',
      },
      {
        imageTr: '/app-showcase/tr/scene-control-4.png',
        imageEn: '/app-showcase/en/scene-control-4.png',
        titleTr: 'Otomasyon',
        titleEn: 'Automation',
        descTr:
          'Otomasyon seçeneğiyle belirli saatlerde aç/kapa kuralları, tek seferlik zamanlamalar ve uyku modu (ışığı girilen süre boyunca yavaşça azaltarak kapatır) gibi kurallar tanımlayabilirsiniz.',
        descEn:
          'The Automation option lets you set scheduled on/off rules, one-time timers, and sleep mode (gradually dims the light to off over a set duration).',
      },
    ],
  },
  {
    labelTr: 'Diğer Özellikler',
    labelEn: 'More Features',
    items: [
      {
        imageTr: '/app-showcase/tr/feature-stats.png',
        imageEn: '/app-showcase/en/feature-stats.png',
        titleTr: 'İstatistikler',
        titleEn: 'Statistics',
        descTr: 'Kullandığınız ışıkların istatistikleri düzenli olarak tutulur — kullanım alışkanlıklarınızı görebilirsiniz.',
        descEn: 'Usage statistics for your lights are tracked continuously — see your usage patterns at a glance.',
      },
      {
        imageTr: '/app-showcase/tr/feature-groups.png',
        imageEn: '/app-showcase/en/feature-groups.png',
        titleTr: 'Gruplandırma',
        titleEn: 'Grouping',
        descTr:
          'Işıklarınızı gruplandırarak birden fazla cihazı tek bir komutla toplu olarak kontrol edebilir, birlikte hareket etmelerini sağlayabilirsiniz.',
        descEn:
          'Group your lights to control multiple devices together with a single command, letting them act in sync.',
      },
    ],
  },
]

function PhoneMockup({ src, alt, onClick }: { src: string; alt: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={alt}
      className="relative mx-auto w-[260px] flex-shrink-0 cursor-pointer sm:w-[280px]"
    >
      {/* Dış çerçeve */}
      <div className="relative aspect-[9/19.5] rounded-[2.4rem] border-[3px] border-bureau-black bg-bureau-black p-2 shadow-xl">
        {/* Ekran */}
        <div className="relative h-full w-full overflow-hidden rounded-[1.9rem] bg-bureau-surface">
          <Image src={src} alt={alt} fill sizes="280px" className="object-cover" />
        </div>
        {/* Dynamic Island */}
        <div className="absolute left-1/2 top-[14px] h-[22px] w-[84px] -translate-x-1/2 rounded-full bg-bureau-black" />
      </div>
      {/* Yan tuşlar (dekoratif) */}
      <div className="absolute -left-[3px] top-[86px] h-[46px] w-[3px] rounded-l bg-bureau-black" />
      <div className="absolute -right-[3px] top-[104px] h-[64px] w-[3px] rounded-r bg-bureau-black" />
    </button>
  )
}

export function AppShowcase({ locale }: { locale: Locale }) {
  const tr = locale === 'tr'
  const [groupIdx, setGroupIdx] = useState(0)
  const [itemIdx, setItemIdx] = useState(0)

  const group = GROUPS[groupIdx]
  const activeItem = group.items[itemIdx]
  const activeImage = tr ? activeItem.imageTr : activeItem.imageEn

  function selectGroup(idx: number) {
    setGroupIdx(idx)
    setItemIdx(0)
  }

  function handlePhoneClick() {
    // Telefon ekranına tıklamak da (liste öğesine tıklamak gibi) hem
    // bilgi metnini hem fotoğrafı bir sonraki adıma ilerletir — grubun
    // sonuna gelince başa döner.
    setItemIdx((i) => (i + 1) % group.items.length)
  }

  return (
    <div className="mt-16 border-t border-dashed border-bureau-rule pt-12">
      <div className="label-mono mb-2">SECTION 03</div>
      <h2 className="mb-2 text-[22px] font-light uppercase tracking-wide">
        {tr ? 'Uygulama İçinde' : 'Inside the App'}
      </h2>
      <p className="mb-8 text-[13px] leading-relaxed text-bureau-muted">
        {tr
          ? 'Nesnenizi tescil ettikten sonra, tüm kontrol bu uygulama üzerinden gerçekleşir.'
          : 'Once your object is registered, all control happens through this app.'}
      </p>

      {/* Grup sekmeleri */}
      <div className="mb-8 flex flex-wrap gap-2">
        {GROUPS.map((g, idx) => (
          <button
            key={g.labelEn}
            onClick={() => selectGroup(idx)}
            className={`border px-3.5 py-1.5 font-mono text-[10.5px] uppercase tracking-wide transition-colors ${
              idx === groupIdx
                ? 'border-bureau-amber bg-bureau-amber/10 text-bureau-amber'
                : 'border-bureau-rule text-bureau-muted hover:border-bureau-black hover:text-bureau-black'
            }`}
          >
            {String(idx + 1).padStart(2, '0')} — {tr ? g.labelTr : g.labelEn}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center gap-10 sm:flex-row sm:items-start sm:gap-12">
        {/* Sol: telefon mockup + ilerleme göstergesi */}
        <div className="flex flex-shrink-0 flex-col items-center gap-3">
          <PhoneMockup
            src={activeImage}
            alt={tr ? activeItem.titleTr : activeItem.titleEn}
            onClick={handlePhoneClick}
          />
          <div className="flex items-center gap-1.5">
            {group.items.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === itemIdx ? 'w-5 bg-bureau-amber' : 'w-1.5 bg-bureau-rule'
                }`}
              />
            ))}
          </div>
          <p className="font-mono text-[9px] uppercase tracking-wide text-bureau-subtle">
            {tr ? 'İlerlemek için ekrana dokunun' : 'Tap the screen to advance'}
          </p>
        </div>

        {/* Sağ: özellik listesi */}
        <div className="w-full flex-1 border border-bureau-black">
          {group.items.map((item, idx) => (
            <button
              key={item.imageTr}
              onClick={() => setItemIdx(idx)}
              className={`flex w-full gap-4 p-4 text-left transition-colors ${
                idx !== group.items.length - 1 ? 'border-b border-dashed border-bureau-rule' : ''
              } ${idx === itemIdx ? 'bg-bureau-amber/5' : 'hover:bg-bureau-surface'}`}
            >
              <div
                className={`min-w-[28px] font-mono text-[17px] font-light ${
                  idx === itemIdx ? 'text-bureau-amber' : 'text-bureau-subtle'
                }`}
              >
                {String(idx + 1).padStart(2, '0')}
              </div>
              <div>
                <h3
                  className={`mb-1 text-[12.5px] font-semibold uppercase tracking-wide ${
                    idx === itemIdx ? 'text-bureau-black' : 'text-bureau-muted'
                  }`}
                >
                  {tr ? item.titleTr : item.titleEn}
                </h3>
                <p className="text-[12.5px] leading-relaxed text-bureau-muted">
                  {tr ? item.descTr : item.descEn}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}