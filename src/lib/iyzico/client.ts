// Eski satırları silin ve yerine bunu yapıştırın:
import Iyzipay from 'iyzipay-ts'

// ... dosyanın geri kalan client kodları aynen kalabilir ...
// ── Client ────────────────────────────────────────────────

export const iyzico = new Iyzipay({
  apiKey: process.env.IYZICO_API_KEY!,
  secretKey: process.env.IYZICO_SECRET_KEY!,
  uri: process.env.IYZICO_BASE_URL ?? 'https://sandbox-api.iyzipay.com',
})

// ── Tip Tanımları ─────────────────────────────────────────
// iyzipay paketi resmi tip içermediği için burada elle tanımlıyoruz.

export interface IyzicoBasketItem {
  id: string
  name: string
  category1: string
  category2?: string
  itemType: 'PHYSICAL' | 'VIRTUAL'
  price: string // ondalık string, örn: "199.90"
}

export interface IyzicoAddress {
  contactName: string
  city: string
  country: string
  address: string
  zipCode: string
}

export interface IyzicoBuyer {
  id: string
  name: string
  surname: string
  gsmNumber: string
  email: string
  identityNumber: string // TC kimlik no zorunlu — yabancı müşteriler için "11111111111" gibi placeholder kullanılabilir
  lastLoginDate: string
  registrationDate: string
  registrationAddress: string
  ip: string
  city: string
  country: string
  zipCode: string
}

export interface CheckoutFormInitializeRequest {
  locale: 'tr' | 'en'
  conversationId: string
  price: string // ondalık string
  paidPrice: string // ondalık string (price ile aynı, kampanya yoksa)
  currency: 'TRY' | 'USD' | 'EUR'
  basketId: string
  paymentGroup: 'PRODUCT'
  callbackUrl: string
  enabledInstallments?: number[]
  buyer: IyzicoBuyer
  shippingAddress: IyzicoAddress
  billingAddress: IyzicoAddress
  basketItems: IyzicoBasketItem[]
}

export interface CheckoutFormInitializeResult {
  status: 'success' | 'failure'
  locale: string
  systemTime: number
  conversationId: string
  token?: string
  checkoutFormContent?: string
  paymentPageUrl?: string
  errorMessage?: string
  errorCode?: string
}

export interface CheckoutFormRetrieveResult {
  status: 'success' | 'failure'
  paymentStatus?: 'SUCCESS' | 'FAILURE' | 'INIT_THREEDS' | 'CALLBACK_THREEDS' | string
  paymentId?: string
  conversationId?: string
  basketId?: string
  price?: number
  paidPrice?: number
  currency?: string
  errorMessage?: string
  errorCode?: string
  fraudStatus?: number
}

// ── Promise Wrapper'lar ───────────────────────────────────
// iyzipay SDK'sı callback tabanlı (Node.js'in eski stili).
// Next.js API route'larında async/await kullanabilmek için sarmalıyoruz.

// ── Promise Wrapper'lar ───────────────────────────────────
// iyzipay-ts zaten Promise tabanlı çalıştığı için doğrudan return edebiliriz.
// ── Promise Wrapper'lar ───────────────────────────────────
// iyzipay-ts zaten Promise tabanlı çalıştığı için doğrudan return edebiliriz.

export function createCheckoutForm(
  request: CheckoutFormInitializeRequest
): Promise<CheckoutFormInitializeResult> {
  // Dönen Promise<unknown> değerini 'as Promise<CheckoutFormInitializeResult>' ile zorluyoruz
  return iyzico.checkoutFormInitialize.create(request as any) as Promise<CheckoutFormInitializeResult>;
}

export function retrieveCheckoutForm(params: {
  locale: 'tr' | 'en';
  conversationId: string;
  token: string;
}): Promise<CheckoutFormRetrieveResult> {
  // Dönen Promise<unknown> değerini 'as Promise<CheckoutFormRetrieveResult>' ile zorluyoruz
  return iyzico.checkoutForm.retrieve(params as any) as Promise<CheckoutFormRetrieveResult>;
}