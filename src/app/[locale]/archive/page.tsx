import { getTranslations } from 'next-intl/server'
import { getAllPosts } from '@/lib/queries'
import { getLocalizedValue, urlFor } from '@/lib/sanity'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'

const CATEGORY_LABEL: Record<string, { tr: string; en: string }> = {
  workshop: { tr: 'Atölye', en: 'Workshop' },
  design: { tr: 'Tasarım', en: 'Design' },
  technology: { tr: 'Teknoloji', en: 'Technology' },
  project: { tr: 'Proje', en: 'Project' },
}

export default async function ArchivePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const posts = await getAllPosts()

  return (
    <>
      {/* Document strip */}
      <div className="flex items-center justify-between border-b border-bureau-black px-6 py-3.5 font-mono text-[11px] text-bureau-muted sm:px-10">
        <div>DOCUMENT REF: TAB-2026-ARC-01 // CLASSIFICATION: PUBLIC BULLETIN</div>
        <div className="text-bureau-black">
          ENTRIES: <span className="text-bureau-amber">{posts.length}</span>
        </div>
      </div>

      <div className="px-6 py-9 sm:px-10">
        <div className="mb-8 border-b border-dashed border-bureau-rule pb-4">
          <div className="label-mono mb-1">SECTION 03</div>
          <h1 className="text-[28px] font-light uppercase tracking-wide">
            {locale === 'tr' ? 'Arşiv' : 'Archive'}
          </h1>
          <p className="mt-2 max-w-lg text-[13px] text-bureau-muted">
            {locale === 'tr'
              ? 'Atölye kayıtları, tasarım notları ve teknik bültenler.'
              : 'Workshop records, design notes, and technical bulletins.'}
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="border border-dashed border-bureau-rule p-10 text-center">
            <p className="font-mono text-[12px] uppercase tracking-wide text-bureau-subtle">
              {locale === 'tr' ? 'Henüz kayıt yok.' : 'No entries yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-px border border-bureau-black bg-bureau-black sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post: any) => {
              const title = getLocalizedValue(post.title, locale, '—')
              const excerpt = getLocalizedValue(post.excerpt, locale, '')
              const categoryLabel = post.category
                ? CATEGORY_LABEL[post.category]?.[locale as 'tr' | 'en']
                : null

              return (
                <Link
                  key={post._id}
                  href={`/archive/${post.slug.current}`}
                  className="flex flex-col bg-bureau-white p-5 no-underline transition-colors hover:bg-bureau-surface"
                >
                  <div className="mb-3 flex h-40 items-center justify-center overflow-hidden bg-bureau-surface">
                    {post.coverImage ? (
                      <Image
                        src={urlFor(post.coverImage).width(360).height(220).fit('crop').url()}
                        alt={post.coverImage.alt ?? title ?? ''}
                        width={360}
                        height={160}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="font-mono text-[10px] uppercase text-bureau-subtle">
                        No Image on Record
                      </span>
                    )}
                  </div>

                  <div className="mb-2 flex items-center justify-between">
                    {post.documentRef && (
                      <span className="serial">{post.documentRef}</span>
                    )}
                    {categoryLabel && (
                      <span className="font-mono text-[9.5px] uppercase tracking-wide text-bureau-amber">
                        {categoryLabel}
                      </span>
                    )}
                  </div>

                  <h2 className="mb-1.5 text-[14px] font-semibold uppercase tracking-bureau">
                    {title}
                  </h2>

                  {excerpt && (
                    <p className="mb-3 line-clamp-2 text-[12px] leading-relaxed text-bureau-muted">
                      {excerpt}
                    </p>
                  )}

                  <div className="mt-auto font-mono text-[10px] text-bureau-subtle">
                    {new Date(post.publishedAt).toLocaleDateString(
                      locale === 'tr' ? 'tr-TR' : 'en-US',
                      { year: 'numeric', month: 'long', day: 'numeric' }
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}