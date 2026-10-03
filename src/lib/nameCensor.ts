/**
 * src/lib/nameCensor.ts
 *
 * Herkese açık Registry kartlarında / profil sayfasında (Faz 3) gösterilen
 * isimler için ortak sansürleme mantığı. Hem GERÇEK üye isimlerinde
 * (checkout/callback/route.ts) hem de MİSAFİR siparişler için üretilen
 * rastgele isimlerde (generateGuestDisplayName) kullanılır — ikisi de AYNI
 * fonksiyondan geçtiği için, sonuç görüntüsünden bunun gerçek bir üye mi
 * yoksa misafir mi olduğu ayırt edilemez (gizlilik açısından bilerek böyle).
 *
 * Kural (S4'te netleştirildi): Ad ve Soyad'ın İLK 2 HARFİ + SABİT sayıda
 * yıldız (harf sayısına bakılmaksızın). Soyad BÜYÜK harfle, Ad normal
 * yazımla. Örnek: "Çağdaş Kemaloğlu" → "Ça*** KE***"
 */

const STAR_COUNT = 3

function censorWord(word: string, uppercase: boolean): string {
  const prefix = word.slice(0, 2)
  const cased = uppercase ? prefix.toLocaleUpperCase('tr') : prefix
  return `${cased}${'*'.repeat(STAR_COUNT)}`
}

/**
 * "Çağdaş Kemaloğlu" → "Ça*** KE***"
 * Tek kelimelik isimlerde (soyadsız) sadece o kelime sansürlenir.
 * Üç+ kelimeli isimlerde ilk kelime "ad", SON kelime "soyad" kabul edilir
 * (aradakiler — varsa ikinci ad gibi — gösterilmez, sade tutulur).
 */
export function censorName(fullName: string): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '???'
  if (words.length === 1) return censorWord(words[0], false)
  return `${censorWord(words[0], false)} ${censorWord(words[words.length - 1], true)}`
}

// Rastgele misafir ismi üretimi için küçük bir isim havuzu — gerçek bir
// kişiyle eşleşmesin diye SIK KULLANILMAYAN/uydurma hissi veren isimler
// bilerek seçildi. Yeterince çeşitli (6x6 = 36 kombinasyon) ki art arda
// gelen misafir siparişlerinde aynı isim nadiren tekrar etsin.
const GUEST_FIRST_NAMES = ['Mert', 'Elif', 'Kaan', 'Ada', 'Deniz', 'Baran']
const GUEST_LAST_NAMES = ['Yıldız', 'Korkmaz', 'Aydın', 'Çetin', 'Demir', 'Aksoy']

/**
 * Misafir (hesapsız) siparişler için rastgele, zaten sansürlü FORMATTA
 * bir görünen-ad üretir — gerçek bir isim DEĞİL, baştan uydurma bir
 * isim havuzundan seçilip censorName() ile aynı kalıba sokuluyor. Bu
 * sayede Registry'de görünen üye ve misafir kartları birbirinden
 * AYIRT EDİLEMEZ (ikisi de "Xx*** YY***" formatında).
 */
export function generateGuestDisplayName(): string {
  const first = GUEST_FIRST_NAMES[Math.floor(Math.random() * GUEST_FIRST_NAMES.length)]
  const last = GUEST_LAST_NAMES[Math.floor(Math.random() * GUEST_LAST_NAMES.length)]
  return censorName(`${first} ${last}`)
}
