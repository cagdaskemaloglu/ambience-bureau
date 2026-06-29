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
  Row,
  Column,
} from 'react-email'

interface OrderConfirmationEmailProps {
  locale: 'tr' | 'en'
  orderNumber: string
  customerName: string
  items: Array<{
    name: string
    quantity: number
    unitPrice: string // önceden formatlanmış, örn. "₺7.490"
    lineTotal: string
  }>
  subtotal: string // KDV dahil ara toplam (= total, kargo öncesi)
  total: string
  shippingAddress: {
    name: string
    address1: string
    address2?: string
    city: string
    postal: string
    country: string
  }
}

const COPY = {
  tr: {
    preview: (orderNumber: string) => `Kayıt Onayı — ${orderNumber}`,
    docRef: 'BELGE REF: TAB-2026-ORD',
    heading: 'Kayıt Onaylandı',
    greeting: (name: string) => `Sayın ${name},`,
    intro:
      'Siparişiniz The Ambience Bureau kayıt sistemine başarıyla işlenmiştir. Aşağıda kayıt detaylarınızı bulabilirsiniz.',
    orderNumberLabel: 'Sipariş Numarası',
    itemsHeading: 'Kayıtlı Nesneler',
    qty: 'Adet',
    subtotal: 'Ara Toplam',
    vatIncluded: 'KDV, fiyata dahildir.',
    total: 'Toplam',
    shippingHeading: 'Teslimat Adresi',
    footer:
      'Bu, The Ambience Bureau tarafından otomatik olarak oluşturulmuş bir belgedir. Sorularınız için lütfen bizimle iletişime geçin.',
    footerBrand: '© 2026 The Ambience Bureau. Tüm hakları saklıdır.',
  },
  en: {
    preview: (orderNumber: string) => `Registration Confirmed — ${orderNumber}`,
    docRef: 'DOCUMENT REF: TAB-2026-ORD',
    heading: 'Registration Confirmed',
    greeting: (name: string) => `Dear ${name},`,
    intro:
      'Your order has been successfully processed into The Ambience Bureau registry system. Please find your registration details below.',
    orderNumberLabel: 'Order Number',
    itemsHeading: 'Registered Objects',
    qty: 'Qty',
    subtotal: 'Subtotal',
    vatIncluded: 'VAT included in price.',
    total: 'Total',
    shippingHeading: 'Shipping Address',
    footer:
      'This is an automatically generated document from The Ambience Bureau. For questions, please contact us.',
    footerBrand: '© 2026 The Ambience Bureau. All rights reserved.',
  },
}

export default function OrderConfirmationEmail({
  locale,
  orderNumber,
  customerName,
  items,
  subtotal,
  total,
  shippingAddress,
}: OrderConfirmationEmailProps) {
  const t = COPY[locale]

  return (
    <Html lang={locale}>
      <Head />
      <Preview>{t.preview(orderNumber)}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Doc strip */}
          <Text style={styles.docRef}>{t.docRef}</Text>

          {/* Brand */}
          <Heading style={styles.brand}>THE AMBIENCE BUREAU</Heading>
          <Text style={styles.tagline}>REGULATION OF SPATIAL PHOTONS // EST. 2026</Text>

          <Hr style={styles.hr} />

          {/* Heading */}
          <Text style={styles.statusLabel}>● {t.heading}</Text>
          <Text style={styles.greeting}>{t.greeting(customerName)}</Text>
          <Text style={styles.intro}>{t.intro}</Text>

          {/* Order number */}
          <Section style={styles.orderNumberBox}>
            <Text style={styles.orderNumberLabel}>{t.orderNumberLabel}</Text>
            <Text style={styles.orderNumberValue}>{orderNumber}</Text>
          </Section>

          {/* Items */}
          <Text style={styles.sectionHeading}>{t.itemsHeading}</Text>
          {items.map((item, idx) => (
            <Row key={idx} style={styles.itemRow}>
              <Column>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQty}>
                  {t.qty}: {item.quantity} × {item.unitPrice}
                </Text>
              </Column>
              <Column align="right">
                <Text style={styles.itemTotal}>{item.lineTotal}</Text>
              </Column>
            </Row>
          ))}

          <Hr style={styles.hrDashed} />

          {/* Totals */}
          <Row style={styles.totalRow}>
            <Column>
              <Text style={styles.totalLabel}>{t.subtotal}</Text>
            </Column>
            <Column align="right">
              <Text style={styles.totalValue}>{subtotal}</Text>
            </Column>
          </Row>
          <Text style={styles.vatNote}>{t.vatIncluded}</Text>
          <Hr style={styles.hr} />
          <Row style={styles.totalRow}>
            <Column>
              <Text style={styles.grandTotalLabel}>{t.total}</Text>
            </Column>
            <Column align="right">
              <Text style={styles.grandTotalValue}>{total}</Text>
            </Column>
          </Row>

          <Hr style={styles.hr} />

          {/* Shipping */}
          <Text style={styles.sectionHeading}>{t.shippingHeading}</Text>
          <Text style={styles.address}>
            {shippingAddress.name}
            <br />
            {shippingAddress.address1}
            {shippingAddress.address2 && (
              <>
                <br />
                {shippingAddress.address2}
              </>
            )}
            <br />
            {shippingAddress.city}, {shippingAddress.postal}
            <br />
            {shippingAddress.country}
          </Text>

          <Hr style={styles.hr} />

          {/* Footer */}
          <Text style={styles.footer}>{t.footer}</Text>
          <Text style={styles.footerBrand}>{t.footerBrand}</Text>
        </Container>
      </Body>
    </Html>
  )
}

// E-posta istemcileri Tailwind/external CSS desteklemez — tüm stiller inline.
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
  hrDashed: { borderColor: '#E0E0E0', borderStyle: 'dashed' as const, margin: '12px 0' },
  statusLabel: {
    fontFamily: 'Courier, monospace',
    fontSize: '11px',
    color: '#E6792E',
    letterSpacing: '0.05em',
    margin: '0 0 16px 0',
  },
  greeting: { fontSize: '14px', margin: '0 0 8px 0' },
  intro: { fontSize: '13px', color: '#333333', lineHeight: '1.6', margin: '0 0 20px 0' },
  orderNumberBox: {
    border: '1px solid #000000',
    backgroundColor: '#FAFAFA',
    padding: '12px 16px',
    margin: '0 0 24px 0',
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
  sectionHeading: {
    fontFamily: 'Courier, monospace',
    fontSize: '10px',
    letterSpacing: '0.08em',
    color: '#666666',
    margin: '0 0 12px 0',
  },
  itemRow: { margin: '0 0 10px 0' },
  itemName: { fontSize: '13px', fontWeight: 600 as const, margin: 0 },
  itemQty: { fontSize: '11px', color: '#666666', margin: '2px 0 0 0' },
  itemTotal: { fontFamily: 'Courier, monospace', fontSize: '13px', margin: 0 },
  totalRow: { margin: '0 0 6px 0' },
  totalLabel: { fontSize: '12px', color: '#666666', margin: 0 },
  totalValue: { fontFamily: 'Courier, monospace', fontSize: '12px', margin: 0 },
  vatNote: { fontSize: '10.5px', color: '#999999', margin: '0 0 10px 0' },
  grandTotalLabel: { fontSize: '13px', fontWeight: 700 as const, margin: 0 },
  grandTotalValue: {
    fontFamily: 'Courier, monospace',
    fontSize: '16px',
    fontWeight: 700 as const,
    margin: 0,
  },
  address: { fontSize: '13px', color: '#333333', lineHeight: '1.6', margin: '0 0 0 0' },
  footer: { fontSize: '11px', color: '#999999', lineHeight: '1.5', margin: '0 0 4px 0' },
  footerBrand: { fontSize: '11px', color: '#999999', margin: 0 },
}
