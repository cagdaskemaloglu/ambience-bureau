/**
 * scripts/migrate-materials-to-references.ts
 *
 * TEK SEFERLİK migration script'i. Bu değişiklikten ÖNCE oluşturulmuş
 * lampPart dokümanlarındaki `materials[]` alanı, her malzemeyi TEKRAR
 * TEKRAR gömülü (embedded) bir object olarak tutuyordu. Artık `material`
 * kendi başına bir doküman tipi ve lampPart'lar ona sadece REFERANS
 * veriyor (bkz. src/sanity/schemaTypes/material.ts ve lampPart.ts).
 *
 * Bu script:
 *   1. Tüm lampPart dokümanlarını, materials[] alanları HÂLÂ eski
 *      (gömülü object) formatındayken okur.
 *   2. materialId'ye göre TEKİLLEŞTİRİLMİŞ malzeme setini çıkarır
 *      (aynı materialId birden fazla parçada aynı tanımla tekrar
 *      ediyorsa bir kere işlenir; farklı tanımla tekrar ediyorsa UYARI
 *      basar — hangisinin kullanılacağını SİZ seçmelisiniz).
 *   3. Her tekil malzeme için yeni bir `material` dokümanı oluşturur.
 *   4. Her lampPart'ın `materials[]` alanını, yeni oluşturulan
 *      dokümanlara REFERANS veren bir diziyle DEĞİŞTİRİR (patch).
 *
 * ÇALIŞTIRMADAN ÖNCE:
 *   - Studio'da şema değişikliğini (material.ts + lampPart.ts) deploy
 *     etmeden bu script'i çalıştırmayın — Studio'nun yeni şemayı
 *     tanıması gerekir, ama script doğrudan Content API ile çalıştığı
 *     için Studio deploy'undan ÖNCE de teknik olarak çalışabilir; güvenli
 *     olan sıra: önce `npx sanity deploy` (veya Studio'yu yeniden
 *     başlatma), sonra bu script.
 *   - SANITY_API_TOKEN'ınızın YAZMA (Editor veya Administrator) yetkisi
 *     olmalı. .env.local'deki token salt-okunur ise Sanity Dashboard >
 *     API > Tokens'tan yeni bir yazma yetkili token oluşturup GEÇICI
 *     olarak kullanın.
 *   - Veritabanının bir YEDEĞİNİ alın: `sanity dataset export production
 *     backup-before-material-migration.tar.gz`
 *
 * ÇALIŞTIRMA:
 *   npx tsx scripts/migrate-materials-to-references.ts
 *   (veya: npm install -D tsx  →  sonra yukarıdaki komut)
 *
 * Script varsayılan olarak "DRY RUN" modunda çalışır (hiçbir şey
 * YAZMAZ, sadece ne yapacağını konsola basar). Gerçekten uygulamak için:
 *   npx tsx scripts/migrate-materials-to-references.ts --apply
 */

import { createClient } from '@sanity/client'

const APPLY = process.argv.includes('--apply')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN!,
  useCdn: false,
})

interface EmbeddedMaterial {
  _key: string
  materialId: string
  label?: Array<{ locale: string; value: string }>
  color?: string
  roughness?: number
  metalness?: number
  priceModifierTRY?: number
  priceModifierUSD?: number
  thumbnail?: { asset?: { _ref: string } }
}

interface LampPartDoc {
  _id: string
  _rev: string
  materials?: EmbeddedMaterial[]
}

function materialsAreEquivalent(a: EmbeddedMaterial, b: EmbeddedMaterial): boolean {
  return (
    a.color === b.color &&
    a.roughness === b.roughness &&
    a.metalness === b.metalness &&
    a.priceModifierTRY === b.priceModifierTRY &&
    a.priceModifierUSD === b.priceModifierUSD
  )
}

async function main() {
  console.log(APPLY ? '⚠️  APPLY modu — veritabanı değişecek.' : 'ℹ️  DRY RUN modu — hiçbir şey yazılmayacak. Gerçekten uygulamak için --apply ekleyin.')
  console.log('')

  // Eski (gömülü object) formatındaki TÜM lampPart dokümanlarını çek.
  const lampParts: LampPartDoc[] = await client.fetch(
    `*[_type == "lampPart"]{ _id, _rev, materials }`
  )

  console.log(`${lampParts.length} lampPart dokümanı bulundu.`)

  // materialId -> ilk görülen tanım
  const uniqueMaterials = new Map<string, EmbeddedMaterial>()
  const conflicts: string[] = []

  for (const part of lampParts) {
    for (const mat of part.materials ?? []) {
      if (!mat.materialId) continue
      const existing = uniqueMaterials.get(mat.materialId)
      if (!existing) {
        uniqueMaterials.set(mat.materialId, mat)
      } else if (!materialsAreEquivalent(existing, mat)) {
        conflicts.push(mat.materialId)
      }
    }
  }

  console.log(`${uniqueMaterials.size} tekil materialId bulundu.`)
  if (conflicts.length > 0) {
    console.warn('')
    console.warn('⚠️  UYARI: Aşağıdaki materialId değerleri farklı parçalarda FARKLI tanımlarla kullanılıyor.')
    console.warn('   Script, İLK gördüğü tanımı kullanacak. Yanlışsa, migration sonrası Studio\'dan elle düzeltin:')
    for (const c of [...new Set(conflicts)]) console.warn(`   - ${c}`)
    console.warn('')
  }

  // 1) Yeni `material` dokümanlarını oluştur (ID'lerini eşlemek için sakla)
  const materialIdToNewDocId = new Map<string, string>()

  for (const [materialId, mat] of uniqueMaterials) {
    const newDocId = `material.${materialId}` // deterministik ID — script 2 kere çalışırsa dokuman çiftlenmez
    materialIdToNewDocId.set(materialId, newDocId)

    console.log(`${APPLY ? 'Oluşturuluyor' : '[DRY RUN] Oluşturulacak'}: material "${materialId}" -> ${newDocId}`)

    if (APPLY) {
      await client.createIfNotExists({
        _id: newDocId,
        _type: 'material',
        materialId: { _type: 'slug', current: materialId },
        label: mat.label ?? [],
        color: mat.color,
        roughness: mat.roughness ?? 0.5,
        metalness: mat.metalness ?? 0,
        priceModifierTRY: mat.priceModifierTRY ?? 0,
        priceModifierUSD: mat.priceModifierUSD ?? 0,
        isTranslucent: false, // migration sonrası Studio'dan elle işaretleyin
        ...(mat.thumbnail?.asset?._ref && {
          thumbnail: { _type: 'image', asset: { _type: 'reference', _ref: mat.thumbnail.asset._ref } },
        }),
      })
    }
  }

  console.log('')

  // 2) Her lampPart'ın materials[] alanını referanslarla değiştir
  for (const part of lampParts) {
    const refs = (part.materials ?? [])
      .filter((m) => m.materialId && materialIdToNewDocId.has(m.materialId))
      .map((m) => ({
        _type: 'reference' as const,
        _ref: materialIdToNewDocId.get(m.materialId)!,
        _key: m._key, // mevcut key'i koru, Sanity array diff'i için faydalı
      }))

    console.log(
      `${APPLY ? 'Güncelleniyor' : '[DRY RUN] Güncellenecek'}: lampPart ${part._id} -> ${refs.length} referans`
    )

    if (APPLY) {
      await client.patch(part._id).set({ materials: refs }).commit()
    }
  }

  console.log('')
  console.log(APPLY ? '✅ Migration tamamlandı.' : 'ℹ️  Dry run tamamlandı. Sonuçlar doğru görünüyorsa --apply ile tekrar çalıştırın.')
  if (APPLY) {
    console.log('')
    console.log('SONRAKI ADIM: Studio > Materials altına gidip her malzemede')
    console.log('"Yarı Saydam Filament mi?" alanını gerektiği yerlerde işaretleyin')
    console.log('(script bunu varsayılan olarak false bıraktı, elle gözden geçirilmeli).')
  }
}

main().catch((err) => {
  console.error('Migration başarısız:', err)
  process.exit(1)
})