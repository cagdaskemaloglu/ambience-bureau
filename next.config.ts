import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url' // 🛠️ ESM için __dirname simülasyonu
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

// ESM ortamında __dirname tanımlıyoruz
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  // 🛠️ Iyzipay'in dinamik require() hatalarını engellemek için bu satırı ekledik:
  serverExternalPackages: ['iyzipay'],

  // Ev dizininde (örn. ~/) alakasız başka bir Node.js projesine ait
  // package-lock.json bulunduğunda, Next.js bazen workspace root'u
  // yanlışlıkla oraya çekiyor. Bu satır, doğru kökü (bu proje) sabitler.
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
  },
}

export default withNextIntl(nextConfig)