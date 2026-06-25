// @ts-expect-error - iyzipay paketi resmi TypeScript tip tanımı içermiyor
import Iyzipay from 'iyzipay'

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

export function createCheckoutForm(
  request: CheckoutFormInitializeRequest
): Promise<CheckoutFormInitializeResult> {
  return new Promise((resolve, reject) => {
    iyzico.checkoutFormInitialize.create(
      request,
      (err: Error | null, result: CheckoutFormInitializeResult) => {
        if (err) reject(err)
        else resolve(result)
      }
    )
  })
}

export function retrieveCheckoutForm(params: {
  locale: 'tr' | 'en'
  conversationId: string
  token: string
}): Promise<CheckoutFormRetrieveResult> {
  return new Promise((resolve, reject) => {
    iyzico.checkoutForm.retrieve(
      params,
      (err: Error | null, result: CheckoutFormRetrieveResult) => {
        if (err) reject(err)
        else resolve(result)
      }
    )
  })
}
