import { defineField, defineArrayMember } from 'sanity'

// Desteklenen diller — yeni dil eklemek için sadece buraya ekle
export const SUPPORTED_LOCALES = [
  { id: 'tr', title: 'Türkçe' },
  { id: 'en', title: 'English' },
] as const

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]['id']

/**
 * Lokalize string field oluşturur.
 * Her dil için ayrı bir object içinde { locale, value } tuple'ı saklar.
 *
 * Örnek veri:
 * [
 *   { locale: 'tr', value: 'Ürün adı' },
 *   { locale: 'en', value: 'Product name' },
 * ]
 */
export function localizedStringField(options: {
  name: string
  title: string
  required?: boolean
  description?: string
}) {
  return defineField({
    name: options.name,
    title: options.title,
    description: options.description,
    type: 'array',
    of: [
      defineArrayMember({
        type: 'object',
        fields: [
          defineField({
            name: 'locale',
            title: 'Dil',
            type: 'string',
            options: {
              list: SUPPORTED_LOCALES.map((l) => ({ title: l.title, value: l.id })),
              layout: 'radio',
            },
            validation: (R) => R.required(),
          }),
          defineField({
            name: 'value',
            title: 'İçerik',
            type: 'string',
            validation: options.required
              ? (R) => R.required()
              : (R) => R,
          }),
        ],
        preview: {
          select: { locale: 'locale', value: 'value' },
          prepare: ({ locale, value }) => ({
            title: locale
              ? `[${(locale as string).toUpperCase()}] ${value ?? '—'}`
              : `[Dil seçilmedi] ${value ?? '—'}`,
          }),
        },
      }),
    ],
    validation: options.required
      ? (R) => R.required().min(1)
      : (R) => R,
  })
}

/**
 * Lokalize block (Portable Text) field oluşturur.
 * Blog post body, uzun açıklamalar için.
 */
export function localizedBlockField(options: {
  name: string
  title: string
  required?: boolean
}) {
  return defineField({
    name: options.name,
    title: options.title,
    type: 'array',
    of: [
      defineArrayMember({
        type: 'object',
        fields: [
          defineField({
            name: 'locale',
            title: 'Dil',
            type: 'string',
            options: {
              list: SUPPORTED_LOCALES.map((l) => ({ title: l.title, value: l.id })),
              layout: 'radio',
            },
            validation: (R) => R.required(),
          }),
          defineField({
            name: 'value',
            title: 'İçerik',
            type: 'array',
            of: [
              { type: 'block' },
              {
                type: 'image',
                options: { hotspot: true },
                fields: [
                  defineField({ name: 'alt', type: 'string', title: 'Alt metin' }),
                  defineField({ name: 'caption', type: 'string', title: 'Açıklama' }),
                ],
              },
            ],
          }),
        ],
        preview: {
          select: { locale: 'locale' },
          prepare: ({ locale }) => ({
            title: locale
              ? `[${(locale as string).toUpperCase()}] Portable Text Block`
              : '[Dil seçilmedi] Portable Text Block',
          }),
        },
      }),
    ],
  })
}
