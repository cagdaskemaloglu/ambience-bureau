// Resmi iyzipay paketi kullanılıyor — alan sırası ve imza formatı iyzico'nun
// beklediğiyle birebir eşleşiyor. iyzipay-ts alan sırasını korumadığından
// IYZWSv2 imzası tutarsız oluyor ve errorCode:1000 dönüyordu.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Iyzipay = require('iyzipay')

const iyzico = new Iyzipay({
  apiKey: (process.env.IYZICO_API_KEY ?? '').trim(),
  secretKey: (process.env.IYZICO_SECRET_KEY ?? '').trim(),
  uri: (process.env.IYZICO_BASE_URL ?? 'https://sandbox-api.iyzipay.com').trim(),
})

// ── Tip Tanımları ─────────────────────────────────────────

export interface IyzicoBasketItem {
  id: string
  name: string
  category1: string
  category2?: string
  itemType: 'PHYSICAL' | 'VIRTUAL'
  price: string
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
  identityNumber: string
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
  price: string
  paidPrice: string
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

// ── API Metotları ─────────────────────────────────────────

export function createCheckoutForm(
  request: CheckoutFormInitializeRequest
): Promise<CheckoutFormInitializeResult> {
  return new Promise((resolve, reject) => {
    iyzico.checkoutFormInitialize.create(request, (err: Error, result: CheckoutFormInitializeResult) => {
      if (err) return reject(err)
      resolve(result)
    })
  })
}

export function retrieveCheckoutForm(params: {
  locale: 'tr' | 'en'
  conversationId?: string
  token: string
}): Promise<CheckoutFormRetrieveResult> {
  return new Promise((resolve, reject) => {
    iyzico.checkoutForm.retrieve(params, (err: Error, result: CheckoutFormRetrieveResult) => {
      if (err) return reject(err)
      resolve(result)
    })
  })
}