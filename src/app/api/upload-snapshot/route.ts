import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { dataUrl, designRef } = await request.json()

    if (!dataUrl || !designRef) {
      return NextResponse.json({ error: 'dataUrl ve designRef zorunludur.' }, { status: 400 })
    }

    // base64 data URL'i buffer'a çevir
    const base64 = dataUrl.replace(/^data:image\/png;base64,/, '')
    const buffer = Buffer.from(base64, 'base64')

    const admin = createSupabaseAdminClient()
    const fileName = `designs/${designRef}-${Date.now()}.png`

    const { error } = await (admin as any).storage
      .from('snapshots')
      .upload(fileName, buffer, {
        contentType: 'image/png',
        upsert: true,
      })

    if (error) throw error

    const { data: { publicUrl } } = (admin as any).storage
      .from('snapshots')
      .getPublicUrl(fileName)

    return NextResponse.json({ url: publicUrl }, { status: 200 })
  } catch (err) {
    console.error('[upload-snapshot]', err)
    return NextResponse.json({ error: 'Snapshot yüklenemedi.' }, { status: 500 })
  }
}