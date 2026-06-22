import { defineField, defineType } from 'sanity'
import { localizedStringField } from './localeHelper'

export const collectionSchema = defineType({
  name: 'collection',
  title: 'Collection',
  type: 'document',

  fields: [
    defineField({
      name: 'key',
      title: 'Collection Key',
      description: 'Kod içinde referans için. Örn: "totem", "waves", "bureau-series"',
      type: 'slug',
      options: { source: 'key', maxLength: 60 },
      validation: (R) => R.required(),
    }),

    localizedStringField({ name: 'name', title: 'Collection Name', required: true }),
    localizedStringField({ name: 'description', title: 'Description' }),

    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: { hotspot: true },
    }),

    defineField({
      name: 'sortOrder',
      title: 'Sort Order',
      type: 'number',
      initialValue: 0,
    }),
  ],

  preview: {
    select: { name: 'name', key: 'key.current', media: 'coverImage' },
    prepare({ name, key, media }) {
      const nameStr = Array.isArray(name)
        ? (name.find((n: { locale: string }) => n.locale === 'en')?.value ?? name[0]?.value ?? '—')
        : '—'
      return { title: nameStr, subtitle: key ?? '', media }
    },
  },
})
