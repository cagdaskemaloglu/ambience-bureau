import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'react-email'

interface OrderStatusUpdateEmailProps {
  locale: 'tr' | 'en'
  orderNumber: string
  customerName: string
  status: 'processing' | 'shipped'
  trackingNumber?: string | null
}

const COPY = {
  tr: {
    docRef: 'BELGE REF: TAB-2026-ORD',
    processing: {
      preview: (orderNumber: string) => `Siparişiniz Hazırlanıyor — ${orderNumber}`,
      statusLabel: 'İŞLENİYOR',
      heading: 'Siparişiniz Hazırlanıyor',
      intro:
        'Siparişiniz Büro Laboratuvarları tarafından işleme alınmıştır. Ürün kimlik belgeleriniz (Sertifika, Ürün Kartı, Garanti Belgesi) hazırlanıyor ve kargo için paketleme süreci başlamıştır.',
    },
    shipped: {
      preview: (orderNumber: string) => `Siparişiniz Kargoya Verildi — ${orderNumber}`,
      statusLabel: 'KARGODA',
      heading: 'Siparişiniz Kargoya Verildi',
      intro: 'Siparişiniz kargoya teslim edilmiştir. Aşağıdaki takip numarasıyla gönderinizi takip edebilirsiniz.',
    },
    orderNumberLabel: 'Sipariş Numarası',
    trackingLabel: 'Kargo Takip Numarası',
    greeting: (name: string) => `Sayın ${name},`,
    footer:
      'Bu, The Ambience Bureau tarafından otomatik olarak oluşturulmuş bir belgedir. Sorularınız için lütfen bizimle iletişime geçin.',
    footerBrand: '© 2026 The Ambience Bureau. Tüm hakları saklıdır.',
  },
  en: {
    docRef: 'DOCUMENT REF: TAB-2026-ORD',
    processing: {
      preview: (orderNumber: string) => `Your Order Is Being Prepared — ${orderNumber}`,
      statusLabel: 'PROCESSING',
      heading: 'Your Order Is Being Prepared',
      intro:
        'Your order has been picked up by Bureau Laboratories. Your product identity documents (Certificate, Product Card, Warranty) are being prepared and packaging for shipment has begun.',
    },
    shipped: {
      preview: (orderNumber: string) => `Your Order Has Shipped — ${orderNumber}`,
      statusLabel: 'SHIPPED',
      heading: 'Your Order Has Shipped',
      intro: 'Your order has been handed to the carrier. You can track your shipment with the tracking number below.',
    },
    orderNumberLabel: 'Order Number',
    trackingLabel: 'Tracking Number',
    greeting: (name: string) => `Dear ${name},`,
    footer:
      'This is an automatically generated document from The Ambience Bureau. For questions, please contact us.',
    footerBrand: '© 2026 The Ambience Bureau. All rights reserved.',
  },
}

export default function OrderStatusUpdateEmail({
  locale,
  orderNumber,
  customerName,
  status,
  trackingNumber,
}: OrderStatusUpdateEmailProps) {
  const t = COPY[locale]
  const s = t[status]

  return (
    <Html lang={locale}>
      <Head />
      <Preview>{s.preview(orderNumber)}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Text style={styles.docRef}>{t.docRef}</Text>

          <Heading style={styles.brand}>THE AMBIENCE BUREAU</Heading>
          <Text style={styles.tagline}>REGULATION OF SPATIAL PHOTONS // EST. 2026</Text>

          <Hr style={styles.hr} />

          <Text style={styles.statusLabel}>● {s.statusLabel}</Text>
          <Text style={styles.heading}>{s.heading}</Text>
          <Text style={styles.greeting}>{t.greeting(customerName)}</Text>
          <Text style={styles.intro}>{s.intro}</Text>

          <Section style={styles.orderNumberBox}>
            <Text style={styles.orderNumberLabel}>{t.orderNumberLabel}</Text>
            <Text style={styles.orderNumberValue}>{orderNumber}</Text>
          </Section>

          {status === 'shipped' && trackingNumber && (
            <Section style={styles.orderNumberBox}>
              <Text style={styles.orderNumberLabel}>{t.trackingLabel}</Text>
              <Text style={styles.orderNumberValue}>{trackingNumber}</Text>
            </Section>
          )}

          <Hr style={styles.hr} />

          <Text style={styles.footer}>{t.footer}</Text>
          <Text style={styles.footerBrand}>{t.footerBrand}</Text>
        </Container>
      </Body>
    </Html>
  )
}

// E-posta istemcileri Tailwind/external CSS desteklemez — tüm stiller inline.
// OrderConfirmationEmail.tsx ile aynı stil paleti kullanılıyor.
const styles = {
  body: {
    backgroundColor: '#FAFAFA',
    fontFamily: 'Helvetica, Arial, sans-serif',
    margin: 0,
    padding: '32px 16px',
  },
  container: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #000000',
    maxWidth: '560px',
    margin: '0 auto',
    padding: '32px',
  },
  docRef: {
    fontFamily: 'Courier, monospace',
    fontSize: '10px',
    color: '#666666',
    letterSpacing: '0.05em',
    margin: '0 0 24px 0',
  },
  brand: {
    fontSize: '18px',
    fontWeight: 700 as const,
    letterSpacing: '0.08em',
    margin: '0 0 4px 0',
  },
  tagline: {
    fontFamily: 'Courier, monospace',
    fontSize: '9px',
    color: '#666666',
    letterSpacing: '0.1em',
    margin: '0 0 16px 0',
  },
  hr: { borderColor: '#000000', margin: '16px 0' },
  statusLabel: {
    fontFamily: 'Courier, monospace',
    fontSize: '11px',
    color: '#E6792E',
    letterSpacing: '0.05em',
    margin: '0 0 8px 0',
  },
  heading: { fontSize: '17px', fontWeight: 700 as const, margin: '0 0 16px 0' },
  greeting: { fontSize: '14px', margin: '0 0 8px 0' },
  intro: { fontSize: '13px', color: '#333333', lineHeight: '1.6', margin: '0 0 20px 0' },
  orderNumberBox: {
    border: '1px solid #000000',
    backgroundColor: '#FAFAFA',
    padding: '12px 16px',
    margin: '0 0 16px 0',
  },
  orderNumberLabel: {
    fontFamily: 'Courier, monospace',
    fontSize: '9px',
    color: '#666666',
    letterSpacing: '0.1em',
    margin: '0 0 4px 0',
  },
  orderNumberValue: {
    fontFamily: 'Courier, monospace',
    fontSize: '14px',
    fontWeight: 700 as const,
    margin: 0,
  },
  footer: { fontSize: '11px', color: '#999999', lineHeight: '1.5', margin: '16px 0 4px 0' },
  footerBrand: { fontSize: '11px', color: '#999999', margin: 0 },
}
