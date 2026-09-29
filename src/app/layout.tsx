import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { headers } from 'next/headers'
import './globals.css'
import { ThemeProvider } from '@/components/theme/ThemeProvider'

// React hydrate OLMADAN önce, tarayıcı ilk paint'i yapmadan senkron
// çalışması gereken script — aksi halde sayfa bir anlığına yanlış temayla
// (ör. localStorage karanlık dese bile beyaz arka planla) çizilip hemen
// ardından karanlığa döner ("flaş"). ThemeProvider.tsx'teki
// resolveInitialTheme() ile BİREBİR AYNI mantığı izler; ikisi
// birbirinden bağımsız güncellenmemeli.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('ambience-bureau-theme');
    var isDark = stored === 'dark' || (stored !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`

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
      <head>
        {/* eslint-disable-next-line react/no-danger */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex h-dvh flex-col overflow-hidden font-sans">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}