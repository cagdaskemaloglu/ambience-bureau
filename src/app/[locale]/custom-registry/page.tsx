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
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'customRegistry' })
  const collections = await getAllLampCollections()

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="border-b border-bureau-black px-6 py-3.5 font-mono text-[11px] text-bureau-muted sm:px-10">
        {t('subtitle')}
      </div>
      <div className="min-h-0 flex-1">
        <CustomRegistryClient collections={collections} />
      </div>
    </div>
  )
}