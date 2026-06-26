import type { NextConfig } from 'next'
import path from 'path'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
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
