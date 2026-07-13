import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { headers } from 'next/headers'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  ),
  title: {
    template: '%s — The Ambience Bureau',
    default: 'The Ambience Bureau',
  },
  description:
    'Regulation of spatial photons. Certified smart lighting objects for the modern interior.',
  openGraph: {
    siteName: 'The Ambience Bureau',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // middleware.ts, algılanan dili bu header'a yazıyor — <html lang="tr">
  // artık İngilizce sayfalarda da yanlışlıkla "tr" kalmıyor.
  const headersList = await headers()
  const lang = headersList.get('x-locale') ?? 'tr'

  return (
    <html
      lang={lang}
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="flex h-dvh flex-col overflow-hidden font-sans">{children}</body>
    </html>
  )
}