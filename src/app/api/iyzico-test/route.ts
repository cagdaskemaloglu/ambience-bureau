// Bu endpoint production'da devre dışı bırakıldı
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}