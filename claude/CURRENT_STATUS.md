# CURRENT_STATUS.md — The Ambience Bureau

> Bu dosya bir "an fotoğrafı"dır. Her önemli değişiklik sonrası güncelleyin
> — özellikle "Bilinen Eksikler" ve "Manuel Adım Gerektirenler" bölümlerini.
> Tarih damgası olmayan bir CURRENT_STATUS.md hızla yanıltıcı hale gelir;
> güncellediğinizde en üstteki tarihi de güncelleyin.

**Son güncelleme:** 2026-11-21 (`96f72e4` — "Light Mode Drop Card and
Sorting Priority" commit'i itibarıyla).

---

## Çalışan / Tamamlanmış Özellikler

### Satış ve ödeme
- ✅ TR/EN i18n routing (`proxy.ts`); ilk ziyarette dil ülkeye göre
  seçiliyor (TR → Türkçe, diğer → İngilizce)
- ✅ Registry (hazır ürün) ve Custom Registry (3D konfigüratör) satış akışları
- ✅ **PayTR ödeme entegrasyonu** (iFrame API + `paytr-notify` bildirim
  uç noktası) — iyzico'nun yerini aldı (Ekim 2026)
- ✅ Sipariş yaşam döngüsü (`pending → received → processing → shipped →
  delivered`)
- ✅ Bureau Credits (checkout'ta harcama, siparişte %10 kazanım, admin'den
  elle kredi verme, hesapta "Kredi Geçmişi")
- ✅ Ürün indirimleri (`discountPriceTRY/USD` — üstü çizili eski fiyat)
- ✅ Ürün aktif/pasif anahtarı (`product.active`)

### Drop sistemi
- ✅ Sanity `drop` şeması; anasayfa drop satırları (DROP-000 yayında,
  DROP-001 "yakında")
- ✅ Zamanlanmış yayın + geri sayım (`UpcomingDropRow`), otomatik yayına geçiş
- ✅ Drop numaraları, `plannedQuantity` ile stok sınırı (checkout'ta
  "stok tükendi")
- ✅ Drop'a özel Donanım Tahsisi/IoT ücreti (koleksiyon ücretini ezer)
- ✅ Drop başlığında "N Farklı Kombinasyon" sayacı; ürün sıralaması için
  `priority` alanı
- ✅ Custom Registry satışı → otomatik `owned` Sanity ürünü (sansürlü
  sahip adı + şehir, otomatik registry no)

### 3D / konfigüratör
- ✅ Custom Registry: koleksiyon bazlı ücretler, min/max gövde sayısı,
  gövde katmanı sıralama (`moveBodyLayer`)
- ✅ Ortak `material` kütüphanesi (parçalardan referansla), şeffaf malzeme
- ✅ Ölçü anotasyonları (genişlik/yükseklik/derinlik), kamerayı sığdır
  butonu, kombinasyon sayısı rozeti
- ✅ "Özelleştir" butonu (`?preset=<slug>`) — Registry ürününün tam
  kombinasyonunu konfigüratöre yükler
- ✅ Mobilde sekmeli konfigüratör paneli; tutorial'a bitiş adımı
- ✅ Registry kartlarında 360° spin-frame görünümü (Supabase
  `product-spins` + GitHub Actions ile otomatik üretim)
- ✅ Ürün kartında 3D görüntüleyici
- ✅ Yeni STL koleksiyonları: Orbital, Helical, Extruded

### Belgeler, hesap, admin
- ✅ Otomatik belge üretimi (Sertifika, Ürün Kartı, Garanti) — admin
  siparişi "İşleniyor"a aldığında tetikleniyor, Vercel'de çalışıyor
- ✅ App Store QR'ı artık doğrudan App Store linkinden üretiliyor
- ✅ Ürün Kimlik Sayfası (`/dossier/[certificateNo]`) — genel erişilebilir
- ✅ Sipariş durum e-postaları, dil para birimine göre (USD→EN, TRY→TR)
- ✅ Hesap sayfası: profil, sipariş takibi, "Teslim Aldım", Ürün Arşivi,
  Kredi Geçmişi
- ✅ Admin panel: durum yönetimi, kredi verme, servis talepleri

### Site genel
- ✅ Karanlık/aydınlık tema (varsayılan karanlık), tema geçiş düğmesi
- ✅ Header çöp adam animasyonu (`HeaderStickman`)
- ✅ Kompakt footer, App Store / Google Play rozetleri
- ✅ Bölge Bürosu Ol (dünya haritalı) ve Tasarım Departmanına Katıl
  başvuru sayfaları (`applications` tablosu)
- ✅ Arşiv (blog) sayfaları: `/archive`, `/archive/[slug]`
- ✅ Yasal sayfalar: Privacy Policy, Terms of Use, Mesafeli Satış
  Sözleşmesi, Kargo & İade
- ✅ Control Protocol sayfasında uygulama tanıtımı — TR/EN ekran
  görüntüleri yerinde
- ✅ SEO: `sitemap.ts`, `robots.ts`

---

## ⚠️ Bilinen Eksikler / Manuel Adım Gerektirenler

### 1. Supabase şeması `schema.sql` ile senkron DEĞİL
Canlı veritabanına elle uygulanıp `supabase/schema.sql`'e geri
yazılmayanlar:
- `order_items.certificate_no`, `order_documents` tablosu
- `orders.locale` / `tracking_number` / `admin_note`
- `order_status` enum'una `received`
- Bureau Credits: `profiles.bureau_credits_try/usd`,
  `orders.bureau_credits_used/credits_earned`, `grant_bureau_credits` RPC'si
- `service_requests` tablosu
- Supabase Storage bucket'ları: `documents`, `product-spins`

`applications` tablosu ayrı bir dosyada (`supabase/applications.sql`)
duruyor, ama `supabase/README.md`'deki kurulum adımlarında geçmiyor.
**Yapılması gereken:** bunları `supabase/migrations/00X_*.sql` dosyaları
olarak repoya ekleyin ve README'yi güncelleyin; aksi halde yeni bir
ortamda eksik şema elde edilir.

### 2. Google Play QR görseli eksik
App Store QR'ı artık linkten üretiliyor. Google Play QR'ı hâlâ
`public/documents/google-play-qr.png` dosyasını bekliyor (klasörde sadece
`README.txt` var). Eklenene kadar Ürün Kartı arka yüzünde `[ QR ]`
placeholder'ı görünür.

### 3. Checkout fiyatları istemciden geliyor
`/api/checkout`, kalem fiyatlarını (`priceTRY`/`priceUSD`) sepetten
(tarayıcıdan) olduğu gibi alıyor; sunucuda Sanity fiyatıyla
karşılaştırılmıyor. Kötü niyetli biri isteği değiştirip düşük fiyatla
ödeme başlatabilir. Sunucuda ürün fiyatını Sanity'den yeniden okuyup
hesaplamak gerekiyor (custom tasarımlar için de parça fiyatlarından).

### 3b. Daimi Envanter ürünleri henüz girilmedi
Kod hazır (`saleMode: standing`, sınıflar, stok); Sanity'de henüz hiç
Daimi Envanter ürünü yok, anasayfadaki sınıflar "Kayıt açılıyor"
damgasıyla görünüyor.

### 4. iyzico kalıntıları temizlenmedi
- `src/app/api/checkout/callback/route.ts` → 410 dönüyor, "güvenle
  silinebilir" notu var.
- `src/app/api/iyzico-test/route.ts` → 404 dönen ölü uç nokta.
- `src/components/checkout/IyzicoPaymentForm.tsx` ve `iyzipay-ts` paketi
  kullanılmıyor.
- `orders.iyzico_payment_id` / `iyzico_token` kolonları PayTR verisini
  taşıyor (isimler yanıltıcı).
- `product.ts` şemasında hâlâ "iyzico checkout'ta…" diyen eski bir yorum var.

### 5. `.env.local.example` eksik
Kodun kullandığı ama örnek dosyada olmayan değişkenler: `ADMIN_API_SECRET`,
`GITHUB_REPO`, `GITHUB_ACTIONS_TOKEN` (spin-frame otomasyonu),
`CONTACT_EMAIL` (başvuru/iletişim e-postası). Vercel'de tanımlı olup
olmadıklarını da kontrol edin — `GITHUB_*` yoksa spin-frame'ler sessizce
üretilmez.

### 6. Mobil uygulama <-> web sitesi arasında programatik bağlantı (kısmi)
- **Var olan:** uygulama STL dosyalarını sitenin `public/parts/stl/`
  klasöründen (`manifest.json` ile) indiriyor. Bu klasör silinmemeli.
- **Olmayan:** "bu müşterinin satın aldığı tam tasarım hangi parça+malzeme
  kombinasyonu" sorusuna cevap veren bir API. `custom_designs.design_data`
  ve artık Sanity'deki `owned` ürünlerin `configuratorParts` alanı doğru
  veri kaynakları olurdu ama dışarıya sunulmuyor.
- STL'ler iki yerde tutuluyor (Sanity CDN = konfigüratör, `public/parts/stl`
  = uygulama); yeni parça eklerken ikisinin de güncellenmesi gerekiyor.

### 7. Admin panel yetkilendirmesi basit
`/api/admin/*` route'ları `x-admin-secret` header'ını `ADMIN_API_SECRET`
ile karşılaştırıyor. Supabase Auth rolü + RLS ile güçlendirilmesi önerilir.

### 8. Bloom/ışık ayarları "başlangıç noktası" olarak bırakıldı
`LightSimulator.tsx`'teki `MAX_INTENSITY`, `ModelMesh.tsx`'teki
`MAX_HEAD_GLOW`, `Scene.tsx`'teki Bloom parametreleri (`luminanceThreshold`,
`intensity`, `radius`) test edilip görsel olarak beğenilene kadar ince
ayar gerektirebilir.

### 9. Repoda büyük ikili dosya
`backup.tar.gz` (~24 MB) git'e commit edilmiş. Repo boyutunu şişiriyor;
gerekmiyorsa repodan çıkarılıp `.gitignore`'a eklenmeli.

---

## Sık Karşılaşılan ve Çözülmüş Hatalar (tekrar düşmeyin)

| Hata | Kök Neden | Çözüm |
|---|---|---|
| Anasayfa 404 | `proxy.ts` (middleware) hiç yoktu | `src/proxy.ts` eklendi |
| "Both middleware file and proxy file are detected" | Next.js 16'da dosya adı `proxy.ts` olmalı, fonksiyon adı `proxy` olmalı | Doğru konvansiyona geçildi |
| Sayfa hep yanlış dilde görünüyor | `params` Promise olduğu halde senkron okunuyordu (`params.locale`) | `await params` kalıbına geçildi |
| `libnss3.so: cannot open shared object file` | `@sparticuz/chromium-min`, Vercel'i AWS Lambda sanmıyor (env değişkeni eksik) | `AWS_LAMBDA_JS_RUNTIME` manuel set edildi |
| PDF'lerde Bloom/ışık efekti kayboluyor | `useScreenshot.ts` manuel `gl.render()` ile post-processing'i atlıyordu | Manuel render kaldırıldı |
| Custom Registry ışığı hiç görünmüyor | Three.js fiziksel candela birimleri, point light'ı gerçekçi mesafede etkisiz kılıyor | Başlık parçasına emissive glow + Bloom eklendi |
| `getAllLampCollections()` donanım ücretlerini dönmüyor | İki paralel Sanity sorgusundan sadece biri güncellenmişti | İkisi de senkron edildi |
| PayTR token hatası / bildirim eşleşmiyor | `merchant_oid` tire kabul etmiyor; para birimi "TL" olmalı; `user_ip` tek IP olmalı; dönüş URL'leri locale'siz `undefined/tr/...` üretiyordu | `toPaytrOid`/`fromPaytrOid`, `TL` eşlemesi, ilk IP, URL fallback'i |
| PayTR panelinin test bildirimi hata veriyor | Sahte `merchant_oid` için 500 dönülüyordu, PayTR sürekli tekrar deniyordu | Bulunamayan siparişte de `OK` dönülüyor; sadece geçici DB hatasında 500 |
| Tema açılışta bir anlığına yanlış görünüyor | Hydration öncesi script ile `ThemeProvider` mantığı farklıydı | İkisi birebir aynı tutuluyor (`layout.tsx` ↔ `ThemeProvider.tsx`) |

---

## Bu Dosyayı Nasıl Güncel Tutarsınız

Her önemli PR/değişiklik sonrası kendinize sorun:
1. Yeni bir migration mı çalıştırdınız? → "Bilinen Eksikler #1"i güncelleyin
   veya migration'ı repoya işleyip maddeyi kaldırın.
2. Yeni bir "elle yapılması gereken" adım mı ortaya çıktı (örn. yeni bir
   env değişkeni, yeni bir Sanity alanı doldurulmalı)? → yeni madde ekleyin.
3. Bir eksik kapandıysa → o maddeyi silin, "Çalışan Özellikler" listesine
   taşıyın.
4. En üstteki tarihi ve commit'i güncelleyin.
