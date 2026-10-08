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
      ? 'Teslimat ve İade Şartları — The Ambience Bureau'
      : 'Shipping & Returns — The Ambience Bureau',
    description: tr
      ? 'The Ambience Bureau sipariş teslimat süreleri, kargo koşulları ve iade/cayma hakkı prosedürü.'
      : 'Delivery times, shipping terms, and the return / right-of-withdrawal process for The Ambience Bureau orders.',
    alternates: {
      canonical: `/${locale}/shipping-returns`,
      languages: { tr: '/tr/shipping-returns', en: '/en/shipping-returns' },
    },
  }
}

const SECTIONS_TR: LegalSection[] = [
  {
    heading: 'Teslimat Süresi ve Yöntemi',
    paragraphs: [
      'Siparişiniz, ödemenin onaylanmasının ardından 1–5 iş günü içinde anlaşmalı kargo firmasına teslim edilir. Teslimat süresi, siparişin hazırlanma (üretim/kontrol) süresini de kapsar; özel tasarım (Custom Registry) siparişlerinde bu süre, parça temini ve montaj gerekliliğine bağlı olarak uzayabilir — bu durumda sipariş onayı sonrasında ayrıca bilgilendirilirsiniz.',
      'Kargoya teslim edilen siparişler için tarafınıza bir takip numarası e-posta ile iletilir. Teslimat, siparişte belirttiğiniz adrese yapılır; adres bilgilerinin doğruluğundan alıcı sorumludur.',
    ],
  },
  {
    heading: 'Kargo Ücreti',
    paragraphs: [
      'The Ambience Bureau üzerinden verilen tüm siparişlerde kargo ücreti tarafımızca karşılanır; ürün fiyatına ayrıca bir teslimat bedeli eklenmez.',
    ],
  },
  {
    heading: 'Cayma Hakkı ve İade Süresi',
    paragraphs: [
      'Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca, ürünün size veya gösterdiğiniz adresteki kişiye teslim edildiği tarihten itibaren 15 (on beş) gün içinde, herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin sözleşmeden cayma hakkınız bulunmaktadır.',
      'Cayma hakkını kullanmak için bu süre içinde contact@ambiencebureau.com adresinden bizimle iletişime geçmeniz yeterlidir.',
    ],
  },
  {
    heading: 'Cayma Hakkının Kullanılamayacağı Ürünler',
    paragraphs: [
      'Mevzuat uyarınca, tüketicinin istekleri veya kişisel ihtiyaçları doğrultusunda hazırlanan ürünlerde cayma hakkı kullanılamaz. Bu kapsamda, Custom Registry üzerinden tarafınızca taban/gövde/başlık parçaları ve malzemeleri seçilerek kişiye özel olarak tasarlanan lambalar, bu istisna kapsamındadır ve cayma hakkına tabi değildir.',
      'Standart (önceden tasarlanmış, stoktan satılan) ürünler bu istisnaya girmez ve yukarıdaki 15 günlük cayma hakkı kapsamında iade edilebilir.',
    ],
  },
  {
    heading: 'İade Şartları',
    items: [
      {
        label: 'Ürün hasarsız olmalıdır:',
        text: 'Ürünün ve varsa tüm aksesuarlarının kullanılmamış, hasarsız ve yeniden satılabilir durumda olması gerekir.',
      },
      {
        label: 'Orijinal ambalaj:',
        text: 'Ürün, mümkünse orijinal kutusu/ambalajı içinde iade edilmelidir.',
      },
      {
        label: 'Fatura:',
        text: 'İade talebiyle birlikte sipariş numarası veya fatura bilgisi paylaşılmalıdır.',
      },
    ],
  },
  {
    heading: 'İade Süreci',
    paragraphs: [
      'İade talebinizi contact@ambiencebureau.com adresine sipariş numaranızla birlikte iletin. Talebiniz onaylandığında size iade kargo süreciyle ilgili yönlendirme yapılır. İade kargo bedeli, cayma hakkı kapsamındaki iadelerde tarafımızca karşılanır.',
    ],
  },
  {
    heading: 'Geri Ödeme',
    paragraphs: [
      'İade edilen ürün elimize ulaşıp kontrol edildikten sonra, ödemeniz 14 (on dört) gün içinde, ödemeyi yaptığınız yöntemle (kredi/banka kartına PayTR üzerinden) iade edilir. Kredi kartına yapılan iadelerin hesabınıza yansıma süresi bankanızın işlem sürelerine bağlı olarak değişebilir.',
    ],
  },
  {
    heading: 'Hasarlı veya Yanlış Ürün Teslimatı',
    paragraphs: [
      'Teslim aldığınız üründe nakliye kaynaklı bir hasar veya siparişinizden farklı bir ürün gönderimi tespit ederseniz, teslimat tarihinden itibaren 3 (üç) gün içinde contact@ambiencebureau.com adresinden bizimle iletişime geçin; bu durumlarda iade/değişim kargo bedeli tamamen tarafımızca karşılanır.',
    ],
  },
  {
    heading: 'İletişim',
    paragraphs: [
      'Teslimat ve iade süreçleriyle ilgili tüm sorularınız için contact@ambiencebureau.com adresinden bize ulaşabilirsiniz.',
    ],
  },
]

const SECTIONS_EN: LegalSection[] = [
  {
    heading: 'Delivery Time and Method',
    paragraphs: [
      'Your order is handed to our courier partner within 1–5 business days after payment is confirmed. This window includes order preparation (production/inspection); for Custom Registry orders, this period may be longer depending on part sourcing and assembly requirements — in which case you will be notified separately after order confirmation.',
      'A tracking number is emailed to you once your order ships. Delivery is made to the address you provided at checkout; the accuracy of the address information is the buyer\u2019s responsibility.',
    ],
  },
  {
    heading: 'Shipping Fee',
    paragraphs: [
      'All orders placed through The Ambience Bureau are shipped free of charge; no delivery fee is added on top of the product price.',
    ],
  },
  {
    heading: 'Right of Withdrawal and Return Period',
    paragraphs: [
      'In accordance with Turkish Consumer Protection Law and the Distance Contracts Regulation, you have the right to withdraw from the contract within 15 (fifteen) days of the delivery of the product to you or to the person at the address you specified, without giving any reason and without paying any penalty.',
      'To exercise your right of withdrawal, simply contact us at contact@ambiencebureau.com within this period.',
    ],
  },
  {
    heading: 'Products Excluded from the Right of Withdrawal',
    paragraphs: [
      'Under applicable law, the right of withdrawal does not apply to goods prepared according to the consumer\u2019s specifications or personal needs. Lamps designed by you through the Custom Registry — where base, body, and head parts and materials are individually selected — fall under this exception and are not eligible for withdrawal-based return.',
      'Standard (pre-designed, in-stock) products are not covered by this exception and may be returned under the 15-day right of withdrawal above.',
    ],
  },
  {
    heading: 'Return Conditions',
    items: [
      {
        label: 'Undamaged condition:',
        text: 'The product and any accessories must be unused, undamaged, and in resalable condition.',
      },
      {
        label: 'Original packaging:',
        text: 'The product should be returned in its original box/packaging whenever possible.',
      },
      {
        label: 'Proof of purchase:',
        text: 'Your order number or invoice information must be provided with the return request.',
      },
    ],
  },
  {
    heading: 'Return Process',
    paragraphs: [
      'Send your return request to contact@ambiencebureau.com along with your order number. Once approved, you will receive instructions for the return shipment. For returns under the right of withdrawal, return shipping costs are covered by us.',
    ],
  },
  {
    heading: 'Refunds',
    paragraphs: [
      'Once the returned product reaches us and is inspected, your payment will be refunded within 14 (fourteen) days, using the same method you paid with (credit/debit card, via PayTR). The time it takes for a refund to appear on your card statement depends on your bank\u2019s processing times.',
    ],
  },
  {
    heading: 'Damaged or Incorrect Deliveries',
    paragraphs: [
      'If you discover shipping-related damage or that you received a different product than ordered, contact us at contact@ambiencebureau.com within 3 (three) days of delivery; in these cases, return/exchange shipping costs are covered entirely by us.',
    ],
  },
  {
    heading: 'Contact',
    paragraphs: [
      'For any questions about delivery and returns, you can reach us at contact@ambiencebureau.com.',
    ],
  },
]

export default async function ShippingReturnsPage({ params }: PageProps) {
  const { locale } = await params
  const tr = locale === 'tr'

  return (
    <LegalDocument
      documentRef="DOCUMENT REF: TAB-2026-LGL-03 // CLASSIFICATION: SHIPPING"
      sectionLabel="SECTION 07"
      title={tr ? 'Teslimat ve İade Şartları' : 'Shipping & Returns'}
      lastUpdated={tr ? 'Son güncelleme: Ekim 2026' : 'Last updated: October 2026'}
      intro={
        tr
          ? 'Bu belge, The Ambience Bureau üzerinden verdiğiniz siparişlerin teslimat süreçlerini ve cayma hakkı/iade prosedürünü açıklar.'
          : 'This document explains the delivery process and the right-of-withdrawal / return procedure for orders placed through The Ambience Bureau.'
      }
      sections={tr ? SECTIONS_TR : SECTIONS_EN}
    />
  )
}
