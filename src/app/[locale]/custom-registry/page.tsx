import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { getAllLampCollections } from '@/lib/queries'
import { CustomRegistryClient } from '@/components/configurator/CustomRegistryClient'

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

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-bureau-black px-6 py-3.5 font-mono text-[11px] text-bureau-muted sm:px-10">
        {t('subtitle')}
      </div>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <CustomRegistryClient collections={collections} initialCollectionKey={collection} />
      </div>
    </div>
  )
}