import { defineField, defineType } from 'sanity'
import { localizedStringField } from './localeHelper'

export const dropSchema = defineType({
  name: 'drop',
  title: 'Drop',
  type: 'document',

  fields: [
    defineField({
      name: 'dropNo',
      title: 'Drop No',
      description: 'Örn: 001 — anasayfada "DROP-001" olarak görünür. Elle girilir, sıralamayla otomatik hesaplanmaz.',
      type: 'string',
      validation: (R) => R.required(),
    }),

    localizedStringField({ name: 'name', title: 'Drop Name', required: true }),

    defineField({
      name: 'collection',
      title: 'Custom Registry Collection',
      description:
        'OPSİYONEL — anasayfadaki "Oluştur" butonunun açacağı Custom Registry koleksiyonu. Boş bırakılırsa bu Drop\'taki ürünlerden birinin "Configurator Collection" değeri kullanılır; o da yoksa buton koleksiyon seçim ekranını açar.',
      type: 'reference',
      to: [{ type: 'collection' }],
    }),

    defineField({
      name: 'sortOrder',
      title: 'Sort Order',
      description: 'Anasayfada drop satırlarının sırasını belirler (küçük değer önce gelir).',
      type: 'number',
      initialValue: 0,
    }),
  ],

  preview: {
    select: { name: 'name', dropNo: 'dropNo' },
    prepare({ name, dropNo }) {
      const nameStr = Array.isArray(name)
        ? (name.find((n: { locale: string }) => n.locale === 'en')?.value ?? name[0]?.value ?? '—')
        : '—'
      return { title: `DROP-${dropNo ?? '???'} — ${nameStr}` }
    },
  },
})
