import { BureauHubExperience } from '@/components/apply/BureauHubExperience'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export default async function BecomeBureauHubPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const tr = locale === 'tr'

  // Sayfayı misafirler de görebilir; giriş yapmış kullanıcının adı/e-postası
  // forma önceden doldurulur. Göndermek için üyelik şartı API'de de zorlanır.
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const appUser = user
    ? {
        email: user.email ?? '',
        name: (user.user_metadata?.full_name as string | undefined) ?? '',
      }
    : null

  const points = tr
    ? [
        ['Yerel temsil', 'Ülkenizde The Ambience Bureau\'nun resmî yüzü olursunuz.'],
        ['Topluluk', 'Yerel tasarım ve aydınlatma topluluğunu büronun etrafında buluşturursunuz.'],
        ['Destek noktası', 'Bölgenizdeki kullanıcılar için ilk temas ve destek noktası olursunuz.'],
        ['İş ortaklıkları', 'Yerel üretici, mimar ve mekân sahipleriyle bağlantılar kurarsınız.'],
      ]
    : [
        ['Local representation', 'Become the official face of The Ambience Bureau in your country.'],
        ['Community', 'Bring the local design and lighting community together around the bureau.'],
        ['Support point', 'Be the first point of contact and support for users in your region.'],
        ['Partnerships', 'Build connections with local makers, architects and venue owners.'],
      ]

  return (
    <>
      <div className="border-b border-bureau-black px-6 py-3.5 font-mono text-[11px] text-bureau-muted sm:px-10">
        DOCUMENT REF: TAB-2026-HUB-01 // CLASSIFICATION: REGIONAL OFFICE
      </div>

      <div className="mx-auto max-w-5xl px-6 py-12 sm:px-10">
        <h1 className="mb-4 text-[30px] font-light uppercase tracking-wide">
          {tr ? 'Bölge Bürosu Ol' : 'Become Bureau Hub'}
        </h1>
        <p className="mb-8 max-w-2xl text-[14px] leading-relaxed text-bureau-muted">
          {tr
            ? 'The Ambience Bureau\'yu kendi ülkenizde temsil edin. Haritada hangi ülkelerde aktif büro bulunduğunu görebilir, kendi ülkenizi seçerek başvurabilirsiniz.'
            : 'Represent The Ambience Bureau in your own country. See on the map where active bureaus exist, then pick your country to apply.'}
        </p>

        <div className="mb-10 grid grid-cols-1 gap-px border border-bureau-black bg-bureau-black sm:grid-cols-2 lg:grid-cols-4">
          {points.map(([title, desc], i) => (
            <div key={title} className="bg-bureau-white p-4">
              <div className="mb-2 font-mono text-[17px] font-light text-bureau-amber">
                {String(i + 1).padStart(2, '0')}
              </div>
              <h2 className="mb-1 text-[12px] font-semibold uppercase tracking-wide">{title}</h2>
              <p className="text-[12px] leading-relaxed text-bureau-muted">{desc}</p>
            </div>
          ))}
        </div>

        <BureauHubExperience user={appUser} />
      </div>
    </>
  )
}
