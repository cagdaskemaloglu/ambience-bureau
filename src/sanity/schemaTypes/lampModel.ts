import { defineField, defineType, defineArrayMember } from 'sanity'
import { localizedStringField } from './localeHelper'

/**
 * Montajlı Model — sarkıt, aplik, masa lambası gibi KENDİ PARÇA SETİYLE
 * gelen ürünler. Bir model 1, 2, 3… parçadan oluşabilir; müşteri önce
 * modeli seçer, sonra modelin her (sabit olmayan) parçasının rengini
 * AYRI AYRI seçer. Parçalar normal "Lamp Part" belgeleridir (STL burada,
 * "Parçalar" listesinden "Create new" ile yüklenir); sipariş/üretim akışı
 * parça kimlikleri (partId) üzerinden aynen çalışır.
 *
 * Sadece "3D Yerleşim: Montajlı model" seçili koleksiyonlarda kullanılır.
 */
export const lampModelSchema = defineType({
  name: 'lampModel',
  title: 'Montajlı Model',
  type: 'document',

  fields: [
    defineField({
      name: 'active',
      title: 'Aktif',
      description: 'Kapalıysa model konfigüratörde listelenmez.',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'key',
      title: 'Model Key',
      description: 'Kod içinde referans için benzersiz anahtar. Örn: "sarkit-s02"',
      type: 'slug',
      options: { source: 'key', maxLength: 60 },
      validation: (R) => R.required(),
    }),
    localizedStringField({ name: 'name', title: 'Model Adı', required: true }),

    defineField({
      name: 'collection',
      title: 'Koleksiyon',
      description: '"3D Yerleşim: Montajlı model" seçili bir koleksiyon.',
      type: 'reference',
      to: [{ type: 'collection' }],
      validation: (R) => R.required(),
    }),

    defineField({
      name: 'parts',
      title: 'Parçalar',
      description:
        'Modelin TÜM parçaları (1, 2, 3…). Her satır bir Lamp Part belgesi: "Add item" → "Create new" ile STL\'i yükleyin. Parçanın adı müşteriye sekme/başlık olarak gösterilir (örn. "Gövde", "Kapak"). Renk seçilmeyecek parçaları (kablo, tavan göbeği) parçada "Sabit parça" ile işaretleyin. Işığın parlayacağı parçada "Işık yayar"ı açın. Tüm STL\'leri Blender\'da ORTAK ORİJİNLE ve Y yukarı dışa aktarın.',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'lampPart' }] })],
      validation: (R) => R.required().min(1),
    }),

    defineField({
      name: 'images',
      title: 'Model Görselleri',
      description:
        'İlki model seçim kartında gösterilir; tümü, model seçilince panelde küçük resimler olarak çıkar ve tıklanınca büyür. Sürükleyerek sıralayabilirsiniz.',
      type: 'array',
      of: [defineArrayMember({ type: 'image', options: { hotspot: true } })],
      options: { layout: 'grid' },
    }),
    // Eski tek görsel alanı — sadece doluysa görünür (yenisi: Model Görselleri).
    defineField({
      name: 'thumbnail',
      title: 'Model Görseli (eski)',
      description: 'Bu görseli "Model Görselleri"ne taşıyıp buradan silebilirsiniz.',
      type: 'image',
      options: { hotspot: true },
      hidden: ({ document }) => !document?.thumbnail,
    }),

    defineField({
      name: 'sortOrder',
      title: 'Sort Order',
      type: 'number',
      initialValue: 0,
    }),
  ],

  preview: {
    select: { name: 'name', key: 'key.current', media: 'images.0', legacy: 'thumbnail' },
    prepare({ name, key, media, legacy }) {
      const nameStr = Array.isArray(name)
        ? (name.find((n: { locale: string }) => n.locale === 'tr')?.value ?? name[0]?.value ?? '—')
        : '—'
      return { title: nameStr, subtitle: key ?? '', media: media ?? legacy }
    },
  },
})
