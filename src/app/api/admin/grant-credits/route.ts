import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/server'

const ADMIN_SECRET = process.env.ADMIN_API_SECRET

export async function POST(request: Request) {
  // Admin secret key doğrulama
  const authHeader = request.headers.get('authorization')
  if (!ADMIN_SECRET || authHeader !== `Bearer ${ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { userId, amount, description } = await request.json()

    if (!userId || !amount || typeof amount !== 'number') {
      return NextResponse.json({ error: 'userId ve amount zorunludur.' }, { status: 400 })
    }

    const admin = createSupabaseAdminClient()

    const { error } = await (admin as any).rpc('grant_bureau_credits', {
      p_user_id: userId,
      p_amount: amount,
      p_description: description ?? 'Admin tarafından tanımlandı',
    })

    if (error) throw error

    // Güncel bakiyeyi döndür
    const { data: profile } = await (admin as any)
      .from('profiles')
      .select('account_id, bureau_credits')
      .eq('id', userId)
      .single()

    return NextResponse.json({
      success: true,
      accountId: profile?.account_id,
      newBalance: profile?.bureau_credits,
    })
  } catch (err) {
    console.error('[admin/grant-credits]', err)
    return NextResponse.json({ error: 'İşlem başarısız.' }, { status: 500 })
  }
}