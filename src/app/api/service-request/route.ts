import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderItemId, issueDescription } = await request.json()

    if (!orderItemId || !issueDescription?.trim()) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const { error } = await (supabase as any)
    .from('service_requests')
    .insert({
        user_id: user.id,
        order_item_id: orderItemId,
        issue_description: issueDescription.trim(),
    })

    if (error) throw error

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    console.error('[service-request]', err)
    return NextResponse.json({ error: 'Could not create request' }, { status: 500 })
  }
}