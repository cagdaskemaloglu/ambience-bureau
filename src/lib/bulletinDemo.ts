/**
 * src/lib/bulletinDemo.ts
 *
 * SADECE LOCAL ÖNİZLEME İÇİN örnek bültenler. Sunucu ortam değişkeni
 * `BULLETIN_DEMO=1` AYARLANMADIKÇA hiçbir şey yapmaz — üretimde (Vercel)
 * bu değişken tanımlı değil, gerçek Sanity bültenleri aynen döner.
 * Her örnek başlık "(örnek)" etiketi taşır ki gerçek içerikle karışmasın.
 *
 * Sanity'ye gerçek bültenler girildikten sonra bu dosya silinebilir.
 */
import type { Bulletin, Collection, LampPart, ProductCard } from '@/types'

export const DEMO_ENABLED = process.env.BULLETIN_DEMO === '1'

const DAY = 24 * 60 * 60 * 1000

type DemoDrop = NonNullable<Bulletin['drop']>

function demoBulletins(drops: DemoDrop[]): Bulletin[] {
  const now = Date.now()
  const out: Bulletin[] = []
  // En yeni bülten: bir ÖNCEKİ drop'un durum özeti (gerçek drop verisiyle).
  // Panelde canlı durum sayfasından hemen sonra gelir.
  const previousDrop = drops[1] ?? drops[0]
  if (previousDrop) {
    out.push({
      _id: 'demo-4',
      bulletinNo: 4,
      kind: 'drop',
      publishedAt: new Date(now - 1 * DAY).toISOString(),
      title: [
        { locale: 'tr', value: `DROP-${previousDrop.dropNo} durum raporu (örnek)` },
        { locale: 'en', value: `DROP-${previousDrop.dropNo} status report (sample)` },
      ],
      drop: previousDrop,
      rows: [
        {
          label: [
            { locale: 'tr', value: 'Sertifika' },
            { locale: 'en', value: 'Certificate' },
          ],
          value: [
            { locale: 'tr', value: 'Her adette numaralı' },
            { locale: 'en', value: 'Numbered, every unit' },
          ],
        },
      ],
      href: `/#drop-${previousDrop.dropNo}`,
    })
  }
  out.push(
    {
      _id: 'demo-3',
      bulletinNo: 3,
      kind: 'inventory',
      publishedAt: new Date(now - 6 * DAY).toISOString(),
      title: [
        { locale: 'tr', value: 'Daimi Envanter kayda açılıyor (örnek)' },
        { locale: 'en', value: 'Standing Inventory opens (sample)' },
      ],
      rows: [
        {
          label: [{ locale: 'tr', value: 'Sınıflar' }, { locale: 'en', value: 'Classes' }],
          value: [
            { locale: 'tr', value: 'Lambader, Avize, Aplik, Masa Lambası, Sarkıt' },
            { locale: 'en', value: 'Floor, Chandelier, Sconce, Table, Pendant' },
          ],
        },
        {
          label: [{ locale: 'tr', value: 'Açılış' }, { locale: 'en', value: 'Opening' }],
          value: [{ locale: 'tr', value: 'Aralık 2026' }, { locale: 'en', value: 'December 2026' }],
        },
        {
          label: [{ locale: 'tr', value: 'Satış' }, { locale: 'en', value: 'Sale' }],
          value: [{ locale: 'tr', value: 'Sürekli, stoklu' }, { locale: 'en', value: 'Ongoing, in stock' }],
        },
      ],
      href: '/#daimi-envanter',
    },
    {
      _id: 'demo-2',
      bulletinNo: 2,
      kind: 'bureau',
      publishedAt: new Date(now - 14 * DAY).toISOString(),
      title: [
        { locale: 'tr', value: 'Kontrol Protokolü güncellendi (örnek)' },
        { locale: 'en', value: 'Control Protocol updated (sample)' },
      ],
      rows: [
        {
          label: [{ locale: 'tr', value: 'Uygulama' }, { locale: 'en', value: 'App' }],
          value: [{ locale: 'tr', value: 'Sürüm 2.0' }, { locale: 'en', value: 'Version 2.0' }],
        },
        {
          label: [{ locale: 'tr', value: 'Yenilik' }, { locale: 'en', value: 'New' }],
          value: [{ locale: 'tr', value: 'Demo modu, çift kanal' }, { locale: 'en', value: 'Demo mode, dual channel' }],
        },
      ],
      href: '/control-protocol',
    },
    {
      _id: 'demo-1',
      bulletinNo: 1,
      kind: 'notice',
      publishedAt: new Date(now - 30 * DAY).toISOString(),
      title: [
        { locale: 'tr', value: 'Yılbaşı kargo takvimi (örnek)' },
        { locale: 'en', value: 'Holiday shipping schedule (sample)' },
      ],
      rows: [
        {
          label: [{ locale: 'tr', value: 'Son sipariş' }, { locale: 'en', value: 'Last order' }],
          value: [{ locale: 'tr', value: '20.12.2026' }, { locale: 'en', value: '20.12.2026' }],
        },
        {
          label: [{ locale: 'tr', value: 'Kargo başlar' }, { locale: 'en', value: 'Shipping resumes' }],
          value: [{ locale: 'tr', value: '02.01.2027' }, { locale: 'en', value: '02.01.2027' }],
        },
      ],
      href: null,
    }
  )
  return out
}

/** Gerçek bülten yoksa ve demo açıksa örnekleri döndürür; aksi halde girdiyi aynen döndürür. */
export function withDemoBulletins(real: Bulletin[], drops: DemoDrop[] = []): Bulletin[] {
  if (!DEMO_ENABLED || real.length > 0) return real
  return demoBulletins(drops)
}

// ── Daimi Envanter yer tutucuları (SADECE local önizleme) ─────────────
// Gerçek Daimi Envanter ürünü yoksa, sarkıt ve masa lambası sınıflarına
// "(örnek)" etiketli yer tutucular koyar. Görseller mevcut ürünlerden
// ödünç alınır; linkleri gerçek ürün sayfasına gider.

export function withDemoStanding(real: ProductCard[], source: ProductCard[]): ProductCard[] {
  if (!DEMO_ENABLED || real.length > 0 || source.length === 0) return real
  const pick = (i: number) => source[i % source.length]
  const make = (
    i: number,
    category: ProductCard['category'],
    code: string,
    tr: string,
    en: string,
    priceTRY: number,
    stock: number | null
  ): ProductCard => ({
    ...pick(i),
    _id: `demo-standing-${code}`,
    saleMode: 'standing',
    status: 'certified',
    category,
    registryNo: code,
    stockQuantity: stock,
    dropNo: null,
    isConfigurable: false,
    priceTRY,
    priceUSD: Math.round(priceTRY / 40),
    discountPriceTRY: undefined,
    discountPriceUSD: undefined,
    name: [
      { locale: 'tr', value: `${tr} (örnek)` },
      { locale: 'en', value: `${en} (sample)` },
    ],
  })
  return [
    make(0, 'pendant', 'ENV-P-001', 'Sarkıt P-01', 'Pendant P-01', 3890, 12),
    make(1, 'pendant', 'ENV-P-002', 'Sarkıt P-02', 'Pendant P-02', 4290, 2),
    make(2, 'desk', 'ENV-D-001', 'Masa Lambası D-01', 'Table Lamp D-01', 2490, null),
    make(3, 'desk', 'ENV-D-002', 'Masa Lambası D-02', 'Table Lamp D-02', 2790, 0),
  ]
}

// ── Konfigüratör: "Blender konumu" örnek koleksiyonları (SADECE local) ──
// Sanity'de henüz masa lambası/sarkıt koleksiyonu yokken yeni yerleşimi
// denemek için: mevcut bir koleksiyonun parça modelleri ödünç alınır.
// Parçalar ortak orijinle aktarılmadığı için konumlar ofsetle taklit edilir.

export type DemoCollection = Collection & { demoParts?: LampPart[] }

export function buildDemoCollections(source: LampPart[]): DemoCollection[] {
  if (!DEMO_ENABLED || source.length === 0) return []
  const bases = source.filter((p) => p.slotType === 'base')
  const bodies = source.filter((p) => p.slotType === 'body')
  const heads = source.filter((p) => p.slotType === 'head')
  if (heads.length === 0 || bodies.length === 0) return []

  const name = (tr: string, en: string): Collection['name'] => [
    { locale: 'tr', value: tr },
    { locale: 'en', value: en },
  ]

  // Örnek Sarkıt: sabit "kablo" (bir gövde modeli, koyu renk, yukarıda) +
  // seçilebilir başlıklar. Taban/gövde sekmesi yok, model tavandan asılı.
  const cable: LampPart = {
    ...bodies[0],
    _id: 'demo-cable',
    partId: 'demo-cable',
    name: name('Kablo (sabit)', 'Cable (fixed)'),
    isFixed: true,
    fixedColor: '#1A1A1A',
    basePriceTRY: 0,
    basePriceUSD: 0,
    offsetMm: { x: 0, y: 140, z: 0 },
  }
  const pendant: DemoCollection = {
    _id: 'demo-pendant',
    key: { current: 'demo-pendant' },
    name: name('Örnek Sarkıt (demo)', 'Sample Pendant (demo)'),
    minBodyLayers: 0,
    maxBodyLayers: 0,
    layoutMode: 'assembled',
    hangFromCeiling: true,
    demoParts: [cable, ...heads.map((h) => ({ ...h, offsetMm: { x: 0, y: 0, z: 0 } }))],
  }

  // Örnek Masa Lambası: taban + başlık, başlık ofsetle tabanın üstünde.
  const table: DemoCollection = {
    _id: 'demo-table',
    key: { current: 'demo-table' },
    name: name('Örnek Masa Lambası (demo)', 'Sample Table Lamp (demo)'),
    minBodyLayers: 0,
    maxBodyLayers: 0,
    layoutMode: 'assembled',
    hangFromCeiling: false,
    demoParts: [
      ...(bases.length > 0 ? bases : bodies.slice(0, 1).map((b) => ({ ...b, slotType: 'base' as const }))),
      ...heads.map((h) => ({ ...h, offsetMm: { x: 0, y: 120, z: 0 } })),
    ],
  }
  return [pendant, table]
}
