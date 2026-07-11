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

    // ── Donanım Tahsisi & IoT Ücretlendirmesi ──────────────────
    // Custom Registry konfigüratöründe bu koleksiyondan bir tasarım
    // sipariş edildiğinde eklenen ücretler. Kod değişikliği gerektirmeden
    // koleksiyondan koleksiyona farklı fiyatlandırma yapılabilmesi için.
    defineField({
      name: 'hardwareBaseFeeTRY',
      title: 'Donanım Tahsisi — Taban Ücret (TRY)',
      description: 'IoT seçili olmasa bile her zaman eklenen taban ücret. Örn: 1600',
      type: 'number',
      initialValue: 1600,
      validation: (R) => R.required().min(0),
    }),
    defineField({
      name: 'hardwareBaseFeeUSD',
      title: 'Hardware Allocation — Base Fee (USD)',
      description: 'Always-on base fee, even without IoT. E.g. 40',
      type: 'number',
      initialValue: 40,
      validation: (R) => R.required().min(0),
    }),
    defineField({
      name: 'iotFeeTRY',
      title: 'IoT Ek Ücreti (TRY)',
      description: 'IoT seçiliyse taban ücretin ÜZERİNE eklenen ek ücret. Örn: 1200',
      type: 'number',
      initialValue: 1200,
      validation: (R) => R.required().min(0),
    }),
    defineField({
      name: 'iotFeeUSD',
      title: 'IoT Surcharge (USD)',
      description: 'Added on top of the base fee when IoT is enabled. E.g. 30',
      type: 'number',
      initialValue: 30,
      validation: (R) => R.required().min(0),
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