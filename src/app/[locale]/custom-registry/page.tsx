import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { getAllLampCollections, getProductBySlug } from '@/lib/queries'
import { CustomRegistryClient } from '@/components/configurator/CustomRegistryClient'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server'
import type { ProductConfiguratorPart } from '@/types'

// "Customize" butonundan gelen ürün (?preset=<slug>) için Custom Registry'ye
// aktarılacak veri: hangi koleksiyon + tam parça/malzeme kombinasyonu.
// Sonuç durumu ayırt edilir ki sessizce boş koleksiyon seçim ekranına
// düşülmesin — kullanıcıya/admin'e NEDEN görünsün (bkz. presetError).
type PresetResult =
  | { status: 'ok'; design: { collectionKey: string; parts: ProductConfiguratorPart[] } }
  | { status: 'not-requested' }
  | { status: 'not-found' } // preset=<slug> var ama böyle bir ürün yok
  | { status: 'not-configurable' } // ürün var ama isConfigurable=false
  | { status: 'incomplete' } // isConfigurable=true ama configuratorCollection/configuratorParts eksik

async function getPresetDesign(slug: string | undefined): Promise<PresetResult> {
  if (!slug) return { status: 'not-requested' }
  const product = await getProductBySlug(slug)
  if (!product) return { status: 'not-found' }
  if (!product.isConfigurable) return { status: 'not-configurable' }
  if (!product.configuratorCollection || !product.configuratorParts?.length) {
    return { status: 'incomplete' }
  }
  return {
    status: 'ok',
    design: { collectionKey: product.configuratorCollection, parts: product.configuratorParts },
  }
}

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
  searchParams: Promise<{ collection?: string; preset?: string; capture?: string }>
}) {
  const { locale } = await params
  const { collection, preset, capture } = await searchParams
  const isCaptureMode = capture === '1'
  const collections = await getAllLampCollections()
  const presetResult = await getPresetDesign(preset)
  const presetDesign = presetResult.status === 'ok' ? presetResult.design : null

  // Capture modu (bkz. scripts/generate-spin-frames.ts): sadece 3D canvas'ı
  // TAM EKRAN, hiçbir yan panel/tutorial/header olmadan render eder — böylece
  // Puppeteer'ın ayarladığı viewport boyutu birebir kare çözünürlüğü olur.
  if (isCaptureMode) {
    return (
      <div style={{ position: 'fixed', inset: 0 }}>
        <CustomRegistryClient
          collections={collections}
          presetDesign={presetDesign}
          presetStatus={presetResult.status}
          showTutorial={false}
          captureMode
        />
      </div>
    )
  }

  const t = await getTranslations({ locale, namespace: 'customRegistry' })
  // Bir ürünün tam kombinasyonuyla önceden doldurulmuş olarak açıldığında
  // (Customize butonu) tutorial atlanır — zaten dolu bir tasarım var.
  const showTutorial = presetDesign ? false : await shouldShowTutorial()

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-bureau-black px-6 py-3.5 font-mono text-[11px] text-bureau-muted sm:px-10">
        {t('subtitle')}
      </div>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <CustomRegistryClient
          collections={collections}
          initialCollectionKey={collection}
          presetDesign={presetDesign}
          presetStatus={presetResult.status}
          showTutorial={showTutorial}
        />
      </div>
    </div>
  )
}