import type { Metadata } from 'next'
import { LegalDocument, type LegalSection } from '@/components/legal/LegalDocument'

type PageProps = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  const tr = locale === 'tr'
  return {
    title: tr ? 'Kullanım Koşulları — The Ambience Bureau' : 'Terms of Use — The Ambience Bureau',
    description: tr
      ? 'Ambience Bureau mobil uygulamasının kullanım koşulları.'
      : 'Terms of use for the Ambience Bureau mobile app.',
    alternates: {
      canonical: `/${locale}/terms-of-use`,
      languages: { tr: '/tr/terms-of-use', en: '/en/terms-of-use' },
    },
  }
}

const SECTIONS_EN: LegalSection[] = [
  {
    heading: 'Purpose of the App',
    paragraphs: [
      'Ambience Bureau is designed to control ESP32-based LED devices over a local Wi-Fi network. The App may only be used for this purpose.',
    ],
  },
  {
    heading: 'User Responsibilities',
    items: [
      { text: 'You are responsible for using the App only to control your own devices.' },
      { text: "Unauthorized access to devices belonging to others is prohibited and is entirely the user's responsibility." },
      { text: 'Any liability arising from misuse of the App lies solely with the user.' },
    ],
  },
  {
    heading: 'Disclaimer',
    items: [
      { text: 'The App is provided "as is." Uninterrupted or error-free operation is not guaranteed.' },
      { text: 'No liability is accepted for damage caused by hardware failures of ESP32 devices, incorrect setup, or third-party accessories.' },
      { text: "The user is responsible for local network security; setting a PIN and securing the network is left to the user's discretion." },
    ],
  },
  {
    heading: 'Intellectual Property',
    paragraphs: [
      'The source code, design, and content of the App belong to the developer. Unauthorized copying, distribution, or modification is prohibited.',
    ],
  },
  {
    heading: 'Governing Law',
    paragraphs: [
      'These terms are governed by the laws of the Republic of Türkiye. Any dispute arising from these terms shall be subject to the exclusive jurisdiction of the courts of Mersin, Türkiye.',
    ],
  },
  {
    heading: 'Changes',
    paragraphs: [
      'These terms may be updated. The date of any change will be reflected in the "Last updated" field above.',
    ],
  },
  {
    heading: 'Contact',
    paragraphs: [
      'For questions, you can reach us at contact@ambiencebureau.com or via the contact information provided in the App Store / Google Play listing.',
    ],
  },
]

const SECTIONS_TR: LegalSection[] = [
  {
    heading: 'Uygulamanın Amacı',
    paragraphs: [
      'Ambience Bureau, ESP32 tabanlı LED cihazlarını yerel Wi-Fi ağı üzerinden kontrol etmek için tasarlanmıştır. Uygulama yalnızca bu amaçla kullanılabilir.',
    ],
  },
  {
    heading: 'Kullanıcının Sorumlulukları',
    items: [
      { text: 'Uygulamayı yalnızca kendi cihazlarınızı kontrol etmek için kullanmakla yükümlüsünüz.' },
      { text: 'Başkasına ait bir cihaza izinsiz erişmek yasaktır ve bu eylem tamamen kullanıcının sorumluluğundadır.' },
      { text: 'Uygulamanın kötüye kullanımından doğan her türlü sorumluluk kullanıcıya aittir.' },
    ],
  },
  {
    heading: 'Sorumluluk Reddi',
    items: [
      { text: 'Uygulama "olduğu gibi" sunulmaktadır. Kesintisiz veya hatasız çalışacağı garanti edilmez.' },
      { text: 'ESP32 cihazlarının donanımsal arızalarından, yanlış kurulumdan veya üçüncü taraf aksesuarlardan kaynaklanan zararlardan sorumluluk kabul edilmez.' },
      { text: 'Yerel ağ güvenliğinden kullanıcı sorumludur; PIN kodu belirlemek ve ağı güvence altına almak kullanıcının tercihine bırakılmıştır.' },
    ],
  },
  {
    heading: 'Fikri Mülkiyet',
    paragraphs: [
      'Uygulamanın kaynak kodu, tasarımı ve içeriği geliştiriciye aittir. İzinsiz kopyalanamaz, dağıtılamaz veya değiştirilemez.',
    ],
  },
  {
    heading: 'Uygulanacak Hukuk',
    paragraphs: [
      'Bu koşullar Türkiye Cumhuriyeti kanunlarına tabidir. Bu koşullardan doğan her türlü uyuşmazlıkta Mersin (Türkiye) mahkemeleri ve icra daireleri yetkilidir.',
    ],
  },
  {
    heading: 'Değişiklikler',
    paragraphs: [
      'Bu koşullar güncellenebilir. Değişiklik tarihi "Son güncelleme" alanından takip edilebilir.',
    ],
  },
  {
    heading: 'İletişim',
    paragraphs: [
      'Sorularınız için contact@ambiencebureau.com adresinden veya App Store / Google Play listesindeki iletişim bilgilerinden ulaşabilirsiniz.',
    ],
  },
]

export default async function TermsOfUsePage({ params }: PageProps) {
  const { locale } = await params
  const tr = locale === 'tr'

  return (
    <LegalDocument
      documentRef="DOCUMENT REF: TAB-2026-LGL-02 // CLASSIFICATION: TERMS"
      sectionLabel="SECTION 06"
      title={tr ? 'Kullanım Koşulları' : 'Terms of Use'}
      lastUpdated={tr ? 'Son güncelleme: Haziran 2026' : 'Last updated: June 2026'}
      intro={
        tr
          ? 'Bu uygulamayı kullanarak aşağıdaki koşulları kabul etmiş sayılırsınız.'
          : 'By using this App, you agree to the following terms.'
      }
      sections={tr ? SECTIONS_TR : SECTIONS_EN}
    />
  )
}