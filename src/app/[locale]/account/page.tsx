import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/server'
import { RegistryStatus } from './RegistryStatus'

export default async function AccountPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { locale } = await params
  const { tab } = await searchParams
  const initialTab = tab === 'archive' || tab === 'credits' ? tab : 'status'
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/auth/login`)
  }

  // Profil + siparişler
  const admin = createSupabaseAdminClient() as any

  const { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: orders } = await admin
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        custom_designs ( snapshot_url )
      )
    `)
    .eq('user_id', user.id)
    .in('status', ['processing', 'shipped', 'delivered'])
    .order('created_at', { ascending: false })

  // snapshot_url'i order_item seviyesine taşı
  const ordersWithSnapshot = (orders ?? []).map((order: any) => ({
    ...order,
    order_items: (order.order_items ?? []).map((item: any) => ({
      ...item,
      snapshot_url: item.custom_designs?.snapshot_url ?? null,
    })),
  }))

  const { data: creditTx } = await admin
    .from('bureau_credit_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Servis talepleri
  const { data: serviceRequests } = await admin
    .from('service_requests')
    .select('*, order_items(product_name, registry_no)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <RegistryStatus
      profile={profile}
      orders={ordersWithSnapshot}
      creditTransactions={creditTx ?? []}
      serviceRequests={serviceRequests ?? []}
      locale={locale as 'tr' | 'en'}
      initialTab={initialTab}
    />
  )
}