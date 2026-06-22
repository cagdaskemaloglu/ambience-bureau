import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { Header } from '@/components/layout/Header'
import { ConditionalFooter } from '@/components/layout/ConditionalFooter'

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

// NOT: Bu layout <html>/<body> AÇMAZ — bunlar src/app/layout.tsx'te.
// Burada sadece locale doğrulama, mesaj provider'ı ve sayfa iskeleti
// (Header/Footer) sağlanır.
export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex flex-1 flex-col">{children}</main>
        <ConditionalFooter />
      </div>
    </NextIntlClientProvider>
  )
}
