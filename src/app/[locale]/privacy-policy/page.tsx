import type { Metadata } from 'next'
import { LegalDocument, type LegalSection } from '@/components/legal/LegalDocument'

type PageProps = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  const tr = locale === 'tr'
  return {
    title: tr ? 'Gizlilik Politikası — The Ambience Bureau' : 'Privacy Policy — The Ambience Bureau',
    description: tr
      ? 'Ambience Bureau mobil uygulamasının gizlilik politikası.'
      : 'Privacy policy for the Ambience Bureau mobile app.',
    alternates: {
      canonical: `/${locale}/privacy-policy`,
      languages: { tr: '/tr/privacy-policy', en: '/en/privacy-policy' },
    },
  }
}

const SECTIONS_EN: LegalSection[] = [
  {
    heading: 'Core Principle',
    paragraphs: [
      "Ambience Bureau does not send any data to remote servers. All device information, settings, and preferences are stored exclusively on your phone's local storage. The App communicates with your ESP32 devices directly and only over your local network (your home Wi-Fi).",
    ],
  },
  {
    heading: 'Data We Collect and Process',
    items: [
      {
        label: 'Device information (local storage):',
        text: "The name, IP address, PIN (if set), and color/brightness preferences of ESP32 devices you add are stored on your phone (AsyncStorage). This information is never transmitted to any server.",
      },
      {
        label: 'Language preference:',
        text: 'Your chosen app language (Turkish/English) is stored locally.',
      },
      {
        label: 'Automation rules:',
        text: 'Timer and automation rules you create are stored both on your phone and in the memory of the relevant ESP32 device.',
      },
    ],
  },
  {
    heading: 'Permissions and Why We Need Them',
    items: [
      {
        label: 'Local network access:',
        text: 'Required to discover your ESP32 devices on your network and communicate with them.',
      },
      {
        label: 'Location permission (Android only):',
        text: "Android requires location permission to perform Wi-Fi network scans. The App does not record or use your location for any other purpose; this permission is solely a technical requirement imposed by Android.",
      },
      {
        label: 'Notifications:',
        text: 'Used to remind you of your scheduled timer/automation rules. All notifications are planned locally on your device.',
      },
    ],
  },
  {
    heading: 'Sharing Data with Third Parties',
    paragraphs: [
      'The App does not share, sell, or use any user data for advertising purposes with any third party. There are no ads in the App.',
    ],
  },
  {
    heading: 'Firmware Updates (OTA)',
    paragraphs: [
      'When checking for a firmware update, the App accesses a publicly hosted file on GitHub to retrieve the latest version information. No personal data is sent during this request.',
    ],
  },
  {
    heading: "Children's Privacy",
    paragraphs: [
      'The App is not directed at children under the age of 13 (or the applicable minimum age in your jurisdiction). Since the App does not create accounts or transmit data to any server, we do not knowingly collect personal data from children.',
    ],
  },
  {
    heading: 'Deleting Your Data',
    paragraphs: [
      'When you remove a device from the list or uninstall the App, all related data stored on your phone is deleted. You can also wipe all data on the ESP32 device itself by performing a factory reset.',
    ],
  },
  {
    heading: 'Your Rights (GDPR / KVKK)',
    paragraphs: [
      'Because the App does not collect or process personal data on any server, most data-subject request procedures under GDPR or Turkish Law No. 6698 (KVKK) do not apply in practice — there is no remote copy of your data for us to access, correct, or erase on your behalf. You can exercise full control over your local data at any time by removing a device or uninstalling the App.',
    ],
  },
  {
    heading: 'Contact',
    paragraphs: [
      'If you have questions about this privacy policy, you can reach us at contact@ambiencebureau.com or via the contact information provided in the App Store / Google Play listing.',
    ],
  },
  {
    heading: 'Changes',
    paragraphs: [
      'If this policy is updated, the date of the change will be reflected in the "Last updated" field above.',
    ],
  },
]

const SECTIONS_TR: LegalSection[] = [
  {
    heading: 'Temel İlke',
    paragraphs: [
      "Ambience Bureau, herhangi bir uzak sunucuya veri göndermez. Tüm cihaz bilgileri, ayarlar ve tercihler yalnızca telefonunuzun yerel depolama alanında saklanır. Uygulama, ESP32 cihazlarınızla doğrudan ve yalnızca aynı yerel ağ (ev Wi-Fi'ınız) üzerinden iletişim kurar.",
    ],
  },
  {
    heading: 'Topladığımız ve İşlediğimiz Veriler',
    items: [
      {
        label: 'Cihaz bilgileri (yerel depolama):',
        text: 'Eklediğiniz ESP32 cihazlarının adı, IP adresi, PIN kodu (varsa) ve renk/parlaklık tercihleri telefonunuzda (AsyncStorage) saklanır. Bu bilgiler hiçbir sunucuya iletilmez.',
      },
      {
        label: 'Dil tercihi:',
        text: 'Seçtiğiniz uygulama dili (Türkçe/İngilizce) yerel olarak saklanır.',
      },
      {
        label: 'Otomasyon kuralları:',
        text: 'Oluşturduğunuz zamanlayıcı ve otomasyon kuralları hem telefonunuzda hem de ilgili ESP32 cihazının kendi belleğinde saklanır.',
      },
    ],
  },
  {
    heading: 'İstenen İzinler ve Nedenleri',
    items: [
      {
        label: 'Yerel ağ erişimi:',
        text: 'ESP32 cihazlarınızı ağınızda bulabilmek ve onlarla iletişim kurabilmek için gereklidir.',
      },
      {
        label: 'Konum izni (yalnızca Android):',
        text: "Android işletim sistemi, Wi-Fi ağ taraması yapabilmek için konum izni zorunlu kılar. Uygulama, konumunuzu kaydetmez veya başka bir amaçla kullanmaz; bu izin yalnızca Android'in teknik bir gereksinimidir.",
      },
      {
        label: 'Bildirimler:',
        text: 'Oluşturduğunuz zamanlayıcı/otomasyon kurallarının size hatırlatılması için kullanılır. Tüm bildirimler cihazınızda yerel olarak planlanır.',
      },
    ],
  },
  {
    heading: 'Üçüncü Taraflarla Veri Paylaşımı',
    paragraphs: [
      'Uygulama, hiçbir kullanıcı verisini üçüncü taraflarla paylaşmaz, satmaz veya reklam amacıyla kullanmaz. Uygulama içinde reklam bulunmaz.',
    ],
  },
  {
    heading: 'Firmware Güncellemeleri (OTA)',
    paragraphs: [
      'Cihazınızın firmware güncellemesini kontrol ederken Uygulama, güncel sürüm bilgisini almak için GitHub üzerinde barındırılan herkese açık bir dosyaya erişir. Bu istek sırasında kişisel veri gönderilmez.',
    ],
  },
  {
    heading: 'Çocukların Gizliliği',
    paragraphs: [
      "Uygulama 13 yaşından küçük çocuklara (veya bulunduğunuz ülkedeki geçerli asgari yaşa) yönelik değildir. Uygulama hesap oluşturmadığı ve hiçbir sunucuya veri iletmediği için, çocuklardan bilerek kişisel veri toplamıyoruz.",
    ],
  },
  {
    heading: 'Verilerin Silinmesi',
    paragraphs: [
      'Bir cihazı listeden kaldırdığınızda veya uygulamayı sildiğinizde, telefonunuzda saklanan tüm ilgili veriler silinir. ESP32 cihazınızı fabrika ayarlarına sıfırlayarak cihaz üzerindeki tüm verileri de temizleyebilirsiniz.',
    ],
  },
  {
    heading: 'Haklarınız (KVKK / GDPR)',
    paragraphs: [
      'Uygulama hiçbir kişisel veriyi sunucuda toplamadığı veya işlemediği için, 6698 sayılı KVKK veya GDPR kapsamındaki veri sahibi başvuru süreçlerinin pratikte bir karşılığı bulunmamaktadır — verilerinizin bizim tarafımızdan erişilebilecek, düzeltilebilecek veya silinebilecek uzak bir kopyası yoktur. Yerel verileriniz üzerindeki tam kontrolü, istediğiniz an bir cihazı kaldırarak veya uygulamayı silerek kullanabilirsiniz.',
    ],
  },
  {
    heading: 'İletişim',
    paragraphs: [
      'Bu gizlilik politikası hakkında sorularınız için contact@ambiencebureau.com adresinden veya App Store / Google Play listesindeki iletişim bilgilerinden bize ulaşabilirsiniz.',
    ],
  },
  {
    heading: 'Değişiklikler',
    paragraphs: [
      'Bu politika güncellenirse, değişiklik tarihi yukarıda belirtilen "Son güncelleme" alanından takip edilebilir.',
    ],
  },
]

export default async function PrivacyPolicyPage({ params }: PageProps) {
  const { locale } = await params
  const tr = locale === 'tr'

  return (
    <LegalDocument
      documentRef="DOCUMENT REF: TAB-2026-LGL-01 // CLASSIFICATION: PRIVACY"
      sectionLabel="SECTION 05"
      title={tr ? 'Gizlilik Politikası' : 'Privacy Policy'}
      lastUpdated={tr ? 'Son güncelleme: Haziran 2026' : 'Last updated: June 2026'}
      intro={
        tr
          ? 'Ambience Bureau ("Uygulama"), ESP32 tabanlı akıllı LED cihazlarınızı yerel Wi-Fi ağınız üzerinden kontrol etmenizi sağlayan bir mobil uygulamadır. Bu belge, Uygulamanın hangi verileri nasıl işlediğini açıklar.'
          : 'Ambience Bureau ("App") is a mobile application that lets you control your ESP32-based smart LED devices over your local Wi-Fi network. This document explains what data the App processes and how.'
      }
      sections={tr ? SECTIONS_TR : SECTIONS_EN}
    />
  )
}