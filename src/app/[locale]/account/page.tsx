import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/server'
import { RegistryStatus } from './RegistryStatus'

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
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
    .select('*, order_items(*)')
    .eq('user_id', user.id)
    .in('status', ['processing', 'shipped', 'delivered'])
    .order('created_at', { ascending: false })

  const { data: creditTx } = await admin
    .from('bureau_credit_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <RegistryStatus
      profile={profile}
      orders={orders ?? []}
      creditTransactions={creditTx ?? []}
      locale={locale as 'tr' | 'en'}
    />
  )
}