import { defineField, defineType } from 'sanity'
import { localizedStringField } from './localeHelper'

/**
 * Bağımsız/yeniden kullanılabilir malzeme kaydı. Önceden her lampPart
 * kendi `materials[]` dizisinde bu bilgiyi TEKRAR TEKRAR tanımlıyordu —
 * artık burada bir kere tanımlanıp, lampPart'lardan sadece REFERANS
 * olarak seçiliyor (bkz. lampPart.ts'teki `materials` alanı).
 */
export const materialSchema = defineType({
  name: 'material',
  title: 'Material (Reusable)',
  type: 'document',

  fields: [
    defineField({
      name: 'materialId',
      title: 'Material ID',
      description: 'Kod içinde referans için benzersiz ID. Örn: "translucent-green"',
      type: 'slug',
      options: { source: 'materialId', maxLength: 96 },
      validation: (R) => R.required(),
    }),

    localizedStringField({ name: 'label', title: 'Label (display name)', required: true }),

    defineField({
      name: 'color',
      title: 'Color (hex)',
      description: 'Hex renk kodu. Örn: #2A9D5C',
      type: 'string',
      validation: (R) =>
        R.required().regex(/^#[0-9A-Fa-f]{6}$/, 'Geçerli hex renk kodu giriniz'),
    }),

    // ── Yarı saydam filament özellikleri ───────────────────
    defineField({
      name: 'isTranslucent',
      title: 'Yarı Saydam Filament mi?',
      description: 'Bu malzeme yarı saydam bir filamentle mi basılıyor? (ışığı daha çok geçiren baskılar için işaretleyin)',
      type: 'boolean',
      initialValue: false,
    }),

    defineField({
      name: 'opacity',
      title: 'Işık Geçirgenliği — Opaklık (0–1)',
      description: '1 = tamamen opak (ışık geçirmez), düşük değer = daha çok ışık geçirir. Sadece "Yarı Saydam" işaretliyse anlamlıdır.',
      type: 'number',
      validation: (R) => R.min(0).max(1),
      initialValue: 0.6,
      hidden: ({ document }) => !document?.isTranslucent,
    }),

    defineField({
      name: 'roughness',
      title: 'Roughness (0–1)',
      type: 'number',
      validation: (R) => R.min(0).max(1),
      initialValue: 0.5,
    }),

    defineField({
      name: 'metalness',
      title: 'Metalness (0–1)',
      type: 'number',
      validation: (R) => R.min(0).max(1),
      initialValue: 0,
    }),

    defineField({
      name: 'priceModifierTRY',
      title: 'Price Modifier — TRY (₺)',
      description: 'Bu malzeme seçimi temel fiyata ne kadar ekler? 0 = fark yok',
      type: 'number',
      initialValue: 0,
    }),

    defineField({
      name: 'priceModifierUSD',
      title: 'Price Modifier — USD ($)',
      description: 'Bu malzeme seçimi temel fiyata ne kadar ekler (USD)? 0 = fark yok',
      type: 'number',
      initialValue: 0,
    }),

    defineField({
      name: 'thumbnail',
      title: 'Material Thumbnail',
      type: 'image',
    }),

    defineField({
      name: 'sortOrder',
      title: 'Sort Order (seçim listesinde sıralama)',
      type: 'number',
      initialValue: 0,
    }),
  ],

  orderings: [
    {
      title: 'Sort Order',
      name: 'sortOrderAsc',
      by: [{ field: 'sortOrder', direction: 'asc' }],
    },
  ],

  preview: {
    select: {
      materialId: 'materialId.current',
      label: 'label',
      color: 'color',
      isTranslucent: 'isTranslucent',
      media: 'thumbnail',
    },
    prepare({ materialId, label, color, isTranslucent, media }) {
      const labelStr = Array.isArray(label)
        ? (label.find((l: { locale: string }) => l.locale === 'en')?.value ?? label[0]?.value ?? '—')
        : '—'
      return {
        title: labelStr,
        subtitle: `${materialId ?? ''} — ${color ?? ''}${isTranslucent ? ' — Yarı Saydam' : ''}`,
        media,
      }
    },
  },
})
