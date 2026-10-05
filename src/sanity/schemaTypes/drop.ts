import { defineField, defineType } from 'sanity'
import { localizedStringField } from './localeHelper'

export const dropSchema = defineType({
  name: 'drop',
  title: 'Drop',
  type: 'document',

  fields: [
    defineField({
      name: 'active',
      title: 'Aktif',
      description:
        'KAPALI (pasif) ise bu Drop sitede HİÇBİR YERDE görünmez — anasayfadaki Drop satırından ve bu Drop\'a göre filtrelenen Registry görünümünden kaybolur. Bu Drop\'a bağlı ürünler kendi "Aktif" durumlarına göre ayrı ayrı görünürlüğünü korur (bu alan sadece Drop\'un KENDİSİNİ, ürünlerini değil gizler).',
      type: 'boolean',
      initialValue: true,
    }),
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

    // ── Planlanan Satış Adedi ──────────────────────────────
    // Bu Drop'tan TOPLAM kaç adet satılacağı — Registry Number'ın paydası
    // ("003/050" formatındaki 050 kısmı) ve stok kontrolü (Custom
    // Registry'de checkout anında "stok tükendi" hatası) bu değere göre
    // hesaplanır. Bu Drop'a bağlı ürün sayısı (product.drop referansı)
    // bu sayıya ulaştığında, o Drop için checkout engellenir — konfigüratör
    // kendisi kapanmaz, sadece ödeme adımında hata gösterilir.
    defineField({
      name: 'plannedQuantity',
      title: 'Planlanan Satış Adedi',
      description:
        'Bu Drop\'tan toplam kaç adet satılacağı (Registry Number\'ın paydası — "003/050"teki 050). Bu sayıya ulaşınca Custom Registry\'de bu koleksiyon için checkout "stok tükendi" hatası verir (tasarlama ekranı kapanmaz, sadece ödeme engellenir).',
      type: 'number',
      validation: (R) => R.required().integer().positive(),
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
