import { NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server'

/**
 * Oturum sahibi kullanıcının profilini (ad soyad, telefon, adres) günceller.
 * Kimlik doğrulama session cookie'sinden okunur (client'tan gelen bir ID'ye
 * güvenilmez) — bu yüzden bir kullanıcı başka birinin profilini güncelleyemez.
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

    const body = await request.json()
    const { fullName, phone, addressLine1, addressLine2, city, postalCode } = body ?? {}

    if (typeof fullName !== 'string' || fullName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Full name is required' },
        { status: 400 }
      )
    }

    const admin = createSupabaseAdminClient() as any
    const { error } = await admin
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        phone: typeof phone === 'string' ? phone.trim() || null : null,
        address_line1: typeof addressLine1 === 'string' ? addressLine1.trim() || null : null,
        address_line2: typeof addressLine2 === 'string' ? addressLine2.trim() || null : null,
        city: typeof city === 'string' ? city.trim() || null : null,
        postal_code: typeof postalCode === 'string' ? postalCode.trim() || null : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      console.error('[update-profile] Supabase hatası:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[update-profile] Beklenmeyen hata:', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}