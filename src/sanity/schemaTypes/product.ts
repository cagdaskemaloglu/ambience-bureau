import { defineField, defineType, defineArrayMember } from 'sanity'
import { localizedStringField, localizedBlockField } from './localeHelper'

export const productSchema = defineType({
  name: 'product',
  title: 'Product (Object Registry)',
  type: 'document',

  fields: [
    // ── Kimlik / Registry ────────────────────────────────
    defineField({
      name: 'registryNo',
      title: 'Registry Number',
      description: 'Örn: 001/050 — seri numara / toplam adet',
      type: 'string',
      validation: (R) => R.required(),
    }),

    defineField({
      name: 'slug',
      title: 'Slug (URL)',
      type: 'slug',
      options: { source: 'registryNo', maxLength: 96 },
      validation: (R) => R.required(),
    }),

    defineField({
      name: 'status',
      title: 'Registry Status',
      type: 'string',
      options: {
        list: [
          { title: '● Certified (Available)', value: 'certified' },
          { title: '● Limited Series', value: 'limited' },
          { title: '● Decommissioned (Sold Out)', value: 'decommissioned' },
        ],
        layout: 'radio',
      },
      initialValue: 'certified',
      validation: (R) => R.required(),
    }),

    // ── Çok Dilli İsim & Açıklama ────────────────────────
    localizedStringField({ name: 'name', title: 'Object Name', required: true }),
    localizedStringField({ name: 'shortDescription', title: 'Short Description (Card)' }),
    localizedBlockField({ name: 'description', title: 'Full Description' }),

    // ── Görsel ───────────────────────────────────────────
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({ name: 'alt', type: 'string', title: 'Alt metin' }),
          ],
        }),
      ],
    }),

    // ── Kategori ─────────────────────────────────────────
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Pendant', value: 'pendant' },
          { title: 'Wall-Mounted', value: 'wall' },
          { title: 'Desk Unit', value: 'desk' },
          { title: 'Floor System', value: 'floor' },
          { title: 'Strip Element', value: 'strip' },
        ],
      },
      validation: (R) => R.required(),
    }),

    defineField({
      name: 'collection',
      title: 'Collection',
      type: 'reference',
      to: [{ type: 'collection' }],
    }),

    defineField({
      name: 'drop',
      title: 'Drop',
      description:
        'Bu ürün hangi Drop\'ta yer alıyor? OPSİYONEL — boş bırakılırsa anasayfadaki Drop satırlarında görünmez, sadece Registry sayfasında listelenir.',
      type: 'reference',
      to: [{ type: 'drop' }],
    }),

    // ── Fiyat ────────────────────────────────────────────
    // İki para birimi de elle girilir (otomatik kur çevrimi kullanılmıyor).
    // Görüntülemede dil/locale'e göre ilgili alan seçilir.
    // iyzico checkout'ta da kullanıcının para birimi tercihine göre
    // bu alanlardan biri + ilgili currency kodu gönderilir.
    defineField({
      name: 'priceTRY',
      title: 'Price — TRY (₺)',
      description: 'Türk Lirası fiyatı, sayısal değer. Örn: 7490',
      type: 'number',
      validation: (R) => R.required().positive(),
    }),

    defineField({
      name: 'priceUSD',
      title: 'Price — USD ($)',
      description: 'ABD Doları fiyatı, sayısal değer. Örn: 199',
      type: 'number',
      validation: (R) => R.required().positive(),
    }),

    defineField({
      name: 'vatIncluded',
      title: 'KDV dahil mi?',
      type: 'boolean',
      initialValue: true,
    }),

    // ── Teknik Özellikler ─────────────────────────────────
    defineField({
      name: 'specs',
      title: 'Technical Specifications',
      description: 'Teknik özellik satırları: "Light Temperature", "2700K – 6500K" gibi',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({ name: 'key', title: 'Spec Name', type: 'string' }),
            defineField({ name: 'value', title: 'Spec Value', type: 'string' }),
          ],
          preview: {
            select: { key: 'key', value: 'value' },
            prepare: ({ key, value }) => ({ title: `${key}: ${value}` }),
          },
        }),
      ],
    }),

    defineField({
      name: 'photonOutput',
      title: 'Photon Output (Light Temperature)',
      type: 'string',
      options: {
        list: [
          { title: 'Warm White 2700K', value: '2700K' },
          { title: 'Dimmable 2700K – 6500K', value: '2700K-6500K' },
          { title: 'Cool White 6500K', value: '6500K' },
        ],
      },
    }),

    // ── Ürün Kimlik Belgeleri (Sertifika / Ürün Kartı / Garanti) ──
    defineField({
      name: 'netWeightKg',
      title: 'Net Weight (KG)',
      description: 'Ürün kimlik belgelerinde "NET AĞIRLIK" alanında görünür. Örn: 4.82',
      type: 'number',
    }),

    defineField({
      name: 'firmwareVersion',
      title: 'Firmware Version',
      description: 'Örn: v1.0.26 [ESP32]',
      type: 'string',
      initialValue: 'v1.0.26 [ESP32]',
    }),

    defineField({
      name: 'assetSubtype',
      title: 'Asset Subtype (Bracketed classification line)',
      description: 'Belgelerdeki sınıflandırma alt satırı. Örn: [VERTICAL COLUMN] / [DİKEY KOLON]',
      type: 'string',
    }),

    defineField({
      name: 'compatibility',
      title: 'Control Compatibility',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      options: {
        list: [
          { title: 'App Protocol', value: 'app' },
          { title: 'Voice Module (Google/Alexa/Siri)', value: 'voice' },
          { title: 'Manual Override', value: 'manual' },
          { title: 'Schedule Automation', value: 'schedule' },
        ],
        layout: 'grid',
      },
    }),

    // ── Konfigüratör ─────────────────────────────────────
    defineField({
      name: 'isConfigurable',
      title: 'Custom Registry ile yapılandırılabilir mi?',
      type: 'boolean',
      initialValue: false,
    }),

    defineField({
      name: 'configuratorCollection',
      title: 'Configurator Collection',
      description: 'Bu ürün "Customize" ile açıldığında Custom Registry\'de hangi koleksiyon yüklenecek?',
      type: 'reference',
      to: [{ type: 'collection' }],
      hidden: ({ document }) => !document?.isConfigurable,
      validation: (R) =>
        R.custom((value, context) => {
          const doc = context.document as { isConfigurable?: boolean } | undefined
          if (doc?.isConfigurable && !value) return 'Configurable ürünler için koleksiyon seçilmeli'
          return true
        }),
    }),

    defineField({
      name: 'configuratorParts',
      title: 'Customize — Preset Parça/Malzeme Kombinasyonu',
      description:
        '"Customize" butonuna basıldığında Custom Registry\'de otomatik yüklenecek tam kombinasyon. Bir "Base", bir "Head" ve istenen sayıda "Body" katmanı ekleyin — Body katmanları buradaki SIRAYLA (yukarıdan aşağıya) istiflenir.',
      type: 'array',
      hidden: ({ document }) => !document?.isConfigurable,
      validation: (R) =>
        R.custom((value, context) => {
          const doc = context.document as { isConfigurable?: boolean } | undefined
          if (!doc?.isConfigurable) return true
          const entries = (value ?? []) as Array<{ slotType?: string }>
          if (!entries.some((e) => e.slotType === 'base')) return 'Bir "Base" satırı eklenmeli'
          if (!entries.some((e) => e.slotType === 'head')) return 'Bir "Head" satırı eklenmeli'
          return true
        }),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'configuratorPartEntry',
          fields: [
            defineField({
              name: 'slotType',
              title: 'Slot',
              type: 'string',
              options: {
                list: [
                  { title: 'Base (Taban)', value: 'base' },
                  { title: 'Body (Gövde katmanı)', value: 'body' },
                  { title: 'Head (Başlık)', value: 'head' },
                ],
                layout: 'radio',
              },
              validation: (R) => R.required(),
            }),
            defineField({
              name: 'part',
              title: 'Lamp Part',
              type: 'reference',
              to: [{ type: 'lampPart' }],
              options: {
                filter: ({ document }) => {
                  const collectionId = (document as { configuratorCollection?: { _ref?: string } })
                    ?.configuratorCollection?._ref
                  if (!collectionId) return { filter: '' }
                  return { filter: '$collectionId in collections[]._ref', params: { collectionId } }
                },
              },
              validation: (R) => R.required(),
            }),
            defineField({
              name: 'material',
              title: 'Material',
              type: 'reference',
              to: [{ type: 'material' }],
              options: {
                filter: ({ parent }) => {
                  const partId = (parent as { part?: { _ref?: string } })?.part?._ref
                  if (!partId) return { filter: '' }
                  return {
                    filter: '_id in *[_type == "lampPart" && _id == $partId][0].materials[]._ref',
                    params: { partId },
                  }
                },
              },
              validation: (R) => R.required(),
            }),
          ],
          preview: {
            select: { slotType: 'slotType', partRef: 'part._ref', materialRef: 'material._ref' },
            prepare({ slotType, partRef, materialRef }) {
              return {
                title: `[${(slotType ?? '?').toUpperCase()}]`,
                subtitle: `part: ${partRef ? partRef.slice(0, 8) : '—'}… / material: ${materialRef ? materialRef.slice(0, 8) : '—'}…`,
              }
            },
          },
        }),
      ],
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

    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
  ],

  preview: {
    select: {
      registryNo: 'registryNo',
      name: 'name',
      status: 'status',
      media: 'images.0',
    },
    prepare({ registryNo, name, status, media }) {
      const nameStr = Array.isArray(name)
        ? (name.find((n: { locale: string }) => n.locale === 'en')?.value ?? name[0]?.value ?? '—')
        : '—'
      return {
        title: `[${registryNo ?? '???'}] ${nameStr}`,
        subtitle: status ?? 'draft',
        media,
      }
    },
  },

  orderings: [
    {
      title: 'Registry No. Asc',
      name: 'registryNoAsc',
      by: [{ field: 'registryNo', direction: 'asc' }],
    },
    {
      title: 'Published (Newest)',
      name: 'publishedDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
  ],
})
