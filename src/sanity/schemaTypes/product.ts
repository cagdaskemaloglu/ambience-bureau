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
      title: 'Configurator Collection Key',
      description: 'Konfigüratörde hangi parça setini kullanacak? (örn: "totem", "waves")',
      type: 'string',
      hidden: ({ document }) => !document?.isConfigurable,
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
