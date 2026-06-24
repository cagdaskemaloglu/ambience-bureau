import { createSupabaseAdminClient } from './server'
import type { CustomDesignData } from '@/types/supabase'

// ============================================================
// Bu dosya SADECE server-side (API routes, Server Actions) kullanılır.
// Service role client kullanır — RLS bypass eder, dikkatli kullanılmalı.
// ============================================================

// ── Custom Design (Tasarım Kaydı) ─────────────────────────

export async function saveCustomDesign(params: {
  userId?: string | null
  guestSessionId?: string | null
  collectionKey: string
  designData: CustomDesignData
  totalPrice: number // kuruş cinsinden
  snapshotUrl?: string
}) {
  const supabase = createSupabaseAdminClient() as any

  const { data, error } = await supabase
    .from('custom_designs')
    .insert({
      user_id: params.userId ?? null,
      guest_session_id: params.guestSessionId ?? null,
      collection_key: params.collectionKey,
      design_data: params.designData,
      total_price: params.totalPrice,
      snapshot_url: params.snapshotUrl ?? null,
      status: 'draft',
    })
    .select()
    .single()

  if (error) throw new Error(`Tasarım kaydedilemedi: ${error.message}`)
  return data
}

export async function getCustomDesignById(id: string) {
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('custom_designs')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(`Tasarım bulunamadı: ${error.message}`)
  return data
}

// ── Sipariş Oluşturma ──────────────────────────────────────

export async function createOrder(params: {
  userId?: string | null
  guestEmail?: string | null
  currency: 'TRY' | 'USD'
  subtotal: number       // kuruş/cent (en küçük birim)
  vatAmount: number      // kuruş/cent
  shippingAmount: number // kuruş/cent
  totalAmount: number    // kuruş/cent
  shippingInfo: {
    name: string
    phone: string
    address1: string
    address2?: string
    city: string
    postal: string
    country?: string
  }
  items: Array<{
    itemType: 'product' | 'custom'
    sanityProductId?: string
    registryNo: string
    productName: string
    unitPrice: number
    quantity: number
    customDesignId?: string
  }>
}) {
  const supabase = createSupabaseAdminClient()

  // 1. Siparişi oluştur
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: params.userId ?? null,
      guest_email: params.guestEmail ?? null,
      currency: params.currency,
      subtotal: params.subtotal,
      vat_amount: params.vatAmount,
      shipping_amount: params.shippingAmount,
      total_amount: params.totalAmount,
      status: 'pending',
      shipping_name: params.shippingInfo.name,
      shipping_phone: params.shippingInfo.phone,
      shipping_address1: params.shippingInfo.address1,
      shipping_address2: params.shippingInfo.address2 ?? null,
      shipping_city: params.shippingInfo.city,
      shipping_postal: params.shippingInfo.postal,
      shipping_country: params.shippingInfo.country ?? 'TR',
    })
    .select()
    .single()

  if (orderError) throw new Error(`Sipariş oluşturulamadı: ${orderError.message}`)

  // 2. Sipariş kalemlerini ekle
  const itemRows = params.items.map((item) => ({
    order_id: order.id,
    item_type: item.itemType,
    sanity_product_id: item.sanityProductId ?? null,
    registry_no: item.registryNo,
    product_name: item.productName,
    unit_price: item.unitPrice,
    quantity: item.quantity,
    total_price: item.unitPrice * item.quantity,
    custom_design_id: item.customDesignId ?? null,
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(itemRows)

  if (itemsError) {
    // Rollback: sipariş kalemleri eklenemezse siparişi sil
    await supabase.from('orders').delete().eq('id', order.id)
    throw new Error(`Sipariş kalemleri eklenemedi: ${itemsError.message}`)
  }

  return order
}

// ── Sipariş Durumu Güncelleme (webhook/admin) ─────────────

export async function updateOrderStatus(
  orderId: string,
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded',
  paymentInfo?: { iyzicoPaymentId?: string; iyzicoToken?: string; paidAt?: string }
) {
  const supabase = createSupabaseAdminClient()

  const { data, error } = await supabase
    .from('orders')
    .update({
      status,
      ...(paymentInfo?.iyzicoPaymentId && { iyzico_payment_id: paymentInfo.iyzicoPaymentId }),
      ...(paymentInfo?.iyzicoToken && { iyzico_token: paymentInfo.iyzicoToken }),
      ...(paymentInfo?.paidAt && { paid_at: paymentInfo.paidAt }),
    })
    .eq('id', orderId)
    .select()
    .single()

  if (error) throw new Error(`Sipariş güncellenemedi: ${error.message}`)
  return data
}

export async function getOrderByNumber(orderNumber: string) {
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('order_number', orderNumber)
    .single()

  if (error) throw new Error(`Sipariş bulunamadı: ${error.message}`)
  return data
}

export async function getOrdersByUserId(userId: string) {
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Siparişler alınamadı: ${error.message}`)
  return data
}
