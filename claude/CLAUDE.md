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
GROQ sorguları. Collection (veya ücretleri ezen Drop) şemasına yeni bir
alan eklersen (örn. yeni bir ücret alanı, gövde sınırı), **ikisini de**
güncelle — ikisinde de ücretler `coalesce(drop ücreti, koleksiyon ücreti)`
olarak hesaplanıyor — aksi halde biri diğerinden geride
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

### 10. Ödeme sağlayıcı PayTR'dir, iyzico DEĞİL
Sipariş onayı `src/app/api/checkout/paytr-notify/route.ts`'te olur (PayTR
sunucusu POST eder, hash doğrulanır). `api/checkout/callback` ve
`api/iyzico-test` ölü kod — yeni mantığı oraya yazma. PayTR tuzakları:
`merchant_oid` tiresiz (`toPaytrOid`), para birimi `"TL"`, bildirimde
"OK" dönülmezse PayTR tekrar dener. `orders.iyzico_*` kolonları PayTR
verisini taşıyor (isimler tarihsel).

### 11. `public/parts/stl/` mobil uygulamanın kullandığı canlı bir kaynak
Sitenin kodu bu klasörü kullanmıyor ama mobil uygulama (`/Users/cagdas/ESPTest`,
`services/stlCache.ts`) STL'leri `https://www.ambiencebureau.com/parts/stl/`
+ `manifest.json` üzerinden indiriyor. **Silme, taşıma, yeniden
adlandırma.** Yeni STL eklersen `scripts/generate-stl-manifest.js` ile
manifest'i yeniden üret.

### 12. Header'daki görünmez Büro/Arşiv yer tutucularını silme
`HeaderStickman.tsx` animasyonu bu iki öğenin konumunu
(`data-stickman-anchor`) referans alıyor. Linkler Footer'a taşındı ama
yer tutucular kasıtlı olarak header'da duruyor.

### 13. Tema renkleri CSS değişkeni
`bureau.*` renkleri `globals.css`'teki `--bureau-*` değişkenlerinden gelir
ve karanlık/aydınlık temayla değişir. Temadan bağımsız kalması gereken
bir renk için `bureau-fixed-*` kullan. Karanlık tema = **tel kafes
teması** (gece mavisi zemin, mavi tel çizgiler; `bureau-wire` vurgusu);
aydınlık tema = materyal görünümü. Ayrıntı: `DESIGN.md` → "Tel kafes
teması". Tema başlangıç mantığını
değiştirirsen `src/app/layout.tsx`'teki `THEME_INIT_SCRIPT` ile
`ThemeProvider.tsx`'i BİRLİKTE değiştir.

### 14. `CameraFit.tsx` ↔ `spinFrames.ts` açısı eşleşmeli
`ISO_AZIMUTH_DEG` ve `SPIN_ISO_AZIMUTH_DEG` (45) aynı kalmalı; aksi halde
kartlardaki spin karesi ile konfigüratörün açılış açısı uyuşmaz.
`?capture=1` modunu bozan bir değişiklik spin-frame üretimini kırar.

### 15. İki satış rejimi var; sınıf listesi tek kaynakta
Ürün ya Sınırlı Tahsis (drop, `saleMode` boş/`limited`) ya Daimi Envanter
(`standing`, stoklu). Kart/sayfa/sepet mantığı yazarken ikisini de düşün;
satın alınabilirlik için `isProductPurchasable()` kullan, `status ===
'decommissioned'` kontrolünü elle tekrarlama. Aydınlatma sınıfları
(lambader, sarkıt, aplik...) SADECE `src/lib/lightClasses.ts`'te
tanımlanır. Görsel/kurgu kararları için önce `DESIGN.md`.

### 16. Konfigüratörde üç yerleşim modu var
`collection.layoutMode`: `stack` (üst üste, geometri merkezlenir),
`assembled` (Blender konumu, geometri MERKEZLENMEZ) ve `model` (Montajlı
Model: `lampModel` belgeleri; Blender konumunda çizilir, her renkli parça
store'da bir `body` seçimi olarak tutulur — sepet/sipariş/preset akışı
bu sayede değişmeden çalışır). Model yükleme ya da konumlama koduna
dokunurken hepsini düşün. Sabit parçalar
(`lampPart.isFixed`) store'da `fixedParts`'tadır, `availableParts`'ta
DEĞİL — seçim/kombinasyon/fiyat kodu bunu varsayar. Konfigüratörü local'de
sadece `localhost:3000`'de test edin (Sanity CORS).

## Konvansiyonlar

- **Dil:** Kod yorumları ve commit'ler bu projede genelde **Türkçe**
  yazılıyor (kod/değişken adları İngilizce kalıyor). Bu tutarlılığı koru.
- **Stil:** Tailwind, özel `bureau.*` renk paleti (`white, black, ink,
  muted, subtle, rule, surface, amber, amber-dim`; temaya duyarlı — bkz.
  kural 13). Yeni bir renk eklemeden önce bu paletten birinin işe yarayıp
  yaramadığına bak. Yeni UI'ı hem karanlık hem aydınlık temada kontrol et.
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
(4) iki paralel Sanity sorgusunun senkronsuz kalması, (5) PayTR format
tuzakları (oid, "TL", tek IP, mutlak dönüş URL'i), (6) str_replace ile
düzenlerken bir dosyanın SADECE bir kısmını (örn. `body` seçicisini) güncelleyip
CSS'te aynı özelliğin başka bir seçicide de (`pre`, `.qr-row`) tekrarlandığını
unutmak — CSS/stil değişikliklerinde `grep -n "aranan-özellik"` ile TÜM
eşleşmeleri kontrol et, ilkini bulup durma.

## Bu dosyayı güncelleme

Yeni bir "bunu bir daha yapma" dersi çıkardığında (özellikle saatler süren
bir debug sonrası), buraya kısa bir madde ekle. Bu dosya ne kadar spesifik
kalırsa, gelecekteki AI oturumları o kadar az zaman kaybeder.
