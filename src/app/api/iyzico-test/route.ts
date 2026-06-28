import { NextResponse } from 'next/server'
import Iyzipay from 'iyzipay-ts'

export async function GET() {
  const apiKey = (process.env.IYZICO_API_KEY ?? '').trim()
  const secretKey = (process.env.IYZICO_SECRET_KEY ?? '').trim()
  const uri = (process.env.IYZICO_BASE_URL ?? 'https://sandbox-api.iyzipay.com').trim()

  const keyInfo = {
    apiKeyLength: apiKey.length,
    apiKeyPrefix: apiKey.substring(0, 12),
    secretKeyLength: secretKey.length,
    secretKeyPrefix: secretKey.substring(0, 12),
    uri,
    apiKeyStartsWithSandbox: apiKey.startsWith('sandbox'),
    secretKeyStartsWithSandbox: secretKey.startsWith('sandbox'),
  }

  try {
    const iyzico = new Iyzipay({ apiKey, secretKey, uri })
    const result = await (iyzico as any).apiTest.retrieve({}) as any
    return NextResponse.json({ keyInfo, iyzicoResult: result })
  } catch (err) {
    return NextResponse.json({ keyInfo, error: String(err) })
  }
}