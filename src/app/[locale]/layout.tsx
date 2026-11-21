import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { Header } from '@/components/layout/Header'
import { ConditionalFooter } from '@/components/layout/ConditionalFooter'
import { getAllLampCollections } from '@/lib/queries'
import { CartDrawer } from '@/components/cart/CartDrawer'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) return {}

  const t = await getTranslations({ locale, namespace: 'common' })

  return {
    title: { template: `%s — ${t('brandName')}`, default: t('brandName') },
    description: locale === 'tr'
      ? 'Mekânsal foton düzenlemesi. Modern iç mekânlar için sertifikalı akıllı aydınlatma nesneleri.'
      : 'Regulation of spatial photons. Certified smart lighting objects for the modern interior.',
    alternates: {
      languages: {
        tr: '/tr',
        en: '/en',
      },
    },
  }
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  const messages = await getMessages()
  const collections = await getAllLampCollections()

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Atlama linki — klavyede İLK odak durağı (erişilebilirlik). */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[100] focus:bg-bureau-amber focus:px-3 focus:py-2 focus:font-mono focus:text-[11px] focus:uppercase focus:tracking-wider focus:text-white"
        >
          {locale === 'tr' ? 'İçeriğe geç' : 'Skip to content'}
        </a>
        <Header collections={collections} />
        {/* Footer artık içerikle birlikte kayıyor (önceden ekranın altına
            sabitti, mobilde tamamen gizliydi ve drop kartlarını kesiyordu). */}
        <main id="main-content" tabIndex={-1} className="flex min-h-0 flex-1 flex-col overflow-y-auto focus:outline-none">
          {children}
          <ConditionalFooter />
        </main>
        <CartDrawer />
      </div>
    </NextIntlClientProvider>
  )
}