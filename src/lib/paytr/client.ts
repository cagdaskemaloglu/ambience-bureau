import crypto from 'crypto'

/**
 * src/lib/paytr/client.ts
 *
 * PayTR iFrame API — iyzico/client.ts'in yerini alıyor (iyzico anlaşması
 * sona erdi, PayTR'ye geçiliyor). Kaynak: dev.paytr.com resmi dokümantasyonu
 * (iFrame API 1. ve 2. Adım sayfaları — PHP/Python/Node/C# örnek kodları
 * birbirini doğruluyor, hash algoritması buradan birebir alındı).
 *
 * MİMARİ FARK — iyzico'dan farklı olarak ÖNEMLİ: PayTR'nin ödeme onayı
 * PUSH modeli ile çalışır. iyzico'da biz tarayıcıdan gelen token'la
 * iyzico'ya "bu ödeme gerçekten başarılı mı?" diye SORUYORDUK
 * (retrieveCheckoutForm). PayTR'de ise PayTR'nin kendi sunucusu, ödeme
 * sonucunu DOĞRUDAN bizim bildirim URL'imize POST ediyor — biz
 * sorgulamıyoruz, bildirim alıyoruz ve hash'ini doğruluyoruz. Bu yüzden
 * iki ayrı uç nokta gerekiyor:
 *   1) Tarayıcının göreceği başarılı/başarısız yönlendirme sayfaları
 *      (merchant_ok_url / merchant_fail_url) — SADECE görsel, sipariş
 *      durumunu BURADA değiştirmiyoruz (PayTR'nin bildirimi güvenilir
 *      tek kaynak).
 *   2) PayTR'nin sunucudan sunucuya POST attığı bildirim URL'i
 *      (merchant_notify_url) — asıl sipariş onaylama işlemi BURADA olur.
 */

const MERCHANT_ID = (process.env.PAYTR_MERCHANT_ID ?? '').trim()
const MERCHANT_KEY = (process.env.PAYTR_MERCHANT_KEY ?? '').trim()
const MERCHANT_SALT = (process.env.PAYTR_MERCHANT_SALT ?? '').trim()
// PayTR'de iyzico'daki gibi ayrı bir sandbox URL yok — aynı merchant_id ile
// test_mode=1 gönderilir, PayTR gerçek para çekmeden tüm akışı test eder.
const TEST_MODE = process.env.PAYTR_TEST_MODE === '1' ? '1' : '0'

const TOKEN_URL = 'https://www.paytr.com/odeme/api/get-token'

/**
 * PayTR `merchant_oid` için SADECE harf/rakam kabul ediyor (tire, alt çizgi
 * vb. özel karakter yok). Bizim sipariş numaramız "TAB-2026-AB12C"
 * formatında (bkz. supabase/schema.sql → generate_order_number) — PayTR'ye
 * gönderirken tireleri atıyoruz ("TAB2026AB12C"), bildirim geldiğinde
 * (paytr-notify) geri çeviriyoruz.
 */
export function toPaytrOid(orderNumber: string): string {
  return orderNumber.replace(/[^a-zA-Z0-9]/g, '')
}

/**
 * "TAB2026AB12C" → "TAB-2026-AB12C". Format tanınmazsa girdiyi olduğu gibi
 * döndürür (çağıran taraf ayrıca ham değeri de deneyebilir).
 */
export function fromPaytrOid(merchantOid: string): string {
  const match = /^([A-Za-z]+)(\d{4})([A-Za-z0-9]+)$/.exec(merchantOid)
  return match ? `${match[1]}-${match[2]}-${match[3]}` : merchantOid
}

export interface PayTRBasketItem {
  name: string
  /** Birim fiyat, "34.56" gibi ondalıklı STRING (kuruş değil — sadece payment_amount kuruş cinsinden). */
  price: string
  quantity: number
}

export interface CreatePaymentTokenParams {
  /** Bizim sipariş numaramız — sadece harf/rakam, PayTR başka karakter kabul etmiyor. */
  merchantOid: string
  userIp: string
  email: string
  /** TOPLAM tutar, KURUŞ cinsinden tam sayı (34.56 TL → 3456). */
  paymentAmountMinor: number
  basket: PayTRBasketItem[]
  userName: string
  userAddress: string
  userPhone: string
  merchantOkUrl: string
  merchantFailUrl: string
  currency?: 'TL' | 'USD' | 'EUR' | 'GBP'
  /** 0 = taksit teklifleri açık (varsayılan), 1 = taksit kapalı. */
  noInstallment?: 0 | 1
  /** 0 = bankaya bırak (varsayılan), 1-12 = üst sınır. */
  maxInstallment?: number
  lang?: 'tr' | 'en'
  /** Dakika cinsinden, iframe'in geçerlilik süresi — varsayılan 30. */
  timeoutLimit?: number
}

export type CreatePaymentTokenResult =
  | { status: 'success'; token: string }
  | { status: 'failed'; reason: string }

/**
 * user_basket alanı: PayTR'nin beklediği format base64( JSON( [[isim, "fiyat", adet], ...] ) ).
 */
function encodeBasket(items: PayTRBasketItem[]): string {
  const rows = items.map((item) => [item.name, item.price, item.quantity])
  return Buffer.from(JSON.stringify(rows)).toString('base64')
}

/**
 * 1. Adım hash'i — dev.paytr.com'daki PHP örneğiyle birebir aynı sıra:
 *   hash_str = merchant_id + user_ip + merchant_oid + email + payment_amount
 *            + user_basket + no_installment + max_installment + currency + test_mode
 *   paytr_token = base64( HMAC-SHA256( hash_str + merchant_salt, merchant_key ) )
 */
function buildTokenHash(params: {
  userIp: string
  merchantOid: string
  email: string
  paymentAmountMinor: number
  userBasketBase64: string
  noInstallment: number
  maxInstallment: number
  currency: string
}): string {
  const hashStr =
    MERCHANT_ID +
    params.userIp +
    params.merchantOid +
    params.email +
    String(params.paymentAmountMinor) +
    params.userBasketBase64 +
    String(params.noInstallment) +
    String(params.maxInstallment) +
    params.currency +
    TEST_MODE

  return crypto
    .createHmac('sha256', MERCHANT_KEY)
    .update(hashStr + MERCHANT_SALT)
    .digest('base64')
}

export async function createPaymentToken(
  params: CreatePaymentTokenParams
): Promise<CreatePaymentTokenResult> {
  if (!MERCHANT_ID || !MERCHANT_KEY || !MERCHANT_SALT) {
    throw new Error(
      'PAYTR_MERCHANT_ID / PAYTR_MERCHANT_KEY / PAYTR_MERCHANT_SALT ortam değişkenleri eksik.'
    )
  }

  const currency = params.currency ?? 'TL'
  const noInstallment = params.noInstallment ?? 0
  const maxInstallment = params.maxInstallment ?? 0
  const userBasketBase64 = encodeBasket(params.basket)

  const paytrToken = buildTokenHash({
    userIp: params.userIp,
    merchantOid: params.merchantOid,
    email: params.email,
    paymentAmountMinor: params.paymentAmountMinor,
    userBasketBase64,
    noInstallment,
    maxInstallment,
    currency,
  })

  const body = new URLSearchParams({
    merchant_id: MERCHANT_ID,
    user_ip: params.userIp,
    merchant_oid: params.merchantOid,
    email: params.email,
    payment_amount: String(params.paymentAmountMinor),
    paytr_token: paytrToken,
    user_basket: userBasketBase64,
    debug_on: process.env.NODE_ENV === 'production' ? '0' : '1',
    no_installment: String(noInstallment),
    max_installment: String(maxInstallment),
    user_name: params.userName,
    user_address: params.userAddress,
    user_phone: params.userPhone,
    merchant_ok_url: params.merchantOkUrl,
    merchant_fail_url: params.merchantFailUrl,
    timeout_limit: String(params.timeoutLimit ?? 30),
    currency,
    test_mode: TEST_MODE,
    lang: params.lang ?? 'tr',
  })

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  const result = (await response.json()) as { status: string; token?: string; reason?: string }

  if (result.status === 'success' && result.token) {
    return { status: 'success', token: result.token }
  }
  return { status: 'failed', reason: result.reason ?? 'Bilinmeyen hata' }
}

export interface PayTRNotification {
  merchant_oid: string
  status: 'success' | 'failed'
  total_amount: string
  hash: string
  failed_reason_code?: string
  failed_reason_msg?: string
  test_mode?: string
  payment_type?: string
  currency?: string
  payment_amount?: string
}

/**
 * 2. Adım hash doğrulaması — dev.paytr.com'daki örneklerle (PHP/Python/
 * Node/C#) birebir aynı, dört farklı dilde TUTARLI şekilde doğrulanmış:
 *   hash_str = merchant_oid + merchant_salt + status + total_amount
 *   hash = base64( HMAC-SHA256( hash_str, merchant_key ) )
 * PayTR'den gelen `hash` alanıyla BİREBİR eşleşmeli — eşleşmezse bildirim
 * sahte sayılır ve REDDEDİLMELİDİR (sipariş durumu değiştirilmemeli).
 */
export function verifyNotificationHash(notification: PayTRNotification): boolean {
  if (!MERCHANT_KEY || !MERCHANT_SALT) {
    throw new Error('PAYTR_MERCHANT_KEY / PAYTR_MERCHANT_SALT ortam değişkenleri eksik.')
  }

  const hashStr =
    notification.merchant_oid + MERCHANT_SALT + notification.status + notification.total_amount

  const expectedHash = crypto.createHmac('sha256', MERCHANT_KEY).update(hashStr).digest('base64')

  return expectedHash === notification.hash
}
