import { defineField, defineType, defineArrayMember } from 'sanity'
import { localizedStringField } from './localeHelper'

export const lampPartSchema = defineType({
  name: 'lampPart',
  title: 'Lamp Part (Configurator)',
  type: 'document',

  fields: [
    defineField({
      name: 'partId',
      title: 'Part ID',
      description: 'Kod içinde referans için benzersiz ID. Örn: "totem-base-concrete"',
      type: 'slug',
      options: { source: 'partId', maxLength: 96 },
      validation: (R) => R.required(),
    }),

    localizedStringField({ name: 'name', title: 'Part Name', required: true }),
    localizedStringField({ name: 'description', title: 'Description' }),

    // ── Yapısal sınıflandırma ─────────────────────────────
    defineField({
      name: 'slotType',
      title: 'Slot Type',
      description: 'Bu parça lambanın neresine gider?',
      type: 'string',
      options: {
        list: [
          { title: 'Base (Taban)', value: 'base' },
          { title: 'Body (Gövde)', value: 'body' },
          { title: 'Head (Başlık)', value: 'head' },
        ],
        layout: 'radio',
      },
      validation: (R) => R.required(),
    }),

    defineField({
      name: 'collections',
      title: 'Collections',
      description: 'Bu parça hangi koleksiyon(lar)a ait? Birden fazla koleksiyonda kullanılabilir.',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'collection' }] })],
      validation: (R) => R.required().min(1),
    }),

    // ── 3D Model ─────────────────────────────────────────
    defineField({
      name: 'modelFile',
      title: 'STL / GLB Model File',
      description: 'Sanity asset olarak yüklenen 3D model dosyası',
      type: 'file',
      options: { accept: '.stl,.glb,.gltf' },
      validation: (R) => R.required(),
    }),

    defineField({
      name: 'thumbnail',
      title: 'Part Thumbnail',
      description: 'Parçanın 3D yazılımından (Blender vb.) alınmış önizleme görseli. Konfigüratör arayüzünde parça seçim grid\'inde gösterilir.',
      type: 'image',
      options: { hotspot: true },
    }),

    defineField({
      name: 'dimensions',
      title: 'Dimensions (mm) — Referans Amaçlı',
      description: 'Bilgi amaçlı kayıt. Konfigüratördeki dikey istifleme artık STL/GLB dosyasının GERÇEK boyutunu otomatik ölçerek hesaplanıyor, bu alana bağımlı değil.',
      type: 'object',
      fields: [
        defineField({ name: 'width', title: 'Width (mm)', type: 'number' }),
        defineField({ name: 'height', title: 'Height (mm)', type: 'number' }),
        defineField({ name: 'depth', title: 'Depth (mm)', type: 'number' }),
      ],
    }),

    // ── Malzemeler ────────────────────────────────────────
    defineField({
      name: 'materials',
      title: 'Available Materials',
      description: 'Studio > Materials altında bir kere tanımlanan malzemelerden bu parça için geçerli olanları seçin.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: 'material' }],
        }),
      ],
      validation: (R) => R.required().min(1),
    }),

    // ── Fiyat ────────────────────────────────────────────
    defineField({
      name: 'basePriceTRY',
      title: 'Base Price — TRY (₺)',
      description: 'Bu parçanın temel fiyatı (TRY). Malzeme modifier üstüne eklenir.',
      type: 'number',
      validation: (R) => R.required().min(0),
    }),

    defineField({
      name: 'basePriceUSD',
      title: 'Base Price — USD ($)',
      description: 'Bu parçanın temel fiyatı (USD). Malzeme modifier üstüne eklenir.',
      type: 'number',
      validation: (R) => R.required().min(0),
    }),

    defineField({
      name: 'sortOrder',
      title: 'Sort Order (konfigüratörde sıralama)',
      type: 'number',
      initialValue: 0,
    }),
  ],

  preview: {
    select: {
      partId: 'partId.current',
      name: 'name',
      slotType: 'slotType',
    },
    prepare({ partId, name, slotType }) {
      const nameStr = Array.isArray(name)
        ? (name.find((n: { locale: string }) => n.locale === 'en')?.value ?? name[0]?.value ?? '—')
        : '—'
      return {
        title: nameStr,
        subtitle: `[${slotType?.toUpperCase() ?? '?'}] ${partId ?? ''}`,
      }
    },
  },
})