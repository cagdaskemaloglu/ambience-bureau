import { notFound } from 'next/navigation'
import { PortableText } from '@portabletext/react'
import { getPostBySlug } from '@/lib/queries'
import { getLocalizedValue, urlFor } from '@/lib/sanity'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import type { PortableTextBlock } from '@/types'

const CATEGORY_LABEL: Record<string, { tr: string; en: string }> = {
  workshop: { tr: 'Atölye', en: 'Workshop' },
  design: { tr: 'Tasarım', en: 'Design' },
  technology: { tr: 'Teknoloji', en: 'Technology' },
  project: { tr: 'Proje', en: 'Project' },
}

export default async function ArchiveDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) notFound()

  const title = getLocalizedValue(post.title, locale, '—')
  const body = getLocalizedValue<PortableTextBlock[]>(post.body, locale)
  const categoryLabel = post.category
    ? CATEGORY_LABEL[post.category]?.[locale as 'tr' | 'en']
    : null

  return (
    <>
      {/* Breadcrumb / doc strip */}
      <div className="flex items-center justify-between border-b border-bureau-black px-6 py-3.5 font-mono text-[11px] text-bureau-muted sm:px-10">
        <Link href="/archive" className="no-underline hover:text-bureau-black">
          ← {locale === 'tr' ? 'Arşive Dön' : 'Back to Archive'}
        </Link>
        {post.documentRef && <div>{post.documentRef}</div>}
      </div>

      <article className="mx-auto max-w-2xl px-6 py-10 sm:px-10">
        {/* Meta */}
        <div className="mb-4 flex items-center gap-3">
          {categoryLabel && (
            <span className="font-mono text-[10px] uppercase tracking-wide text-bureau-amber">
              {categoryLabel}
            </span>
          )}
          <span className="font-mono text-[10.5px] text-bureau-subtle">
            {new Date(post.publishedAt).toLocaleDateString(
              locale === 'tr' ? 'tr-TR' : 'en-US',
              { year: 'numeric', month: 'long', day: 'numeric' }
            )}
          </span>
        </div>

        <h1 className="mb-6 text-[30px] font-light uppercase leading-tight tracking-wide">
          {title}
        </h1>

        {post.coverImage && (
          <div className="mb-8 aspect-video overflow-hidden bg-bureau-surface">
            <Image
              src={urlFor(post.coverImage).width(800).height(450).fit('crop').url()}
              alt={post.coverImage.alt ?? title ?? ''}
              width={800}
              height={450}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {body && body.length > 0 && (
          <div className="space-y-4 text-[14px] leading-relaxed text-bureau-ink [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-[18px] [&_h2]:font-semibold [&_h2]:uppercase [&_img]:my-6 [&_img]:w-full [&_p]:mb-4">
            <PortableText value={body} />
          </div>
        )}

        {post.author && (
          <div className="mt-10 border-t border-dashed border-bureau-rule pt-4">
            <span className="font-mono text-[10.5px] uppercase tracking-wide text-bureau-muted">
              {locale === 'tr' ? 'Yazar' : 'Author'}: {post.author}
            </span>
          </div>
        )}
      </article>
    </>
  )
}