import { NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server'

/**
 * Müşteri "Teslim Aldım" butonuna bastığında çağrılır. Sadece kendi
 * siparişini ve sadece 'shipped' durumundaki bir siparişi 'delivered'
 * yapabilir — orderId client'tan gelse de, sahiplik ve mevcut durum
 * kontrolü sunucu tarafında yapılır.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = await request.json()
    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
    }

    const admin = createSupabaseAdminClient() as any

    const { data: order, error: fetchError } = await admin
      .from('orders')
      .select('id, user_id, status')
      .eq('id', orderId)
      .single()

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (order.status !== 'shipped') {
      return NextResponse.json(
        { error: 'Order must be in shipped status to confirm delivery' },
        { status: 400 }
      )
    }

    const { error: updateError } = await admin
      .from('orders')
      .update({ status: 'delivered', updated_at: new Date().toISOString() })
      .eq('id', orderId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[confirm-delivery] Beklenmeyen hata:', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}