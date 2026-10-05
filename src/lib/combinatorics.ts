/**
 * src/lib/combinatorics.ts
 *
 * Custom Registry'de, aktif koleksiyonun kataloğuyla kaç FARKLI tasarımın
 * mümkün olduğunu hesaplar — 3D viewer üzerindeki rozet için (bkz.
 * CombinationCountBadge.tsx). GİRDİ (Sanity'den gelen `availableParts` ve
 * store'daki `bodyLimits`) zaten tarayıcıda hazır olduğu için TAMAMEN
 * client-side, ek bir sorguya gerek yok.
 *
 * Bu hesaplama, Drop kartlarındaki ("XXX Different Combinations")
 * basitleştirilmiş formülden FARKLI — kasıtlı olarak farklı, çünkü kullanıcı
 * burada gövdenin GERÇEK davranışını istedi: katmanlar SIRALI (yer
 * değiştirince farklı tasarım sayılır) ve TEKRARLI (aynı gövde birden
 * fazla kez eklenebilir) — bu yüzden V seçenekli bir gövde havuzundan k
 * katmanlık bir istif V^k farklı şekilde dizilebilir (permütasyon,
 * tekrarlı). Katman sayısı da min'den max'a kadar değişebildiği
 * (0 dahil olabilir — "taban+başlık yeter") için toplam:
 *
 *   TOPLAM = taban_varyant × başlık_varyant × Σ(k=min..max) gövde_varyant^k
 */

type BodySelection = { partId: string | null; materialId: string | null }
type BodyLimits = { min: number; max: number }

/**
 * Müşterinin O AN eklediği SPESİFİK gövde setinden kaç farklı tasarım
 * çıkarılabileceğini hesaplar — taban ve başlık SABİT kabul edilir (onlar
 * zaten tek bir seçim, çoğaltılmıyor); sadece gövde seti değişir:
 *   - Eldeki parçalar birbiriyle yer değiştirerek (farklı dizilişler),
 *   - Bir veya daha fazla parça çıkarılıp (küçültülmüş set) kalanlar da
 *     kendi aralarında yer değiştirerek
 * farklı bir tasarım sayılır. AYNI parça+malzeme kombinasyonundan birden
 * fazla varsa (ör. 2× kırmızı Gövde-A), bunlar BİRBİRİNDEN AYIRT
 * EDİLEMEZ kabul edilir (ikisinin yerini değiştirmek görsel olarak aynı
 * sonucu verir, ayrı bir tasarım SAYILMAZ).
 *
 * Matematiksel temel: her FARKLI parça+malzeme kombinasyonunun "üstel
 * üretici fonksiyonu" Σ_{j=0}^{c} x^j/j! (0'dan o parçadan kaç adet varsa
 * ona kadar) — hepsinin çarpımındaki x^n/n! katsayısı, tam olarak n
 * parçanın (bu sayıda) kaç farklı şekilde dizilebileceğini verir. n! ile
 * çarpıp min'den (koleksiyonun izin verdiği en az gövde sayısı) k'ya
 * (eldeki toplam gövde sayısı) kadar toplanır.
 */
export function computeCurrentModelCombinationCount(
  currentBody: BodySelection[],
  bodyLimits: BodyLimits
): number {
  // partId'si henüz atanmamış (geçersiz/eksik) katmanları sayma.
  const validBody = currentBody.filter((layer): layer is { partId: string; materialId: string | null } =>
    Boolean(layer.partId)
  )
  const k = validBody.length
  if (k === 0) return 0

  // Aynı parça+malzeme kombinasyonlarını grupla (kaçar adet var).
  const counts = new Map<string, number>()
  for (const layer of validBody) {
    const key = `${layer.partId}::${layer.materialId ?? ''}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  // dp[n] = n parçanın bu ana kadar işlenen parça TÜRLERİnden seçilerek
  // elde edilme "ağırlığı" (Σ 1/(j1!·j2!·...) — EGF katsayısı).
  let dp = [1]
  for (const count of counts.values()) {
    const next = new Array(dp.length + count).fill(0)
    for (let total = 0; total < dp.length; total++) {
      if (dp[total] === 0) continue
      for (let j = 0; j <= count; j++) {
        next[total + j] += dp[total] / factorial(j)
      }
    }
    dp = next
  }

  // n! × dp[n], n = min(koleksiyonun izin verdiği en az gövde)'den k'ya kadar
  // — min'in altındaki (koleksiyon kuralına göre GEÇERSİZ) tasarımlar hariç.
  const lowerBound = Math.max(0, bodyLimits.min)
  let total = 0
  for (let n = lowerBound; n <= k && n < dp.length; n++) {
    total += factorial(n) * dp[n]
  }

  return Math.round(total)
}

const factorialCache = [1]
function factorial(n: number): number {
  if (factorialCache[n] !== undefined) return factorialCache[n]
  for (let i = factorialCache.length; i <= n; i++) {
    factorialCache[i] = factorialCache[i - 1] * i
  }
  return factorialCache[n]
}

/**
 * Büyük sayıları okunabilir kılar — gövde katman sayısı arttıkça rakam
 * hızla milyonlara/milyarlara çıkabiliyor (V^k üstel büyüme), bu yüzden
 * 1 milyon ve üstünü "4.2M" gibi kısaltıyoruz; altındakini normal binlik
 * ayraçla gösteriyoruz.
 */
export function formatCombinationCount(n: number, locale: string): string {
  const intlLocale = locale === 'tr' ? 'tr-TR' : 'en-US'
  if (!Number.isFinite(n)) return '∞'
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toLocaleString(intlLocale, { maximumFractionDigits: 1 })}M`
  }
  return n.toLocaleString(intlLocale)
}
