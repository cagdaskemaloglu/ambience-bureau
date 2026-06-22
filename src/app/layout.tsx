import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
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

// NOT: <html>/<body> SADECE burada açılır. [locale]/layout.tsx
// kendi html/body'sini AÇMAZ — sadece içerik (Header/Footer/Provider)
// sağlar. Bu, "/" gibi locale dışı path'lerin (örn. not-found) hata
// vermeden render edilebilmesi için gereken güvenlik ağıdır.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="tr"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="flex h-screen flex-col overflow-y-auto font-sans h-dvh">{children}</body>
    </html>
  )
}
