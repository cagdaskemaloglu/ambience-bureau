import crypto from 'crypto'

const API_KEY = (process.env.IYZICO_API_KEY ?? '').trim()
const SECRET_KEY = (process.env.IYZICO_SECRET_KEY ?? '').trim()
const BASE_URL = (process.env.IYZICO_BASE_URL ?? 'https://sandbox-api.iyzipay.com').trim()

// ── İmza Hesaplama ────────────────────────────────────────
// iyzico imza: base64(sha256(secretKey + randomKey + requestBody))
function generateAuthorizationHeader(requestBody: string): string {
  const randomKey = Math.random().toString(36).substring(2)
  const hash = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(`${SECRET_KEY}${randomKey}${requestBody}`)
    .digest('base64')

  const authorizationString = `apiKey:${API_KEY}&randomKey:${randomKey}&signature:${hash}`
  return `IYZWSv2 ${Buffer.from(authorizationString).toString('base64')}`
}

async function iyzicoPost<T>(path: string, body: object): Promise<T> {
  const requestBody = JSON.stringify(body)
  const authorization = generateAuthorizationHeader(requestBody)

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authorization,
      'x-iyzi-rnd': authorization.split('randomKey:')[1]?.split('&')[0] ?? '',
    },
    body: requestBody,
  })

  return res.json() as Promise<T>
}

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
  return iyzicoPost<CheckoutFormInitializeResult>(
    '/payment/iyzipos/checkoutform/initialize/auth/ecom',
    request
  )
}

export function retrieveCheckoutForm(params: {
  locale: 'tr' | 'en'
  conversationId?: string
  token: string
}): Promise<CheckoutFormRetrieveResult> {
  return iyzicoPost<CheckoutFormRetrieveResult>(
    '/payment/iyzipos/checkoutform/auth/ecom/detail',
    params
  )
}