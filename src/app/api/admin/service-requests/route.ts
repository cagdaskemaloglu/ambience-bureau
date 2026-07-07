import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/server'

function checkAuth(request: Request) {
  const secret = process.env.ADMIN_API_SECRET
  const auth = request.headers.get('x-admin-secret')
  return secret && auth === secret
}

export async function GET(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createSupabaseAdminClient() as any
  const { data, error } = await admin
    .from('service_requests')
    .select(`
      *,
      profiles ( email, full_name, account_id ),
      order_items ( product_name, registry_no )
    `)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ requests: data })
}

export async function PATCH(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, status, adminNotes } = await request.json()

  const admin = createSupabaseAdminClient() as any
  const { data, error } = await admin
    .from('service_requests')
    .update({
      status,
      ...(adminNotes && { admin_notes: adminNotes }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ request: data })
}