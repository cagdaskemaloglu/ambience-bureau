import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/server'
import { generateOrderDocuments } from '@/lib/documents/generateOrderDocuments'

// Puppeteer cold start + 3 PDF üretimi 10sn'lik varsayılan Vercel süresini
// aşabiliyor. Hobby planında üst sınır 60sn, Pro'da daha yüksek olabilir.
export const maxDuration = 60

function checkAuth(request: Request) {
  const secret = process.env.ADMIN_API_SECRET
  const auth = request.headers.get('x-admin-secret')
  return secret && auth === secret
}

// GET: tüm siparişleri listele
export async function GET(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = 20
  const offset = (page - 1) * limit

  const admin = createSupabaseAdminClient() as any

  let query = admin
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        custom_designs ( snapshot_url, design_data )
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ orders: data, total: count, page, limit })
}

// PATCH: sipariş durumunu güncelle
export async function PATCH(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { orderId, status, trackingNumber, adminNote } = await request.json()

  if (!orderId || !status) {
    return NextResponse.json({ error: 'orderId ve status zorunludur.' }, { status: 400 })
  }

  const admin = createSupabaseAdminClient() as any

  // Belge üretimini tetikleyip tetiklemeyeceğimize karar vermek için
  // güncelleme ÖNCESİ durumu al (aynı siparişi ikinci kez 'processing'e
  // alınca belgeleri tekrar tekrar üretmemek için).
  const { data: existing } = await admin
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .single()

  const { data, error } = await admin
    .from('orders')
    .update({
      status,
      ...(trackingNumber && { tracking_number: trackingNumber }),
      ...(adminNote && { admin_note: adminNote }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .select('*, order_items(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Sertifika / Ürün Kartı / Garanti Belgesi PDF'lerini burada üret —
  // sadece 'processing'e İLK geçişte (daha önce zaten processing/shipped/
  // delivered idiyse tekrar üretme). Başarısız olsa da durum güncellemesini
  // geri almaz, sadece loglanır — admin panelinden tekrar denenebilir.
  const alreadyProcessed = ['processing', 'shipped', 'delivered'].includes(existing?.status)
  if (status === 'processing' && !alreadyProcessed) {
    try {
      await generateOrderDocuments(data, data.locale ?? 'tr')
    } catch (docError) {
      console.error('[admin/orders PATCH] Belge üretim hatası:', docError)
    }
  }

  return NextResponse.json({ order: data })
}