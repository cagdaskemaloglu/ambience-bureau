import { redirect } from '@/i18n/navigation'

type Props = {
  params: Promise<{ locale: string }>
}

// Kök route direkt Registry sayfasına yönlendirir
// Ana sayfa = Registry (ürün kataloğu)
export default async function HomePage({ params }: Props) {
  const { locale } = await params
  redirect({ href: '/registry', locale })
}
