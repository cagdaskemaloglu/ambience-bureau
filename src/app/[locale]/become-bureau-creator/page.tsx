import { ApplicationForm } from '@/components/apply/ApplicationForm'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export default async function BecomeBureauCreatorPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const tr = locale === 'tr'

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

  const steps = tr
    ? [
        ['Başvurun', 'Aşağıdaki formu doldurun ve çalışmalarınızı bize gösterin.'],
        ['Değerlendirme', 'Tasarım departmanı başvurunuzu inceler ve sizinle e-posta ile iletişime geçer.'],
        ['Designer üyelik', 'Onaylanırsanız hesabınızda "Be Designer" düğmesi etkinleşir.'],
        ['Koleksiyon oluşturun', 'Designer üyeler kendi koleksiyonlarını oluşturabilir.'],
      ]
    : [
        ['Apply', 'Fill in the form below and show us your work.'],
        ['Review', 'The design department reviews your application and replies by email.'],
        ['Designer membership', 'If approved, the "Be Designer" button is activated on your account.'],
        ['Create collections', 'Designer members can create their own collections.'],
      ]

  return (
    <>
      <div className="border-b border-bureau-black px-6 py-3.5 font-mono text-[11px] text-bureau-muted sm:px-10">
        DOCUMENT REF: TAB-2026-CRT-01 // CLASSIFICATION: DESIGN DEPARTMENT
      </div>

      <div className="mx-auto max-w-3xl px-6 py-12 sm:px-10">
        <h1 className="mb-4 text-[30px] font-light uppercase tracking-wide">
          {tr ? 'Tasarım Departmanına Katıl' : 'Become Bureau Creators'}
        </h1>
        <p className="mb-8 text-[14px] leading-relaxed text-bureau-muted">
          {tr
            ? 'The Ambience Bureau\'nun tasarım departmanının bir parçası olun. Designer üyeler, sitede kendi koleksiyonlarını oluşturabilir ve onları büronun kayıt sistemine taşıyabilir.'
            : 'Become part of The Ambience Bureau\'s design department. Designer members can create their own collections on the site and bring them into the bureau\'s registry.'}
        </p>

        <div className="mb-8 border border-bureau-black">
          {steps.map(([title, desc], i) => (
            <div
              key={title}
              className={`flex gap-5 p-5 ${
                i !== steps.length - 1 ? 'border-b border-dashed border-bureau-rule' : ''
              }`}
            >
              <div className="min-w-[34px] font-mono text-[20px] font-light text-bureau-amber">
                {String(i + 1).padStart(2, '0')}
              </div>
              <div>
                <h2 className="mb-1 text-[13px] font-semibold uppercase tracking-wide">{title}</h2>
                <p className="text-[13px] leading-relaxed text-bureau-muted">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-10 border border-bureau-rule bg-bureau-surface p-4">
          <p className="font-mono text-[10px] leading-relaxed text-bureau-muted">
            [
            {tr
              ? 'YAKINDA: koleksiyon/drop analizleri ve bilgileri, ödemeler ve ek designer özellikleri.'
              : 'COMING SOON: collection/drop analytics and insights, payouts and additional designer features.'}
            ]
          </p>
        </div>

        <div id="apply-form" className="scroll-mt-24 border-t border-bureau-black pt-10">
          <div className="mb-5 border-b border-bureau-black pb-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-bureau-muted">
              FORM 400-C // {tr ? 'TASARIM DEPARTMANI BAŞVURUSU' : 'DESIGN DEPARTMENT APPLICATION'}
            </span>
            <h2 className="mt-1 text-[20px] font-light uppercase tracking-wide text-bureau-black">
              {tr ? 'Başvuru Formu' : 'Application Form'}
            </h2>
          </div>
          <ApplicationForm type="creator" user={appUser} nextPath="/become-bureau-creator" />
        </div>
      </div>
    </>
  )
}
