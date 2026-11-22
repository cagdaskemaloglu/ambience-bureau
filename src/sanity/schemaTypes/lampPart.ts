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

    // ── Sabit parça ─────────────────────────────────────────
    // Ör. sarkıttaki kablo: 3D'de her zaman görünür ama müşterinin seçim
    // listesinde YOKTUR ve rengi değiştirilemez. Koleksiyondaki her
    // tasarıma otomatik eklenir; siparişe ayrıca kaydedilmez.
    defineField({
      name: 'isFixed',
      title: 'Sabit parça (müşteriye gösterilmez)',
      description:
        'Açık: bu parça koleksiyondaki her tasarımda otomatik görünür, seçim listesinde çıkmaz, rengi değiştirilemez (ör. sarkıt kablosu). Fiyat girerseniz toplam fiyata eklenir.',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'fixedColor',
      title: 'Sabit renk',
      description: 'Hex, örn. #1A1A1A. Sadece sabit parçalarda.',
      type: 'string',
      initialValue: '#1A1A1A',
      hidden: ({ document }) => !document?.isFixed,
      validation: (R) => R.regex(/^#[0-9a-fA-F]{6}$/, { name: 'hex' }),
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
      hidden: ({ document }) => Boolean(document?.isFixed),
      validation: (R) =>
        R.custom((value, context) => {
          const fixed = (context.document as { isFixed?: boolean } | undefined)?.isFixed
          if (fixed) return true
          return Array.isArray(value) && value.length > 0 ? true : 'En az bir malzeme seçin.'
        }),
    }),

    // ── Blender konumu düzeltmesi (sadece "Blender konumu" koleksiyonları) ──
    defineField({
      name: 'offsetMm',
      title: 'Ofset (mm) — sadece ortak orijinle aktarılmadıysa',
      description: 'Üst üste yerleşimde YOK SAYILIR.',
      type: 'object',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: 'x', type: 'number', initialValue: 0 }),
        defineField({ name: 'y', type: 'number', initialValue: 0 }),
        defineField({ name: 'z', type: 'number', initialValue: 0 }),
      ],
    }),
    defineField({
      name: 'rotationDeg',
      title: 'Rotasyon (derece)',
      description: 'Üst üste yerleşimde YOK SAYILIR.',
      type: 'object',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: 'x', type: 'number', initialValue: 0 }),
        defineField({ name: 'y', type: 'number', initialValue: 0 }),
        defineField({ name: 'z', type: 'number', initialValue: 0 }),
      ],
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
      isFixed: 'isFixed',
    },
    prepare({ partId, name, slotType, isFixed }) {
      const nameStr = Array.isArray(name)
        ? (name.find((n: { locale: string }) => n.locale === 'en')?.value ?? name[0]?.value ?? '—')
        : '—'
      return {
        title: nameStr,
        subtitle: `[${slotType?.toUpperCase() ?? '?'}${isFixed ? ' · SABİT' : ''}] ${partId ?? ''}`,
      }
    },
  },
})