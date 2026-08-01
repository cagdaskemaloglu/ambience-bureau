# CLAUDE.md — The Ambience Bureau

Bu dosya, bu repoda çalışan bir AI kodlama asistanı (Claude Code veya
benzeri) için otomatik olarak okunan bağlam dosyasıdır. Amaç: tekrar
düşülen hatalara tekrar düşmemek, projenin kendine özgü konvansiyonlarına
uymak. Derinlemesine mimari için `ARCHITECTURE.md`, iş bağlamı için
`PROJECT_OVERVIEW.md`, güncel eksikler için `CURRENT_STATUS.md` ve
`TASKS.md`'ye bakın — bu dosya onların **özeti/hızlı referansı** değil,
**davranışsal kurallar** setidir.

## Kod değişikliği yapmadan önce oku

1. Değiştireceğin dosyayla ilgili bölümü `ARCHITECTURE.md`'de bul.
2. `CURRENT_STATUS.md` → "Bilinen Eksikler"i kontrol et; üzerinde
   çalıştığın alan zaten bilinen bir sorunla ilişkiliyse tekrar keşfetme.
3. Bir "neden böyle" sorusu varsa önce kod içi yorumlara bak — bu proje
   kritik/tuhaf kararların çoğunu yorum olarak belgeliyor (özellikle
   ışıklandırma, PDF üretimi, routing konularında).

## Bu Projeye Özgü Zorunlu Kurallar

### 1. `params` her zaman `Promise`'tır
```tsx
// DOĞRU
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  ...
}
```
Senkron `params.locale` kalıbı **hata VERMEZ**, sessizce `undefined`
döner — bu yüzden fark etmesi zor bir buga yol açar (sayfa hep yanlış
dilde/hep ilk koşul dalında davranır). Yeni bir sayfa/route yazarken
bunu MUTLAKA doğrula.

### 2. Middleware dosyasının adı `proxy.ts`'tir, `middleware.ts` DEĞİL
Next.js 16 konvansiyonu böyle. Fonksiyon adı da `export async function
proxy(...)` olmalı (`middleware` değil). Bu ikisini karıştırırsan build
şu hatayla kırılır: *"Both middleware file and proxy file are detected"*.
`src/proxy.ts`'i asla silme/yeniden adlandırma — anasayfa yönlendirmesi,
Supabase session yenileme ve `<html lang>` buna bağlı.

### 3. Sanity'de "koleksiyonların tüm alanlarını dönen" İKİ sorgu var
`src/lib/queries.ts` içinde `getAllCollections()` (admin panel) ve
`getAllLampCollections()` (Custom Registry sayfası) birbirinden bağımsız
GROQ sorguları. Collection şemasına yeni bir alan eklersen (örn. yeni bir
ücret alanı), **ikisini de** güncelle — aksi halde biri diğerinden geride
kalır ve sessizce yanlış/varsayılan değer kullanılır (bu projede tam
olarak bu yaşandı: donanım ücretleri admin'de çalışıp konfigüratörde
çalışmıyordu).

### 4. Three.js ışıklandırması "fiziksel olarak doğru" birimlerde
`three` r155+ kullanıyoruz — point/spot light `intensity` **candela**,
directional/ambient farklı bir ölçekte. Bir ışığın "görünmüyor" şikayeti
geldiğinde ilk şüphelenilecek şey `decay` değil, **birim ölçeği/mesafe**
uyumsuzluğudur. Bu projede ışığın görünür ana etkisi artık bir noktasal
ışıktan değil, **`ModelMesh.tsx`'teki emissive malzeme + Bloom**'dan
geliyor — yeni bir "ışık kaynağı" eklerken önce bu deseni (görünür bir
obje eklemeden, malzemeyi parlatma) düşün.

### 5. PDF üretimi (Puppeteer) sadece Vercel'de değil, "Vercel'in AWS
Lambda olduğunu SANMADIĞINI" da hesaba katmalı
`@sparticuz/chromium-min` paketinin AWS-tespiti başarısız olduğu için
`generatePdf.ts`'te `AWS_LAMBDA_JS_RUNTIME` manuel set ediliyor. Bu
paketi güncellersen veya değiştirirsen bu satırı silme, önce
`ARCHITECTURE.md` §6'yı oku.

### 6. Ekran görüntüsü (screenshot) alan kod ASLA manuel `gl.render()`
çağırmamalı
`useScreenshot.ts`, Bloom post-processing'i atlamamak için canvas'ın
zaten güncel olan son karesini doğrudan yakalıyor. Sahneye yeni bir
post-processing efekti eklersen, ekran görüntülerinin hâlâ doğru
göründüğünü test et.

### 7. Sipariş durumu artık 5+ aşamalı: `pending → received → processing
→ shipped → delivered` (+ `cancelled`/`refunded`)
Belge üretimi `processing`'e geçişte tetiklenir, ödeme callback'inde
DEĞİL. Yeni bir durum eklersen hem `order_status` Postgres enum'unu hem
`ORDER_STATUS`/`STATUS_LABELS` sözlüklerini (admin panel + hesap sayfası)
güncelle.

### 8. `registry_no` ≠ `certificate_no`
`registry_no` ürüne ait bir alan (Sanity'den kopyalanır). `certificate_no`
her satın almaya özel, tekil, tahmin edilemez bir kimlik (trigger üretir).
**Genel/paylaşılabilir bir link veya dış sisteme kimlik olarak asla
`registry_no` kullanma.**

### 9. E-posta dili ≠ site dili
Sipariş onay/durum e-postalarının dili, checkout'taki site dilinden değil
**ödeme para birimine** göre seçilir (`currency === 'USD' ? 'en' : 'tr'`).
Bu kasıtlı bir tasarım kararı — "tutarsızlık" sanıp "düzeltmeye" kalkma.

## Konvansiyonlar

- **Dil:** Kod yorumları ve commit'ler bu projede genelde **Türkçe**
  yazılıyor (kod/değişken adları İngilizce kalıyor). Bu tutarlılığı koru.
- **Stil:** Tailwind, özel `bureau.*` renk paleti (`black, ink, muted,
  subtle, rule, surface, amber, amber-dim`). Yeni bir renk eklemeden önce
  bu paletten birinin işe yarayıp yaramadığına bak.
- **Ton:** Site bürokratik/resmi belge estetiğinde (Courier/mono font,
  "FORM xxx", büyük harf başlıklar, amber tek vurgu rengi). Yeni UI metni
  yazarken bu tonu koru — gündelik dil yerine resmi/belgesel dil.
- **i18n:** Çoğu sayfa `next-intl`'in `messages/*.json` katalogları yerine
  basit `locale === 'tr' ? '...' : '...'` ternary'leriyle çeviri yapıyor
  (bkz. `bureau/page.tsx`, `control-protocol/page.tsx`). Yeni statik
  sayfa eklerken bu deseni takip et, messages json'a yeni namespace
  eklemek zorunda değilsin.
- **Dosya değişikliği teslimi (bu asistanın kendi alışkanlığı):** Kullanıcı
  genelde değişen dosyaları tek tek (arşivlenmeden) ister ve her dosya
  için repodaki tam hedef yolunu (örn. `src/app/api/.../route.ts`) net
  şekilde belirtmeni bekler. Yeni bir route dosyası oluşturuyorsan dosya
  adının `route.ts` olması gerektiğini (klasör adı endpoint'i belirler)
  özellikle vurgula — bu projede bir kez dosya `route.ts` yerine başka bir
  adla teslim edilip 404'e yol açmıştı.

## Bu Repoda SIK YAŞANAN Hata Sınıfları (kısa liste)

Ayrıntılı kök neden analizleri için `CURRENT_STATUS.md`'deki tabloya bak.
Kısaca: (1) Next.js 16 `params`/`proxy.ts` göç kuralları, (2) Vercel'in
AWS Lambda zannedilmemesi (Puppeteer), (3) Three.js fiziksel ışık birimleri,
(4) iki paralel Sanity sorgusunun senkronsuz kalması, (5) str_replace ile
düzenlerken bir dosyanın SADECE bir kısmını (örn. `body` seçicisini) güncelleyip
CSS'te aynı özelliğin başka bir seçicide de (`pre`, `.qr-row`) tekrarlandığını
unutmak — CSS/stil değişikliklerinde `grep -n "aranan-özellik"` ile TÜM
eşleşmeleri kontrol et, ilkini bulup durma.

## Bu dosyayı güncelleme

Yeni bir "bunu bir daha yapma" dersi çıkardığında (özellikle saatler süren
bir debug sonrası), buraya kısa bir madde ekle. Bu dosya ne kadar spesifik
kalırsa, gelecekteki AI oturumları o kadar az zaman kaybeder.
