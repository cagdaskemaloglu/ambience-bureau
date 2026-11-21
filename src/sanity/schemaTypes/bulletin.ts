import { defineArrayMember, defineField, defineType } from 'sanity'
import { localizedStringField } from './localeHelper'

/**
 * Büro Bülteni — anasayfadaki duyuru panelinde sayfa sayfa gösterilen
 * kısa duyurular + /bulletin arşiv sayfası. Uzun yazılar için Arşiv
 * (post) kullanılır; bülten bir Arşiv yazısına link verebilir.
 * Bkz. claude/DESIGN.md → "Büro Bülteni".
 */
export const BULLETIN_KINDS = [
  { value: 'drop', tr: 'Drop', en: 'Drop' },
  { value: 'inventory', tr: 'Envanter', en: 'Inventory' },
  { value: 'bureau', tr: 'Büro', en: 'Bureau' },
  { value: 'notice', tr: 'Duyuru', en: 'Notice' },
] as const

export const bulletinSchema = defineType({
  name: 'bulletin',
  title: 'Bülten (Duyuru)',
  type: 'document',
  fields: [
    defineField({
      name: 'bulletinNo',
      title: 'Bülten No',
      description: 'Sıra numarası — panelde "BÜLTEN 014" olarak görünür. Her yeni bültende bir artırın.',
      type: 'number',
      validation: (R) => R.required().integer().positive(),
    }),
    defineField({
      name: 'kind',
      title: 'Tür',
      type: 'string',
      options: {
        list: BULLETIN_KINDS.map((k) => ({ title: `${k.tr} / ${k.en}`, value: k.value })),
        layout: 'radio',
      },
      initialValue: 'notice',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Yayın Tarihi',
      description: 'Bu tarihten ÖNCE bülten hiçbir yerde görünmez (ileri tarihli duyuru planlanabilir).',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (R) => R.required(),
    }),
    localizedStringField({ name: 'title', title: 'Başlık (kısa)', required: true }),
    localizedStringField({
      name: 'text',
      title: 'Metin (opsiyonel, 1-2 cümle)',
      description: 'Panelde başlığın altında görünür. Kısa tutun; uzun içerik için bir Arşiv yazısına link verin.',
    }),
    // ── Bülten satırları (etiket → değer) ──────────────────────
    // Panelde canlı durum sayfasıyla AYNI düzende (sol: etiket, sağ: değer)
    // gösterilir. Link "Drop" seçiliyse o drop'un satırları (tahsis, kalan
    // adet, durum) OTOMATİK eklenir — burada elle yazmaya gerek yok;
    // buradakiler onların altına eklenir.
    defineField({
      name: 'rows',
      title: 'Satırlar (etiket → değer)',
      description: 'Örn. "Teslim tarihi → 15.12.2026". Drop linki verildiyse tahsis/kalan adet/durum satırları otomatik gelir.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'bulletinRow',
          fields: [
            localizedStringField({ name: 'label', title: 'Etiket', required: true }),
            localizedStringField({ name: 'value', title: 'Değer', required: true }),
          ],
          preview: {
            select: { label: 'label', value: 'value' },
            prepare({ label, value }) {
              const pick = (v: unknown) =>
                Array.isArray(v) ? ((v as Array<{ locale: string; value: string }>).find((x) => x.locale === 'tr')?.value ?? '—') : '—'
              return { title: `${pick(label)} → ${pick(value)}` }
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'linkType',
      title: 'Link',
      type: 'string',
      options: {
        list: [
          { title: 'Yok', value: 'none' },
          { title: 'Drop', value: 'drop' },
          { title: 'Ürün', value: 'product' },
          { title: 'Arşiv yazısı', value: 'post' },
          { title: 'Site içi yol (ör. /custom-registry)', value: 'path' },
        ],
      },
      initialValue: 'none',
    }),
    defineField({
      name: 'linkDrop',
      title: 'Drop',
      type: 'reference',
      to: [{ type: 'drop' }],
      hidden: ({ document }) => document?.linkType !== 'drop',
    }),
    defineField({
      name: 'linkProduct',
      title: 'Ürün',
      type: 'reference',
      to: [{ type: 'product' }],
      hidden: ({ document }) => document?.linkType !== 'product',
    }),
    defineField({
      name: 'linkPost',
      title: 'Arşiv yazısı',
      type: 'reference',
      to: [{ type: 'post' }],
      hidden: ({ document }) => document?.linkType !== 'post',
    }),
    defineField({
      name: 'linkPath',
      title: 'Site içi yol',
      description: 'Dil ön eki OLMADAN, "/" ile başlayan yol. Örn: /registry?mode=standing',
      type: 'string',
      hidden: ({ document }) => document?.linkType !== 'path',
      validation: (R) =>
        R.custom((v) => (v === undefined || v === '' || String(v).startsWith('/') ? true : '"/" ile başlamalı')),
    }),
    defineField({
      name: 'showInPanel',
      title: 'Anasayfa panelinde göster',
      description: 'Kapalıysa bülten sadece /bulletin arşivinde listelenir.',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'pinned',
      title: 'Sabitle',
      description: 'Sabitlenen bültenler panelde canlı durum sayfasından hemen sonra, ilk sırada gösterilir.',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: { no: 'bulletinNo', title: 'title', kind: 'kind', date: 'publishedAt', pinned: 'pinned' },
    prepare({ no, title, kind, date, pinned }) {
      const t = Array.isArray(title)
        ? (title.find((x: { locale: string }) => x.locale === 'tr')?.value ?? title[0]?.value ?? '—')
        : '—'
      return {
        title: `${pinned ? '📌 ' : ''}BÜLTEN ${String(no ?? 0).padStart(3, '0')} · ${t}`,
        subtitle: `${kind ?? ''} · ${date ? String(date).slice(0, 10) : 'tarihsiz'}`,
      }
    },
  },
  orderings: [
    { title: 'Bülten No (yeni → eski)', name: 'noDesc', by: [{ field: 'bulletinNo', direction: 'desc' }] },
  ],
})
