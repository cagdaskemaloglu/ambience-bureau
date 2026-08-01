# CURRENT_STATUS.md — The Ambience Bureau

> Bu dosya bir "an fotoğrafı"dır. Her önemli değişiklik sonrası güncelleyin
> — özellikle "Bilinen Eksikler" ve "Manuel Adım Gerektirenler" bölümlerini.
> Tarih damgası olmayan bir CURRENT_STATUS.md hızla yanıltıcı hale gelir;
> güncellediğinizde en üstteki tarihi de güncelleyin.

**Son güncelleme:** Bu dokümantasyon setinin ilk oluşturulduğu tarih
itibarıyla (2026 Temmuz sonu civarı).

---

## Çalışan / Tamamlanmış Özellikler

- ✅ TR/EN i18n routing (`proxy.ts` düzeltmesiyle çalışıyor)
- ✅ Registry (hazır ürün) ve Custom Registry (3D konfigüratör) satış akışları
- ✅ iyzico ödeme entegrasyonu, sipariş yaşam döngüsü (`pending → received →
  processing → shipped → delivered`)
- ✅ Otomatik belge üretimi (Sertifika, Ürün Kartı, Garanti) — admin
  siparişi "İşleniyor"a aldığında tetikleniyor, Vercel'de çalışıyor
  (Puppeteer + chromium-min sorunları çözüldü)
- ✅ Ürün Kimlik Sayfası (`/dossier/[certificateNo]`) — genel erişilebilir
- ✅ Sipariş durum e-postaları (Hazırlanıyor / Kargoya Verildi), dil
  para birimine göre (USD→EN, TRY→TR)
- ✅ Hesap sayfası: profil düzenleme, sipariş takibi, "Teslim Aldım"
- ✅ Admin panel: durum yönetimi, koleksiyon adı + telefon + adres +
  dossier linki gösterimi
- ✅ Sepet temizleme (çıkışta), şifre göster/gizle (login/signup)
- ✅ Custom Registry: koleksiyon bazlı Donanım Tahsisi/IoT ücretleri (Sanity)
- ✅ Custom Registry paneli: genişletilmiş panel, kompakt fiyat çubuğu,
  küçültülmüş thumbnail'lar, daire renk swatch'ları
- ✅ Custom Registry Tutorial (masaüstü + mobil, gerçek arayüz işaretleme)
- ✅ 3D sahne: gradient arka plan (Bloom/screenshot uyumlu), lamba ışığı
  glow efekti (emissive + Bloom)
- ✅ SEO: `sitemap.ts`, `robots.ts` (önceden hiç yoktu)
- ✅ Nav çevirileri (Özel Tahsis, Envanter, Kontrol Protokolü, Büro, Arşiv)
- ✅ Control Protocol sayfasında mobil uygulama tanıtımı (iPhone mockup,
  TR/EN ayrı ekran görüntüleri)
- ✅ Privacy Policy / Terms of Use sayfaları (mobil uygulama için,
  App Store/Play Store başvurusu amaçlı)

---

## ⚠️ Bilinen Eksikler / Manuel Adım Gerektirenler

### 1. Supabase şeması `schema.sql` ile senkron DEĞİL
`order_items.certificate_no`, `order_documents` tablosu, `orders.locale`/
`tracking_number`/`admin_note`, `order_status` enum'una `received` eklenmesi
— bunların hepsi canlı veritabanına **elle çalıştırılan ayrı SQL
snippet'leriyle** uygulandı, ama `supabase/schema.sql` dosyasına geri
yazılmadı. **Yapılması gereken:** bu migration'ları `schema.sql`'e
konsolide edin (ya da `supabase/migrations/00X_*.sql` şeklinde ayrı
dosyalar olarak repoya ekleyin), aksi halde yeni bir ortamda (staging,
yeni geliştirici) `schema.sql`'i çalıştıran biri eksik bir şema elde eder.

### 2. App Store / Google Play QR görselleri eksik
`public/documents/app-store-qr.png` ve `google-play-qr.png` henüz
eklenmedi (sadece açıklamalı bir `README.txt` var). Eklenene kadar Ürün
Kartı arka yüzünde bu alanlarda `[ QR ]` placeholder'ı görünmeye devam
ediyor — üretim akışını bozmuyor, sadece eksik görsel.

### 3. `public/parts/stl/` klasörünün amacı netleşmedi
Projede bu klasörde STL dosyaları var ama **kodun hiçbir yerinde
referans edilmiyor**. Konfigüratör tüm parça URL'lerini Sanity CDN'den
çekiyor. Bu dosyalar muhtemelen ya Sanity'ye yükleme öncesi bir hazırlık
klasörü, ya da mobil uygulamanın doğrudan kullanması planlanan ama henüz
bağlanmamış bir kaynak. **Netleştirilmesi gerekiyor** (bkz. `TASKS.md`).

### 4. Mobil uygulama <-> web sitesi arasında programatik bağlantı yok
Mobil uygulama (ESP32 kontrolü) bu repodan tamamen ayrı. Web sitesinde:
- Her `lampPart`'ın STL/GLB dosyası **genel, kimlik doğrulamasız** bir
  Sanity CDN URL'inde duruyor.
- Ama "bu müşterinin satın aldığı TAM tasarım hangi parça+malzeme
  kombinasyonundan oluşuyor, uygulama bunu nasıl öğrenip doğru STL'leri
  çekecek" sorusuna cevap veren **hiçbir API endpoint'i yok**.
- `custom_designs.design_data` (parts array) doğru veri kaynağı olurdu,
  ama şu an sadece web'in kendi checkout akışında yazılıyor, dışarıya
  (GET ile) hiç sunulmuyor.
- Bu konu kullanıcıyla konuşuldu ama **karara bağlanmadı** — bkz. `TASKS.md`.

### 5. Admin panel yetkilendirmesi basit
`/api/admin/*` route'ları Supabase Auth rolüne değil, basit bir
header-token kontrolüne dayanıyor gibi görünüyor. Üretim ortamı için
gözden geçirilip güçlendirilmesi (örn. `profiles.role = 'admin'` kontrolü
+ RLS) önerilir.

### 6. Footer, mobilde gizli
`Footer.tsx` → `hidden sm:block` — küçük ekranlarda Privacy Policy/Terms
of Use linkleri de dahil footer hiç görünmüyor (önceden alınmış bir
tasarım kararı). App Store/Play Store başvurusu için sorun değil
(URL'ler doğrudan veriliyor), ama normal mobil ziyaretçiler bu sayfalara
site içi navigasyondan ulaşamıyor.

### 7. Blog / Archive sayfası yarım
Sanity'de `post.ts` şeması ve `getAllPostSlugs()` sorgusu var ama
`/blog/[slug]` gibi bir route hiç yazılmadı. `/[locale]/archive` sayfası
farklı bir amaca hizmet ediyor (satın alınan ürünler, hesap sayfasındaki
"Ürün Arşivi" ile karıştırılmamalı — bunlar aynı isimde ama farklı 2 şey
olabilir, kontrol edin).

### 8. Bloom/ışık ayarları "başlangıç noktası" olarak bırakıldı
`LightSimulator.tsx`'teki `MAX_INTENSITY`, `ModelMesh.tsx`'teki
`MAX_HEAD_GLOW`, `Scene.tsx`'teki Bloom parametreleri (`luminanceThreshold`,
`intensity`, `radius`) test edilip görsel olarak beğenilene kadar ince
ayar gerektirebilir; kod yorumlarında bu açıkça belirtiliyor.

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

---

## Bu Dosyayı Nasıl Güncel Tutarsınız

Her önemli PR/değişiklik sonrası kendinize sorun:
1. Yeni bir migration mı çalıştırdınız? → §"Bilinen Eksikler #1"i güncelleyin
   veya migration'ı schema.sql'e işleyip maddeyi kaldırın.
   yenisi eklendiyse.
2. Yeni bir "elle yapılması gereken" adım mı ortaya çıktı (örn. yeni bir
   env değişkeni, yeni bir Sanity alanı doldurulmalı)? → yeni madde ekleyin.
3. Bir eksik kapandıysa → o maddeyi silin, "Çalışan Özellikler" listesine
   taşıyın.
