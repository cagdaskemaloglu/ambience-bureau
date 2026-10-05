import { defineField, defineType, defineArrayMember } from 'sanity'
import { localizedStringField, localizedBlockField } from './localeHelper'
import { RegistryNoHint } from '../components/RegistryNoHint'

export const productSchema = defineType({
  name: 'product',
  title: 'Product (Object Registry)',
  type: 'document',

  fields: [
    defineField({
      name: 'active',
      title: 'Aktif',
      description:
        'KAPALI (pasif) ise bu ürün sitede HİÇBİR YERDE görünmez — Registry listesinden, Drop satırından, ilgili ürünlerden ve ürünün kendi detay sayfasından (doğrudan linkle bile) kaybolur. Sitemap\'ten de çıkar. Bu ürünü daha önce satın almış bir müşterinin sipariş/kimlik (dossier) sayfası ETKİLENMEZ — o ayrı bir kayıt.',
      type: 'boolean',
      initialValue: true,
    }),
    // ── Kimlik / Registry ────────────────────────────────
    defineField({
      name: 'registryNo',
      title: 'Registry Number',
      description:
        'Örn: 001/050 — seri numara / toplam adet. Hâlâ ELLE girilir; aşağıdaki Drop\'u seçtiğinizde o Drop için "şu an sırada ne var" diye bir ipucu belirir. (Satın alma sonrası kod tarafından otomatik oluşturulan ürünlerde bu alan zaten programatik dolduruluyor.)',
      type: 'string',
      validation: (R) => R.required(),
      components: { field: RegistryNoHint },
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
          // Custom Registry üzerinden tasarlanıp SATIN ALINMIŞ, tek bir
          // müşteriye ait belge. "Decommissioned"tan farkı: bu durum
          // "üretimden kaldırıldı" değil, "bu adet artık birinin" anlamına
          // gelir. Normalde kod tarafından (satın alma sonrası) otomatik
          // atanır; admin elle de seçebilir ama bu durumda aşağıdaki
          // "Sahip (Kullanıcı ID)" alanının da doldurulması gerekir.
          { title: '◆ Owned (Sold via Custom Registry)', value: 'owned' },
        ],
        layout: 'radio',
      },
      initialValue: 'certified',
      validation: (R) => R.required(),
    }),

    // ── Sahiplik (SADECE status: "owned" iken anlamlı) ────
    // Üçü birlikte çalışır: ownerDisplayName + ownerCity her zaman
    // gösterilir (üye VEYA misafir fark etmeksizin — ikisi de aynı
    // sansürlü formatta: "Ça*** KE***", bkz. src/lib/nameCensor.ts).
    // ownerUserId İSE SADECE gerçek bir üye hesabı varsa dolar ve
    // SADECE profil sayfasına (Faz 3) tıklanabilir link vermek için
    // kullanılır — boşsa kart yine görünür, sadece link yok.
    defineField({
      name: 'ownerDisplayName',
      title: 'Sahip — Görünen Ad (sansürlü)',
      description:
        'SADECE Registry Status "Owned" iken doldurulur. Registry kartında görünecek sansürlü isim — örn. "Ça*** KE***". Satın alma sonrası kod tarafından otomatik dolar (üye: gerçek adının sansürlüsü; misafir: rastgele üretilmiş bir isim). Admin elle bir ürünü "satıldı" işaretlerken de buraya istediği bir görünen ad yazabilir — gerçek bir isim olmak zorunda değil.',
      type: 'string',
      hidden: ({ document }) => document?.status !== 'owned',
      validation: (R) =>
        R.custom((value, context) => {
          const status = (context.document as { status?: string } | undefined)?.status
          if (status === 'owned' && !value) {
            return 'Registry Status "Owned" iken Sahip — Görünen Ad zorunludur.'
          }
          return true
        }),
    }),
    defineField({
      name: 'ownerCity',
      title: 'Sahip — Şehir',
      description: 'SADECE Registry Status "Owned" iken doldurulur. Örn. "Mersin". Sipariş adresinden otomatik gelir; admin elle de yazabilir.',
      type: 'string',
      hidden: ({ document }) => document?.status !== 'owned',
    }),
    defineField({
      name: 'ownerUserId',
      title: 'Sahip — Kullanıcı ID (opsiyonel)',
      description:
        'OPSİYONEL — sadece bu ürünü satın alan GERÇEK bir üye hesabı varsa (misafir siparişlerinde boş kalır). Supabase\'teki auth.users/profiles tablosundaki kullanıcı UUID\'si. Doluysa Registry kartındaki isim, o kullanıcının herkese açık profil sayfasına (ürün arşivi) link verir; boşsa isim sadece düz metin olarak görünür, link olmaz.',
      type: 'string',
      hidden: ({ document }) => document?.status !== 'owned',
    }),

    // ── Çok Dilli İsim & Açıklama ────────────────────────
    localizedStringField({ name: 'name', title: 'Object Name', required: true }),
    localizedStringField({ name: 'shortDescription', title: 'Short Description (Card)' }),
    localizedBlockField({ name: 'description', title: 'Full Description' }),

    // ── Görsel ───────────────────────────────────────────
    defineField({
      name: 'images',
      title: 'Images',
      description:
        'SIRA ÖNEMLİ: 1. fotoğraf (site aydınlık moddayken) ve 2. fotoğraf ' +
        '(site karanlık moddayken) ürün kartlarında gösterilir. 2. fotoğraf ' +
        'girilmezse kartlar her modda 1. fotoğrafı kullanmaya devam eder. ' +
        'Ürün detay sayfasındaki galeri tüm fotoğrafları (sırayla) gösterir.',
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

    // ── İndirim (opsiyonel) ────────────────────────────────
    // İkisi de OPSİYONEL. Herhangi biri doldurulursa (0'dan büyük ve
    // ilgili normal fiyattan düşükse) ürün kartında ve ürün sayfasında
    // eski fiyat üstü çizili, yeni fiyat yanında gösterilir. Boş
    // bırakılırsa indirim özelliği o para birimi için devre dışı kalır.
    defineField({
      name: 'discountPriceTRY',
      title: 'İndirimli Fiyat — TRY (₺)',
      description:
        'OPSİYONEL. Doldurulursa kartlarda normal fiyatın (priceTRY) üstü çizilip bu fiyat gösterilir. Boş = indirim yok.',
      type: 'number',
      validation: (R) =>
        R.positive().custom((value, context) => {
          if (value === undefined) return true
          const regular = (context.document as { priceTRY?: number } | undefined)?.priceTRY
          if (typeof regular === 'number' && value >= regular) {
            return 'İndirimli fiyat, normal fiyattan (TRY) düşük olmalı'
          }
          return true
        }),
    }),

    defineField({
      name: 'discountPriceUSD',
      title: 'İndirimli Fiyat — USD ($)',
      description:
        'OPSİYONEL. Doldurulursa kartlarda normal fiyatın (priceUSD) üstü çizilip bu fiyat gösterilir. Boş = indirim yok.',
      type: 'number',
      validation: (R) =>
        R.positive().custom((value, context) => {
          if (value === undefined) return true
          const regular = (context.document as { priceUSD?: number } | undefined)?.priceUSD
          if (typeof regular === 'number' && value >= regular) {
            return 'İndirimli fiyat, normal fiyattan (USD) düşük olmalı'
          }
          return true
        }),
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
