import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { getAllLampCollections } from '@/lib/queries'
import { CustomRegistryClient } from '@/components/configurator/CustomRegistryClient'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'customRegistry' })

  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: `/${locale}/custom-registry`,
      languages: { tr: '/tr/custom-registry', en: '/en/custom-registry' },
    },
  }
}

// Tutorial, misafirlere VE Custom Registry'den daha önce hiç sipariş
// vermemiş üyelere gösterilir. Bir kere sipariş verdikten sonra üye için
// kalıcı olarak kapanır (sunucu taraflı kontrol) — misafir/yeni üye için
// ise her ziyarette tekrar gösterilir (kalıcı bir "görüldü" bayrağı yok).
async function shouldShowTutorial(): Promise<boolean> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return true // misafir — her zaman uygun

  const admin = createSupabaseAdminClient() as any
  const { data } = await admin
    .from('order_items')
    .select('id, orders!inner(user_id)')
    .eq('item_type', 'custom')
    .eq('orders.user_id', user.id)
    .limit(1)

  return (data?.length ?? 0) === 0
}

export default async function CustomRegistryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ collection?: string }>
}) {
  const { locale } = await params
  const { collection } = await searchParams
  const t = await getTranslations({ locale, namespace: 'customRegistry' })
  const collections = await getAllLampCollections()
  const showTutorial = await shouldShowTutorial()

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-bureau-black px-6 py-3.5 font-mono text-[11px] text-bureau-muted sm:px-10">
        {t('subtitle')}
      </div>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <CustomRegistryClient collections={collections} initialCollectionKey={collection} showTutorial={showTutorial} />
      </div>
    </div>
  )
}