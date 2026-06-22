import { defineField, defineType } from 'sanity'
import { localizedStringField, localizedBlockField } from './localeHelper'

export const postSchema = defineType({
  name: 'post',
  title: 'Post (Archive)',
  type: 'document',

  fields: [
    // ── Kimlik ────────────────────────────────────────────
    defineField({
      name: 'slug',
      title: 'Slug (URL)',
      type: 'slug',
      options: {
        source: (doc) => {
          const title = (doc.title as Array<{ locale: string; value: string }>)
          const enTitle = title?.find((t) => t.locale === 'en')?.value
          const trTitle = title?.find((t) => t.locale === 'tr')?.value
          return enTitle ?? trTitle ?? 'untitled'
        },
        maxLength: 96,
      },
      validation: (R) => R.required(),
    }),

    defineField({
      name: 'documentRef',
      title: 'Document Reference',
      description: 'Bürokratik belge kimliği. Örn: TAB-2026-N09',
      type: 'string',
    }),

    // ── Çok Dilli İçerik ──────────────────────────────────
    localizedStringField({ name: 'title', title: 'Title', required: true }),
    localizedStringField({ name: 'excerpt', title: 'Excerpt (List Preview)' }),
    localizedBlockField({ name: 'body', title: 'Body' }),

    // ── Görsel ───────────────────────────────────────────
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({ name: 'alt', type: 'string', title: 'Alt metin' }),
      ],
    }),

    // ── Meta ─────────────────────────────────────────────
    defineField({
      name: 'author',
      title: 'Author',
      type: 'string',
      initialValue: 'The Ambience Bureau',
    }),

    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Atölye / Workshop', value: 'workshop' },
          { title: 'Tasarım / Design', value: 'design' },
          { title: 'Teknoloji / Technology', value: 'technology' },
          { title: 'Proje / Project', value: 'project' },
        ],
      },
    }),

    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      validation: (R) => R.required(),
    }),

    defineField({
      name: 'featured',
      title: 'Featured post?',
      type: 'boolean',
      initialValue: false,
    }),

    // ── SEO ───────────────────────────────────────────────
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        localizedStringField({ name: 'metaTitle', title: 'Meta Title' }),
        localizedStringField({ name: 'metaDescription', title: 'Meta Description' }),
        defineField({
          name: 'ogImage',
          title: 'OG Image',
          type: 'image',
          options: { hotspot: true },
        }),
      ],
    }),
  ],

  preview: {
    select: {
      title: 'title',
      documentRef: 'documentRef',
      publishedAt: 'publishedAt',
      media: 'coverImage',
    },
    prepare({ title, documentRef, publishedAt, media }) {
      const titleStr = Array.isArray(title)
        ? (title.find((t: { locale: string }) => t.locale === 'en')?.value ?? title[0]?.value ?? '—')
        : '—'
      const date = publishedAt
        ? new Date(publishedAt as string).toLocaleDateString('tr-TR')
        : 'Draft'
      return {
        title: titleStr,
        subtitle: `${documentRef ?? ''} // ${date}`,
        media,
      }
    },
  },

  orderings: [
    {
      title: 'Published (Newest)',
      name: 'publishedDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
  ],
})
