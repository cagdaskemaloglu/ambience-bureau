/**
 * src/lib/sanity-fulfillment.ts
 *
 * Custom Registry üzerinden tasarlanıp SATIN ALINAN bir tasarımın, ödeme
 * onaylandıktan sonra gerçek bir Sanity "product" belgesine dönüştürülmesiyle
 * ilgili tüm sunucu-taraflı mantık burada toplanıyor. İki yerden çağrılır:
 *
 *   1. src/app/api/checkout/route.ts (checkoutApi'nın BAŞINDA) —
 *      `checkDropCapacity()`: Drop'un planlanan adedi dolmuşsa siparişi
 *      daha ödeme adımına gitmeden reddeder ("stok tükendi").
 *
 *   2. src/app/api/checkout/callback/route.ts (ödeme BAŞARILI olunca) —
 *      `createOwnedProductFromCustomDesign()`: gerçek Sanity product
 *      belgesini oluşturur ve (varsa) spin-frame üretimini tetikler.
 *
 * ÖNEMLİ: Bu modül SADECE sunucu tarafında (API route) import edilmeli —
 * `sanityAdminClient` yazma yetkili bir token taşıyor.
 */
import { sanityAdminClient, sanityClient } from './sanity'

type DropCapacityInfo = {
  dropId: string
  dropNo: string
  plannedQuantity: number | null
  currentCount: number
}

/**
 * Bir Custom Registry koleksiyon anahtarının (collectionKey) bağlı olduğu
 * Drop'u bulur. Birebir `drop.collection -> key.current == collectionKey`
 * eşleşmesine bakar. Hiçbir Drop bu koleksiyonu birincil koleksiyonu olarak
 * işaretlememişse (yani bu koleksiyon herhangi bir Drop'a resmi olarak
 * bağlı değilse) `null` döner — bu durumda ne stok sınırı uygulanır ne de
 * oluşturulacak ürün bir Drop'a bağlanır (product.drop OPSİYONEL alan,
 * bkz. product.ts şema notu).
 *
 * NOT — bilinen kısıt: birden fazla Drop aynı koleksiyonu birincil
 * koleksiyonu olarak işaretlerse (normal admin kullanımında olmaz, ama
 * teorik olarak mümkün), GROQ'nun döndürdüğü İLK eşleşme kullanılır.
 */
export async function resolveDropForCollection(collectionKey: string): Promise<DropCapacityInfo | null> {
  const result = await sanityClient.fetch<{
    _id: string
    dropNo: string
    plannedQuantity: number | null
    currentCount: number
  } | null>(
    `*[_type == "drop" && collection->key.current == $collectionKey][0]{
      _id,
      dropNo,
      plannedQuantity,
      "currentCount": count(*[_type == "product" && references(^._id)])
    }`,
    { collectionKey }
  )

  if (!result) return null
  return {
    dropId: result._id,
    dropNo: result.dropNo,
    plannedQuantity: result.plannedQuantity,
    currentCount: result.currentCount,
  }
}

/**
 * checkout/route.ts'in EN BAŞINDA çağrılır — sepetteki her "custom" tipi
 * ürün için, bağlı olduğu Drop'un planlanan adedi dolmuş mu diye bakar.
 * Doluysa, o ürünün adını (hata mesajında göstermek için) içeren bir hata
 * döner; checkout route'u bunu görünce 400 ile siparişi reddeder.
 *
 * Drop'a bağlı olmayan koleksiyonlar (resolveDropForCollection() null
 * dönerse) veya Drop'ta "Planlanan Satış Adedi" hiç girilmemişse (null)
 * stok sınırı UYGULANMAZ — sınırsız kabul edilir.
 */
export async function checkCustomDesignCapacity(
  collectionKey: string
): Promise<{ ok: true } | { ok: false; reason: string }> {
  // Koleksiyon Sanity'de "Pasif" işaretlenmişse (bkz. collection.ts şema
  // notu), bu koleksiyonla checkout tamamen reddedilir — Custom Registry
  // koleksiyon seçim ekranından zaten kaldırılmış olsa da, biri eski bir
  // linkle (?collection=...) doğrudan tasarım ekranına gelip satın almaya
  // çalışabilir; bu kontrol o yolu da kapatır.
  const collectionActive = await sanityClient.fetch<boolean | null>(
    `*[_type == "collection" && key.current == $collectionKey][0].active`,
    { collectionKey }
  )
  if (collectionActive === false) {
    return { ok: false, reason: 'Bu koleksiyon artık satışa açık değil.' }
  }

  const drop = await resolveDropForCollection(collectionKey)
  if (!drop) return { ok: true }
  if (drop.plannedQuantity == null) return { ok: true }

  if (drop.currentCount >= drop.plannedQuantity) {
    return {
      ok: false,
      reason: `Drop-${drop.dropNo} için planlanan ${drop.plannedQuantity} adedin tamamı satıldı.`,
    }
  }
  return { ok: true }
}

/**
 * Bir Drop için sıradaki Registry Number'ı hesaplar — RegistryNoHint.tsx
 * (Studio'daki ipucu bileşeni) ile AYNI mantık, ama burada admin onayı
 * beklemeden doğrudan kullanılır (otomatik oluşturma bu yüzden güvenli:
 * ödeme başarılı olduğunda SEQ zaten `checkCustomDesignCapacity` ile
 * kontrol edilmiş kapasite dahilinde olur).
 *
 * Format: "00{seq}/00{total}" — product.ts'teki "001/050" örneğiyle aynı,
 * pad uzunluğu toplam adedin basamak sayısına göre otomatik ayarlanır
 * (3 haneden az olmayacak şekilde).
 */
function formatRegistryNo(seq: number, total: number): string {
  const padLength = Math.max(3, String(total).length)
  return `${String(seq).padStart(padLength, '0')}/${String(total).padStart(padLength, '0')}`
}

/**
 * Sanity'deki parça/malzeme SLUG'larını (lampPart.partId / material.materialId
 * — bkz. o şemalardaki slug alanları) gerçek belge _id'lerine çevirir.
 * `custom_designs.design_data.parts` Supabase'de SLUG olarak saklanıyor
 * (konfigüratörün kendi iç mantığı böyle), ama Sanity'deki
 * `configuratorParts` dizisi gerçek REFERANS (_ref) bekliyor.
 *
 * Bir parça/malzeme slug'ı Sanity'de bulunamazsa (silinmiş/değiştirilmiş
 * olabilir), o satır sessizce ATLANIR — eksik bir referansla belge
 * oluşturmaya çalışmak Sanity'de hataya yol açar. Böyle bir durum
 * console.error ile loglanır ki fark edilsin.
 */
async function resolvePartsToReferences(
  parts: Array<{ slotType: string; partId: string; materialId: string }>
): Promise<Array<{ _type: string; _key: string; slotType: string; part: { _type: 'reference'; _ref: string }; material: { _type: 'reference'; _ref: string } }>> {
  const resolved = await Promise.all(
    parts.map(async (p, idx) => {
      const [partDoc, materialDoc] = await Promise.all([
        sanityClient.fetch<{ _id: string } | null>(
          `*[_type == "lampPart" && partId.current == $partId][0]{ _id }`,
          { partId: p.partId }
        ),
        sanityClient.fetch<{ _id: string } | null>(
          `*[_type == "material" && materialId.current == $materialId][0]{ _id }`,
          { materialId: p.materialId }
        ),
      ])

      if (!partDoc || !materialDoc) {
        console.error(
          `[sanity-fulfillment] Parça/malzeme bulunamadı, atlanıyor — slotType: ${p.slotType}, partId: ${p.partId}, materialId: ${p.materialId}`
        )
        return null
      }

      return {
        _type: 'configuratorPartEntry',
        _key: `${p.slotType}-${idx}-${Date.now()}`,
        slotType: p.slotType.toLowerCase(),
        part: { _type: 'reference' as const, _ref: partDoc._id },
        material: { _type: 'reference' as const, _ref: materialDoc._id },
      }
    })
  )

  return resolved.filter((r): r is NonNullable<typeof r> => r !== null)
}

export type CreateOwnedProductInput = {
  /** Supabase custom_designs.id */
  customDesignId: string
  /** Registry kartında gösterilecek sansürlü isim — üye/misafir fark etmez, ikisi de aynı formatta (bkz. nameCensor.ts). */
  ownerDisplayName: string
  /** Sahibin şehri — sipariş adresinden gelir. */
  ownerCity?: string
  /** OPSİYONEL — SADECE gerçek bir üye hesabı varsa (misafir siparişlerinde undefined). Doluysa profil sayfası linki için kullanılır. */
  ownerUserId?: string
  /** Custom Registry'de tasarlanan koleksiyonun key'i (custom_designs.design_data.collectionKey). */
  collectionKey: string
  /** custom_designs.design_data.parts */
  parts: Array<{ slotType: string; partId: string; materialId: string }>
  /** Sipariş satırındaki ürün adı (order_items.product_name) — isim alanı için TR/EN ikisine de yazılır. */
  productName: string
  /** order_items.unit_price karşılığı — zaten her iki para birimi de ayrı tutulmuyor, tek fiyat snapshot'ı. */
  priceTRY: number
  priceUSD: number
  /** custom_designs.snapshot_url — varsa ilk görsel olarak KULLANILMAZ (images alanı Sanity image tipi bekler,
   *  bir URL'yi doğrudan image field'a yazamayız) — sadece referans/log amaçlı saklanmıyor, bilgi notu olarak eklenir. */
  snapshotUrl?: string
}

/**
 * Ödeme BAŞARILI olduktan sonra çağrılır (checkout/callback/route.ts).
 * Gerçek bir Sanity "product" belgesi oluşturur:
 *   - status: "owned", ownerUserId dolu
 *   - drop (varsa) + otomatik hesaplanmış registryNo
 *   - configuratorParts: tasarımın parça/malzeme kombinasyonu (3D/spin
 *     render için) — isConfigurable BİLEREK false: bu ürün "customize"
 *     edilebilir bir şablon değil, SATILMIŞ tek bir adet.
 *   - images: [] — admin fotoğraf yükleyene kadar kart spin frame'lere
 *     (varsa) düşer (bkz. ProductCardMedia.tsx, Faz 3).
 *
 * Belge doğrudan YAYINLANMIŞ (taslak değil) olarak oluşturulur — ürün
 * anında Registry'de ve ilgili Drop satırında görünür hale gelir.
 *
 * Hata durumunda throw eder — çağıran taraf (callback route) bunu
 * YAKALAYIP LOGLAMALI ama ödeme akışını KESMEMELİ (müşteri ödemeyi zaten
 * yaptı; Sanity tarafı aksasa bile sipariş Supabase'de kayıtlı kalır,
 * admin panelden elle düzeltilebilir).
 */
export async function createOwnedProductFromCustomDesign(input: CreateOwnedProductInput) {
  const drop = await resolveDropForCollection(input.collectionKey)

  let registryNo: string
  let dropRef: { _type: 'reference'; _ref: string } | undefined

  if (drop && drop.plannedQuantity != null) {
    const nextSeq = drop.currentCount + 1
    registryNo = formatRegistryNo(nextSeq, drop.plannedQuantity)
    dropRef = { _type: 'reference', _ref: drop.dropId }
  } else if (drop) {
    // Drop var ama plannedQuantity girilmemiş — payda olmadan seri no
    // üretemeyiz, bu yüzden ham sıra numarasını kullanıyoruz.
    registryNo = String(drop.currentCount + 1).padStart(3, '0') + '/???'
    dropRef = { _type: 'reference', _ref: drop.dropId }
  } else {
    // Bu koleksiyon hiçbir Drop'a bağlı değil — Drop'suz, genel bir
    // seri numarası (zaman damgası tabanlı, çakışma riski yok).
    registryNo = `C-${Date.now().toString(36).toUpperCase()}`
  }

  // Koleksiyonun kendi Sanity _id'sini de bulalım (product.collection alanı için).
  const collectionDoc = await sanityClient.fetch<{ _id: string } | null>(
    `*[_type == "collection" && key.current == $key][0]{ _id }`,
    { key: input.collectionKey }
  )

  const configuratorParts = await resolvePartsToReferences(input.parts)

  const slugBase = registryNo.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()

  const doc = await sanityAdminClient.create({
    _type: 'product',
    registryNo,
    slug: { _type: 'slug', current: `owned-${slugBase}-${Date.now().toString(36)}` },
    status: 'owned',
    ownerDisplayName: input.ownerDisplayName,
    ownerCity: input.ownerCity,
    ownerUserId: input.ownerUserId,
    name: [
      { _key: 'tr', locale: 'tr', value: input.productName },
      { _key: 'en', locale: 'en', value: input.productName },
    ],
    images: [],
    category: 'pendant', // Varsayılan — admin gerekirse Studio'dan düzeltebilir (configuratorParts'tan otomatik çıkarım güvenilir değil).
    collection: collectionDoc ? { _type: 'reference', _ref: collectionDoc._id } : undefined,
    drop: dropRef,
    priceTRY: input.priceTRY,
    priceUSD: input.priceUSD,
    vatIncluded: true,
    isConfigurable: false,
    configuratorParts,
    publishedAt: new Date().toISOString(),
  })

  // Spin-frame üretimini tetikle — hata verirse (ör. GitHub Actions
  // ayarlanmamışsa) ürün oluşturmayı BOZMAZ, sadece loglar.
  try {
    await triggerSpinFrameGeneration(doc.slug!.current)
  } catch (err) {
    console.error('[sanity-fulfillment] Spin-frame tetikleme hatası (ürün yine de oluşturuldu):', err)
  }

  return doc
}

/**
 * Yeni oluşturulan bir ürün için 24 kareli spin-frame üretimini TETİKLER.
 *
 * NEDEN DOĞRUDAN ÇALIŞTIRILMIYOR: scripts/generate-spin-frames.ts gerçek
 * Puppeteer (headless Chrome) kullanıyor — bu, Vercel'in sunucusuz (serverless)
 * fonksiyon ortamında GÜVENİLİR ÇALIŞMAZ (Chromium yok, zaman aşımı riski
 * çok yüksek). Bunun yerine, GitHub Actions'taki (tam bir Linux runner,
 * Puppeteer'ın zaten rahatça çalıştığı bir ortam) bir workflow'u REST API
 * üzerinden "workflow_dispatch" ile tetikliyoruz — asıl ağır iş GitHub'ın
 * sunucusunda birkaç dakika içinde gerçekleşiyor.
 *
 * KURULUM GEREKLİ (bkz. .github/workflows/generate-spin-frames.yml):
 *   - GITHUB_REPO ortam değişkeni: "kullanici-adi/repo-adi"
 *   - GITHUB_ACTIONS_TOKEN ortam değişkeni: "repo" + "workflow" yetkili bir PAT
 * İkisi de ayarlanmamışsa bu fonksiyon sessizce (sadece bir log satırıyla)
 * hiçbir şey yapmadan döner — site/ödeme akışı ETKİLENMEZ, sadece o ürün
 * için spin frame'ler üretilmemiş olur (admin isterse `npm run spin-frames
 * -- --slug=...` ile elle çalıştırabilir).
 */
export async function triggerSpinFrameGeneration(slug: string): Promise<void> {
  const repo = process.env.GITHUB_REPO
  const token = process.env.GITHUB_ACTIONS_TOKEN

  if (!repo || !token) {
    console.warn(
      `[sanity-fulfillment] GITHUB_REPO/GITHUB_ACTIONS_TOKEN ayarlanmamış — "${slug}" için spin-frame otomasyonu ATLANDI. Elle çalıştırmak için: npm run spin-frames -- --slug=${slug}`
    )
    return
  }

  const res = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/generate-spin-frames.yml/dispatches`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({
      ref: 'main',
      inputs: { slug },
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`GitHub Actions dispatch başarısız (${res.status}): ${text}`)
  }
}
