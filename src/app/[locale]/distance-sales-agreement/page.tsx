import type { Metadata } from 'next'
import { LegalDocument, type LegalSection } from '@/components/legal/LegalDocument'

type PageProps = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  const tr = locale === 'tr'
  return {
    title: tr
      ? 'Mesafeli Satış Sözleşmesi — The Ambience Bureau'
      : 'Distance Sales Agreement — The Ambience Bureau',
    description: tr
      ? 'The Ambience Bureau üzerinden verilen siparişlere uygulanan mesafeli satış sözleşmesi.'
      : 'The distance sales agreement that applies to orders placed through The Ambience Bureau.',
    alternates: {
      canonical: `/${locale}/distance-sales-agreement`,
      languages: { tr: '/tr/distance-sales-agreement', en: '/en/distance-sales-agreement' },
    },
  }
}

// Satıcı bilgileri — sözleşmenin her iki dilde de aynı (sabit) kısmı.
const SELLER_TR = 'Satıcı: The Ambience Bureau'
const SELLER_ADDRESS_TR =
  'Adres: Merkez Mahallesi, 52.030 Sokak, No:21 A, C Blok, No:8, Mezitli/Mersin, Türkiye'
const SELLER_TAX_TR = 'Vergi Numarası: 5440804782'
const SELLER_EMAIL_TR = 'E-posta: contact@ambiencebureau.com'

const SELLER_EN = 'Seller: The Ambience Bureau'
const SELLER_ADDRESS_EN =
  'Address: Merkez Mahallesi, 52.030 Sokak, No:21 A, C Blok, No:8, Mezitli/Mersin, Türkiye'
const SELLER_TAX_EN = 'Tax ID: 5440804782'
const SELLER_EMAIL_EN = 'Email: contact@ambiencebureau.com'

const SECTIONS_TR: LegalSection[] = [
  {
    heading: 'Madde 1 — Taraflar',
    items: [
      { text: SELLER_TR },
      { text: SELLER_ADDRESS_TR },
      { text: SELLER_TAX_TR },
      { text: SELLER_EMAIL_TR },
      {
        text: 'Alıcı: Siparişi veren, bu sözleşmeyi sipariş onayı sırasında elektronik ortamda kabul eden gerçek veya tüzel kişi (sipariş sırasında belirttiğiniz ad, adres ve iletişim bilgileriyle taraf olarak kabul edilir).',
      },
    ],
  },
  {
    heading: 'Madde 2 — Sözleşmenin Konusu',
    paragraphs: [
      'Bu sözleşmenin konusu, Alıcının Satıcıya ait thebureau.com (The Ambience Bureau) internet sitesi üzerinden elektronik ortamda siparişini verdiği, sözleşmede belirtilen nitelikleri taşıyan ürünün satışı ve teslimi ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince tarafların hak ve yükümlülüklerinin belirlenmesidir.',
    ],
  },
  {
    heading: 'Madde 3 — Sözleşme Konusu Ürün ve Ödeme Bilgileri',
    paragraphs: [
      'Ürünün türü, miktarı, marka/modeli, satış bedeli (KDV dahil), ödeme şekli ve teslimat bilgileri, sipariş sırasında internet sitesinde Alıcıya gösterilen ve sipariş onayı ile Alıcıya e-posta yoluyla da iletilen sipariş özetinde yer alan bilgilerdir; bu bilgiler sözleşmenin eki ve ayrılmaz bir parçasıdır.',
      'Ödeme, Satıcının anlaşmalı ödeme kuruluşu iyzico altyapısı üzerinden kredi/banka kartı ile tahsil edilir. Ürün fiyatlarına KDV dahildir.',
    ],
  },
  {
    heading: 'Madde 4 — Teslimat',
    paragraphs: [
      'Ürün, siparişin onaylanmasından itibaren 1–5 iş günü içinde, Alıcının sipariş sırasında belirttiği adrese kargo ile teslim edilir. Teslimat ücreti Satıcı tarafından karşılanır. Detaylı bilgi için "Teslimat ve İade Şartları" sayfasına bakınız.',
    ],
  },
  {
    heading: 'Madde 5 — Cayma Hakkı',
    paragraphs: [
      'Alıcı, ürünün kendisine veya gösterdiği adresteki kişiye teslim edildiği tarihten itibaren 15 (on beş) gün içinde, hiçbir hukuki ve cezai sorumluluk üstlenmeksizin ve hiçbir gerekçe göstermeksizin malı reddederek cayma hakkını kullanabilir. Cayma hakkının kullanıldığına dair bildirim bu süre içinde contact@ambiencebureau.com adresine yapılmalıdır.',
      'Cayma hakkı süresi içinde malın işleyişine, teknik özelliklerine ve kullanım talimatlarına uygun şekilde kullanılması sebebiyle meydana gelen değişiklik ve bozulmalardan Alıcı sorumlu değildir.',
    ],
  },
  {
    heading: 'Madde 6 — Cayma Hakkının Kullanılamayacağı Haller',
    paragraphs: [
      'Mesafeli Sözleşmeler Yönetmeliği\u2019nin 15. maddesi uyarınca, Alıcının istekleri veya kişisel ihtiyaçları doğrultusunda hazırlanan ürünlerde cayma hakkı kullanılamaz. Bu kapsamda, Satıcının "Custom Registry" hizmeti üzerinden Alıcının taban, gövde ve başlık parçalarını ve malzemelerini kendi seçimiyle belirleyerek kişiye özel olarak tasarladığı ürünler bu istisna kapsamındadır.',
    ],
  },
  {
    heading: 'Madde 7 — Temerrüt Hali ve Hukuki Sonuçları',
    paragraphs: [
      'Alıcının, kredi/banka kartı ile yaptığı ödemelerde temerrüde düşmesi halinde, kart sözleşmesi çerçevesinde kart sahibi banka ile arasındaki faiz oranı uygulanır; bu nedenle doğacak hukuki ihtilaflarda Alıcı, kartı sağlayan bankanın hesaplarına itiraz edemez.',
    ],
  },
  {
    heading: 'Madde 8 — Yetkili Mahkeme',
    paragraphs: [
      'Bu sözleşmenin uygulanmasından kaynaklanan ihtilaflarda, Ticaret Bakanlığı tarafından her yıl ilan edilen değere kadar Alıcının veya Satıcının yerleşim yerindeki Tüketici Hakem Heyetleri, bu değerin üzerindeki ihtilaflarda ise Tüketici Mahkemeleri yetkilidir.',
    ],
  },
  {
    heading: 'Madde 9 — Sözleşmenin Yürürlüğü',
    paragraphs: [
      'Alıcı, sipariş onayı adımında bu sözleşmenin tüm koşullarını okuduğunu, anladığını ve elektronik ortamda kabul ettiğini beyan eder. Sipariş onayı ile birlikte bu sözleşme elektronik ortamda akdedilmiş ve yürürlüğe girmiş sayılır.',
    ],
  },
]

const SECTIONS_EN: LegalSection[] = [
  {
    heading: 'Article 1 — Parties',
    items: [
      { text: SELLER_EN },
      { text: SELLER_ADDRESS_EN },
      { text: SELLER_TAX_EN },
      { text: SELLER_EMAIL_EN },
      {
        text: 'Buyer: The individual or entity placing the order, who accepts this agreement electronically at the time of order confirmation (identified by the name, address, and contact information provided at checkout).',
      },
    ],
  },
  {
    heading: 'Article 2 — Subject of the Agreement',
    paragraphs: [
      'The subject of this agreement is to determine the rights and obligations of the parties, pursuant to Turkish Consumer Protection Law No. 6502 and the Distance Contracts Regulation, in connection with the sale and delivery of the product that the Buyer has ordered electronically through the Seller\u2019s website, The Ambience Bureau, with the characteristics specified in the order.',
    ],
  },
  {
    heading: 'Article 3 — Product and Payment Information',
    paragraphs: [
      'The type, quantity, brand/model, sale price (VAT included), payment method, and delivery information of the product are as shown to the Buyer on the website at the time of ordering and also sent to the Buyer by email as an order summary upon confirmation; this information forms an integral part of this agreement.',
      'Payment is collected by credit/debit card through the Seller\u2019s payment partner, iyzico. Product prices include VAT.',
    ],
  },
  {
    heading: 'Article 4 — Delivery',
    paragraphs: [
      'The product is delivered by courier to the address specified by the Buyer at checkout within 1–5 business days of order confirmation. Delivery is free of charge. See the "Shipping & Returns" page for further detail.',
    ],
  },
  {
    heading: 'Article 5 — Right of Withdrawal',
    paragraphs: [
      'The Buyer may exercise the right of withdrawal within 15 (fifteen) days from the date the product is delivered to the Buyer or to the person at the address specified by the Buyer, by rejecting the goods without any legal or financial liability and without giving any reason. Notice of withdrawal must be sent to contact@ambiencebureau.com within this period.',
      'The Buyer is not liable for any change or deterioration arising from the use of the product in a manner consistent with its operation, technical specifications, and instructions for use during the withdrawal period.',
    ],
  },
  {
    heading: 'Article 6 — Exceptions to the Right of Withdrawal',
    paragraphs: [
      'Pursuant to Article 15 of the Distance Contracts Regulation, the right of withdrawal does not apply to goods prepared according to the Buyer\u2019s requests or personal needs. This exception covers products individually designed by the Buyer through the Seller\u2019s "Custom Registry" service, where base, body, and head parts and materials are selected by the Buyer.',
    ],
  },
  {
    heading: 'Article 7 — Default and Its Legal Consequences',
    paragraphs: [
      'If the Buyer defaults on a payment made by credit/debit card, the interest rate applicable between the cardholder and the issuing bank, as set out in the cardholder agreement, shall apply; the Buyer may not raise objections against the issuing bank\u2019s accounts arising from any resulting legal disputes.',
    ],
  },
  {
    heading: 'Article 8 — Competent Court',
    paragraphs: [
      'For disputes arising from the application of this agreement, Consumer Arbitration Committees at the Buyer\u2019s or Seller\u2019s place of residence have jurisdiction up to the value announced annually by the Ministry of Trade; for disputes above this value, Consumer Courts have jurisdiction.',
    ],
  },
  {
    heading: 'Article 9 — Entry into Force',
    paragraphs: [
      'The Buyer declares that, at the order confirmation step, they have read, understood, and electronically accepted all terms of this agreement. Upon order confirmation, this agreement is deemed to have been concluded and entered into force electronically.',
    ],
  },
]

export default async function DistanceSalesAgreementPage({ params }: PageProps) {
  const { locale } = await params
  const tr = locale === 'tr'

  return (
    <LegalDocument
      documentRef="DOCUMENT REF: TAB-2026-LGL-04 // CLASSIFICATION: AGREEMENT"
      sectionLabel="SECTION 08"
      title={tr ? 'Mesafeli Satış Sözleşmesi' : 'Distance Sales Agreement'}
      lastUpdated={tr ? 'Son güncelleme: Ekim 2026' : 'Last updated: October 2026'}
      intro={
        tr
          ? 'Bu sözleşme, The Ambience Bureau internet sitesi üzerinden verdiğiniz siparişlere 6502 sayılı Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca uygulanır. Sipariş onayı ile bu sözleşmeyi elektronik ortamda kabul etmiş olursunuz.'
          : 'This agreement applies to orders placed through The Ambience Bureau website pursuant to Turkish Law No. 6502 and the Distance Contracts Regulation. By confirming your order, you electronically accept this agreement.'
      }
      sections={tr ? SECTIONS_TR : SECTIONS_EN}
    />
  )
}
