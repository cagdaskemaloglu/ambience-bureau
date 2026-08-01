# ARCHITECTURE.md — The Ambience Bureau

Teknik derinlemesine referans. Sıralama: stack → routing/i18n → veri
modeli (Supabase + Sanity) → sipariş yaşam döngüsü → belge üretimi →
3D konfigüratör → auth/sepet → deployment notları.

---

## 1. Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| Framework | Next.js 16 (App Router, React 19) |
| Dil | TypeScript |
| Stil | Tailwind CSS (özel `bureau.*` renk paleti — bkz. `tailwind.config.ts`) |
| i18n | `next-intl` (locale: `tr` \| `en`, `localePrefix: 'always'`) |
| Veritabanı / Auth | Supabase (Postgres + Supabase Auth + Storage) |
| CMS | Sanity (`sanity` + `next-sanity`) — ürünler, koleksiyonlar, lamba parçaları, blog |
| 3D | `three` + `@react-three/fiber` + `@react-three/drei` + `@react-three/postprocessing` |
| State (client) | Zustand (`cart` store, `configurator` store) |
| Ödeme | iyzico (`iyzipay-ts`, Checkout Form akışı) |
| E-posta | Resend (`resend` + `react-email` şablonları) |
| PDF üretimi | Puppeteer (`puppeteer-core` + `@sparticuz/chromium-min`) + `pdf-lib` (birleştirme) |
| Deployment | Vercel (serverless functions, Next.js 16 `proxy.ts` konvansiyonu) |

---

## 2. Routing ve i18n

```
src/proxy.ts                 ← Next.js 16'nın "middleware.ts" karşılığı
src/i18n/routing.ts           ← locales: ['tr','en'], defaultLocale:'tr'
src/i18n/navigation.ts        ← next-intl'in Link/useRouter/usePathname sarmalayıcıları
src/app/[locale]/...          ← TÜM sayfalar bu segment altında
src/app/api/...               ← API route'ları (locale segmentinin DIŞINDA)
src/app/auth/callback/route.ts ← Supabase OAuth callback (locale-agnostic olmalı)
src/app/studio/[[...tool]]/page.tsx ← Sanity Studio (gömülü, /studio altında)
```

### KRİTİK — `proxy.ts` (eski adıyla `middleware.ts`)

Next.js 16, `middleware.ts` dosya konvansiyonunu **`proxy.ts`** olarak,
export edilen fonksiyon adını **`middleware` → `proxy`** olarak değiştirdi.
Bu proje bu dosyayı **hiç içermiyordu** bir dönem — sonucu:
1. Çıplak `/` kök domain 404 dönüyordu (locale'e yönlendirilmiyordu).
2. `src/lib/supabase/middleware.ts`'teki `updateSupabaseSession` hiç
   çağrılmıyordu; tarayıcı session cookie'leri yenilenmiyordu.
3. `<html lang="tr">` sabit kodluydu (İngilizce sayfalarda bile).

`src/proxy.ts` üçünü de çözüyor: next-intl routing'i çalıştırıyor, algılanan
locale'i `x-locale` response header'ına yazıyor (root `layout.tsx` bunu
`headers()` ile okuyup `<html lang>` için kullanıyor), ve Supabase session
yenilemesini tetikliyor. Bu dosyayı yanlışlıkla silmeyin/adını
`middleware.ts`'e geri çevirmeyin; build'i kırar ("Both middleware file
and proxy file are detected" hatası).

`matcher`: `/api`, `/auth`, `/studio`, `/_next`, `/_vercel` ve uzantılı
(statik) dosyalar hariç her yolu kapsar.

### Locale-bağımlı diğer davranışlar
- `currency = locale === 'tr' ? 'TRY' : 'USD'` (checkout formunda türetilir).
- Sipariş/durum e-postalarının dili **currency**'ye göre (locale'e göre
  DEĞİL) seçilir — bkz. `src/app/api/checkout/callback/route.ts` ve
  `src/app/api/admin/orders/route.ts` içindeki `emailLocale`.
- Next.js 16 kalıbı: **her sayfa/route'ta `params` bir `Promise`'dır** —
  `const { locale } = await params`. Eski senkron kalıp (`params.locale`)
  sessizce `undefined` döner (hata vermez!) — bunu atlarsanız sayfa her
  zaman ilk koşulun `false` dalına düşer (örn. her zaman İngilizce
  görünür). Yeni bir sayfa eklerken MUTLAKA
  `params: Promise<{ locale: string }>` + `await params` kalıbını kullanın.

---

## 3. Supabase Veri Modeli

`supabase/schema.sql` temel şemayı içerir, ama canlı veritabanına bu
projenin geliştirme sürecinde elle uygulanan ek migration'lar `schema.sql`'e
geri yazılmadı (bkz. `CURRENT_STATUS.md` → "Şema Senkron Sorunu").
Aşağıdaki tablo GERÇEK/güncel şemayı (temel dosya + sonradan eklenenler)
yansıtıyor:

### `profiles` (auth.users ile 1:1)
`id, email, full_name, phone, address_line1/2, city, postal_code, country,
locale, marketing_opt, created_at, updated_at`

### `orders`
Temel dosyada: `id, order_number (TAB-2026-xxxxx), user_id, guest_email,
subtotal, vat_amount, shipping_amount, total_amount, currency, status,
shipping_name/phone/address1/2/city/postal/country, iyzico_payment_id,
iyzico_token, paid_at, notes, created_at, updated_at`

**+ Sonradan eklenen (migration, schema.sql'de YOK):**
- `locale TEXT DEFAULT 'tr'` — checkout'taki site dili; belge üretimi
  hangi dilde yapılacağını buradan okur.
- `tracking_number TEXT` — admin panelinden girilen kargo takip no.
- `admin_note TEXT`

**`order_status` enum'u** (migration ile genişletildi):
```
pending → received → processing → shipped → delivered
                                          -> cancelled / refunded
```
`received` sonradan eklendi. Akış: `pending` (ödeme bekleniyor) →
callback'te ödeme başarılıysa **`received`**'a geçer (belge üretimi
BURADA tetiklenmez) → admin panelinden **`processing`**'e alınınca
Sertifika/Ürün Kartı/Garanti belgeleri üretilir → `shipped` (takip no
girilebilir) → `delivered` (admin ya da müşterinin "Teslim Aldım"
butonuyla).

### `order_items`
`id, order_id, item_type ('product'|'custom'), sanity_product_id,
registry_no, product_name, unit_price, quantity, total_price,
custom_design_id, created_at`

**+ Sonradan eklenen:** `certificate_no TEXT UNIQUE` — her satın alma için
otomatik üretilen tekil, tahmin edilemez kimlik (`AB-CERT-2026-XXXXXXXX`,
trigger ile). ÖNEMLİ: `registry_no` ürüne ait bir alan — genel/paylaşılan
bir link için asla `registry_no` kullanılmaz, her zaman `certificate_no`.

### `custom_designs`
`id, user_id, guest_session_id, collection_key, design_data (JSONB: {parts:
[{slotType, partId, materialId, color, price}]}), total_price,
snapshot_url, status ('draft'|'ordered'|'archived'), design_ref
(FORM-104B-xxxxx), created_at, updated_at`

### `order_documents` (migration ile eklendi, schema.sql'de YOK)
```
id, order_item_id (FK), doc_type ('certificate'|'product_card'|'warranty'),
locale, pdf_url (Supabase Storage public URL), generated_at
UNIQUE (order_item_id, doc_type)
```
Storage bucket: `documents` (public).

### Trigger'lar / otomatik üretilen alanlar
- `orders.order_number` <- `generate_order_number()` (`TAB-YYYY-XXXXX`)
- `custom_designs.design_ref` <- `generate_design_ref()` (`FORM-104B-XXXXXX`)
- `order_items.certificate_no` <- `generate_certificate_no()` (`AB-CERT-YYYY-XXXXXXXX`)
- `profiles` satırı, yeni `auth.users` kaydı oluşunca otomatik açılır
  (`handle_new_user()` trigger'ı).

---

## 4. Sanity CMS Veri Modeli

`src/sanity/schemaTypes/`:

### `product.ts` — Registry ürünleri
Alanlar: `registryNo` (benzersiz seri no, örn. "007/050" — tek fiziksel
parçayı temsil eder), `slug`, `status` (`decommissioned` dahil — satılan
ürün bu duruma alınır), lokalize `name`/`shortDescription`/`description`,
`images[]`, `category`, `collection` (ref), `priceTRY`/`priceUSD`,
`specs[]` (key-value), `photonOutput`, `netWeightKg`, `firmwareVersion`,
`assetSubtype` (belge üretimi için — Ürün Kartı/Sertifika şablonlarında
kullanılır), `compatibility`, `isConfigurable` + `configuratorCollection`
(bu ürün Custom Registry'de de mi tasarlanabilir), `seo`.

### `collection.ts` — Koleksiyonlar (hem Registry hem Custom Registry'yi gruplar)
`key` (slug, `custom_designs.collection_key` ile eşleşir),
lokalize `name`/`description`, `coverImage`, `sortOrder`,
`hardwareBaseFeeTRY`, `hardwareBaseFeeUSD`, `iotFeeTRY`, `iotFeeUSD`
— Custom Registry'deki "Donanım Tahsisi" ücretleri kod içinde sabit
DEĞİL, koleksiyon bazında buradan yönetilir (bkz. §7).

### `lampPart.ts` — Custom Registry parça kütüphanesi
`partId`, lokalize `name`/`description`, `slotType` (`base`|`body`|`head`),
`collections[]` (hangi koleksiyonlarda kullanılabilir), `modelFile`
(Sanity file asset — STL/GLB, genel/herkese açık CDN URL'i verir),
`thumbnail`, `dimensions`, `materials[]` (her biri `materialId`, lokalize
`label`, `color`, `roughness`, `metalness`, `priceModifierTRY/USD`,
`thumbnail`), `basePriceTRY/USD`, `sortOrder`.

DİKKAT: `modelFile.asset->url`, kimlik doğrulamasız, genel bir Sanity CDN
linkidir. URL'i bilen herkes STL/GLB dosyasını indirebilir. Şu an bunun
"sorun" olup olmadığı (mobil uygulamanın bu dosyalara nasıl eriştiği)
netleşmedi — bkz. `CURRENT_STATUS.md`.

### `post.ts` — Blog (Archive sayfası için şema var, ama sayfa henüz yok)
`getAllPostSlugs()` sorgusu `src/lib/queries.ts`'te tanımlı ama hiçbir
`/blog/[slug]` route'u kodda mevcut değil — ölü kod / yarım kalmış özellik.

### Sanity sorgu dosyası: `src/lib/queries.ts`
İki paralel "tüm koleksiyonları getir" fonksiyonu var, ikisi de
donanım/IoT ücret alanlarını dönmeli:
- `getAllCollections()` — admin panelinde kullanılır.
- `getAllLampCollections()` — Custom Registry sayfasında kullanılır
  (sadece en az 1 `lampPart`'ı olan koleksiyonları filtreler).

Yeni bir alan eklerken ikisini de güncellemeyi unutmayın; bu projede bir
kez bu ikisi birbirinden geride kalmıştı (bkz. `CURRENT_STATUS.md`).

---

## 5. Sipariş Yaşam Döngüsü (uçtan uca)

```
1. Müşteri sepete ürün/custom tasarım ekler (Zustand cart store, localStorage)
2. /checkout -> CheckoutForm.tsx -> POST /api/checkout
   - createOrder() ile 'pending' durumunda sipariş açılır (orders.locale kaydedilir)
   - iyzico Checkout Form init edilir, kullanıcı iyzico'ya yönlenir
3. Ödeme sonrası iyzico -> POST /api/checkout/callback
   - Ödeme başarılıysa status: 'pending' -> 'received'
   - Sipariş onay e-postası gönderilir (dil: currency'ye göre)
   - Bureau Credits düşümü/kazanımı işlenir (üye siparişlerinde)
   - Belge üretimi BURADA TETİKLENMEZ (bilinçli tasarım -- müşterinin
     ödeme sonrası bekleme süresini kısaltmak için admin'in 'processing'e
     almasına ertelendi)
4. Admin panelinden (/admin, PATCH /api/admin/orders) durum 'processing'e
   alınır:
   - generateOrderDocuments() TETİKLENİR (Sertifika+Ürün Kartı+Garanti PDF)
   - "Siparişiniz Hazırlanıyor" e-postası gönderilir
5. Admin durumu 'shipped'e alır (tracking_number girebilir):
   - "Siparişiniz Kargoya Verildi" e-postası (+ takip no)
6. 'delivered'a geçiş: admin panelinden VEYA müşteri "Siparişlerim"
   sekmesinde "Teslim Aldım" butonuyla (POST /api/account/confirm-delivery
   -- sahiplik + 'shipped' durumda olma kontrolü sunucu tarafında yapılır)
```

Durum çevirileri her yerde (admin panel, müşteri hesap sayfası) aynı
sözlükle (`ORDER_STATUS` / `STATUS_LABELS`) gösterilir; yeni bir durum
eklerseniz her iki yerde de güncelleyin.

---

## 6. Belge Üretim Pipeline'ı (`src/lib/documents/`)

```
generateOrderDocuments(order, locale)
  -> withBrowser(async (browser) => {          // TEK paylaşılan Puppeteer instance
       for (item of order.order_items) {
         buildDocumentData(...)                 // ürün/custom_design verisini toplar
         fillTemplate(...)                       // HTML şablonundaki {{token}}'ları doldurur
         htmlToPdfBuffer(browser, html)          // Puppeteer -> PDF
         mergeHtmlPagesToPdf(...)                // Ürün Kartı: ön+arka -> tek 2 sayfalı PDF
         upload -> Supabase Storage 'documents' bucket
         order_documents tablosuna satır yazılır
       }
     })
```

### KRİTİK — Vercel'de Puppeteer çalıştırma (iki kademeli hata çözümü)

**Hata 1 — `libnss3.so: cannot open shared object file`:**
Kök neden paketleme değil, ortam tespiti. `@sparticuz/chromium-min`,
"AWS Lambda içinde miyim?" kontrolünü `AWS_EXECUTION_ENV` /
`AWS_LAMBDA_JS_RUNTIME` env değişkenlerine bakarak yapıyor. Vercel bu
değişkenleri set etmiyor (native AWS Lambda değil) -> paket kendini
"Lambda değilim" sanıp `libnss3.so`'yu içeren dosyayı hiç açmıyor.
Çözüm (`generatePdf.ts`): `process.env.AWS_LAMBDA_JS_RUNTIME ??=
'nodejs20.x'` — kütüphane zaten Netlify gibi platformlar için bu manuel
override'ı destekliyor.

**Hata 2 — Next.js file tracing:** `@sparticuz/chromium` (tam sürüm)
yerine `@sparticuz/chromium-min` kullanılıyor; Chromium binary'si build'e
gömülmek yerine `CHROMIUM_PACK_URL`'den (belirli bir GitHub release
sürümüne SABİTLENMİŞ) her cold start'ta indiriliyor. `next.config.ts`'te
`serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium-min']`
var; bu paketlerin Next'in kendi bundling'ine dahil edilmemesi için.

**Yerel geliştirme:** `NODE_ENV !== 'production' && !VERCEL` ise tam
`puppeteer` paketi (kendi Chromium'unu indirir) kullanılır.

**`useScreenshot.ts` ile ilişkisi:** Konfigüratörün ekran görüntüsü alma
hook'u, Bloom post-processing'i (bkz. §7) atlamamak için manuel
`gl.render()` çağırmıyor; canvas'ın zaten sürekli güncellenen son
karesini doğrudan `toDataURL()` ile yakalıyor.

### Şablonlar (`src/lib/documents/templates/{tr,en}/`)
4 belge tipi x 2 dil = 8 HTML dosyası: `certificate.html`,
`product-front.html`, `product-back.html`, `warranty.html`. Hepsi
`<pre>` tabanlı ASCII/monospace estetiğinde (Cutive Mono font),
`{{token}}` placeholder'ları `fillTemplate.ts` ile dolduruluyor. Ürün
Kartı ve Garanti kraft/saman rengi (`#f4ebd9`) zeminde, Sertifika de aynı;
Ürün Kartı beyaz zeminde (kullanıcı tercihiyle değiştirildi).

App Store/Google Play QR görselleri statik dosyalar olarak
`public/documents/{app-store-qr,google-play-qr}.png`'de bekleniyor; henüz
eklenmedi (bkz. `CURRENT_STATUS.md`).

---

## 7. 3D Konfigüratör (Custom Registry)

```
CustomRegistryClient.tsx          <- ana orkestratör (masaüstü/mobil layout ayrımı)
  |- CollectionPicker.tsx          <- koleksiyon seçimi
  |- ConfiguratorCanvas.tsx        <- <Scene> + <LampModel> + <LightSimulator> + <CameraFit>
  |    |- Scene.tsx                <- Canvas, gradient arka plan, Bloom, ışıklandırma, gölgeler
  |    |- LampModel.tsx            <- seçili parçaları dikey istifler, glow (emissive) mantığı
  |    |- ModelMesh.tsx            <- STL/GLTF yükleme + malzeme + glow damping
  |    |- LightSimulator.tsx       <- lambanın "kendi ışığı" (pointLight, yumuşak geçişli)
  |- ControlPanel.tsx (masaüstü) / MobileControlPanel.tsx (mobil)
  |    |- SlotPicker.tsx / MobileSlotPicker.tsx  <- parça seçimi (thumbnail grid)
  |    |- MaterialPicker.tsx       <- renk/malzeme seçimi (daire swatch'lar)
  |- ConfigSummary.tsx             <- fiyat özeti + "Tasarımı Kaydet" (compact/normal mod)
  |- CustomRegistryTutorial.tsx    <- ilk kez gelen/hiç sipariş vermemiş kullanıcı için
                                      gerçek arayüz elemanlarını işaret eden interaktif rehber
```

### State: `src/lib/store/configurator.ts` (Zustand)
`collectionKey, availableParts, hardwareFees (Sanity'den), base, body[],
head, lightColor, lightBrightness, lightEnabled, iotEnabled` +
action'lar (`setCollection`, `toggleSinglePart`, `addBodyPart`,
`removeBodyLayer`, `selectMaterial`, `toggleLight`, `toggleIot`, `reset`,
`getTotalPrice(locale)`, `isComplete()`).

### Fiyatlandırma mantığı (`getTotalPrice`)
```
toplam = SUM(parça taban fiyatı + malzeme fiyat farkı)
       + hardwareFees.base{TRY|USD}                    // her zaman eklenir
       + (iotEnabled ? hardwareFees.iot{TRY|USD} : 0)   // IoT açıksa ÜSTÜNE eklenir
```
`hardwareFees`, `setCollection()` çağrısında seçilen koleksiyonun Sanity
alanlarından gelir (`DEFAULT_HARDWARE_FEES` sadece alan boşsa devreye
giren bir varsayılan). Kod değişikliği olmadan fiyat güncellemek için
Sanity Studio'da ilgili koleksiyonun bu 4 alanını düzenlemek yeterli.

### Işıklandırma — neden karmaşık, ne öğrenildi
1. Three.js r155+ fiziksel olarak doğru ışıklandırma kullanıyor —
   point/spot light `intensity`'si candela biriminde, directional/
   ambient farklı bir ölçekte (lux'a yakın). Bir point light'ı sadece
   birkaç yüz/bin candela yapmak, gerçekçi mesafelerde ters kare
   kanunuyla neredeyse sıfıra düşer — "ışık hiç görünmüyor" şikayetinin
   kök nedeni buydu, `decay` ayarı değil.
2. Çözüm: Lambanın `head` (başlık) parçasının kendi malzemesi, ışık
   açıkken doğrudan emissive (parlak) yapılıyor (`ModelMesh.tsx`'teki
   `useGlowMaterial` — `useFrame` + `THREE.MathUtils.damp` ile yumuşak
   geçiş). Mesafeden bağımsız, garanti görünür. Ayrı bir görsel obje
   (küre/sprite) EKLENMEDİ — bilinçli tercih, "ışık mekanizması lambanın
   içine gömülü" ilkesi.
3. Bloom post-processing (`@react-three/postprocessing`) bu emissive
   yüzeyin "taşmasını/parıldamasını" büyütüyor — `Scene.tsx`'te
   `<EffectComposer><Bloom .../></EffectComposer>`.
4. `LightSimulator.tsx`'teki gerçek `pointLight` hâlâ var, zemin/çevreyi
   hafifçe aydınlatmaya devam ediyor ama ana görünür etki artık başlıktaki
   emissive glow.
5. Sahne arka planı düz renk değil, gradient bir doku (Three.js
   `CanvasTexture`, CSS DEĞİL) — çünkü ekran görüntüsü özelliği sadece
   WebGL canvas piksellerini yakalıyor; CSS arka plan kullansaydık ürün
   kartı/sepet görsellerinde arka plan hep düz/siyah çıkardı.

### Tutorial sistemi (`CustomRegistryTutorial.tsx`)
Gerçek arayüz elemanlarını (`data-tutorial="..."` attribute'u ile
işaretlenmiş) spot ışığıyla çerçeveleyip tıklama/dokunmayla ilerleten bir
rehber. Sunucu tarafında (`custom-registry/page.tsx`) misafirlere ve
"daha önce custom sipariş vermemiş üyelere" gösteriliyor; hem masaüstü
(`#tutorial-scope`) hem mobil (`#tutorial-scope-mobile`) için ayrı DOM
scope'ları var (aynı anda ikisi de DOM'da olduğu için hedef çakışmasını
önlemek amacıyla).

---

## 8. Auth, Sepet, Hesap

- **Auth:** Supabase Auth (email/şifre + magic link). `src/lib/supabase/auth.ts`.
  `signOut()` sepeti de temizler (statik import + doğrudan
  `localStorage.removeItem` — zustand persist rehydration ile çakışmaması
  için sağlamlaştırıldı). `Header.tsx`'teki `onAuthStateChange` listener'ı
  `SIGNED_OUT` olayında bağımsız bir ikinci güvenlik ağı olarak sepeti
  tekrar temizler.
- **Sepet:** `src/lib/store/cart.ts`, Zustand + `persist` (localStorage
  key: `tab-cart-storage`).
- **Hesap sayfası:** `/[locale]/account`, sekmeler: Durum (profil
  görüntüleme/düzenleme), Siparişlerim (görsel durum takibi + Teslim
  Aldım), Ürün Arşivi (satın alınmış ürünler + dossier linki), Kredi
  Geçmişi. Sekme durumu URL query param'ı (`?tab=`) ile senkron.

---

## 9. Admin Panel (`/[locale]/admin`)

Tek sayfa, API route'ları: `GET/PATCH /api/admin/orders`,
`POST /api/admin/grant-credits`, `/api/admin/service-requests`. Basit bir
header-token tabanlı yetkilendirme var (Supabase Auth rolü değil — kontrol
edin/güçlendirin gerekirse). Sipariş listesi artık: koleksiyon adı (custom
siparişlerde, Sanity'den), sipariş+hesap telefonu, tam adres (adres2+posta
kodu dahil), ve "processing/shipped/delivered" durumundaki siparişlerde
Ürün Kimlik Sayfası linkini gösteriyor.

---

## 10. SEO altyapısı

`src/app/sitemap.ts` ve `src/app/robots.ts` — ikisi de sonradan eklendi,
önceden hiç yoktu. `sitemap.ts`, statik sayfalar + Sanity'den
`getAllProductSlugs()` ile ürün detay sayfalarını, TR/EN hreflang
alternates ile listeler. `robots.ts`, `/admin`, `/account`, `/checkout`,
`/cart`, `/auth/`, `/dossier`, `/studio` yollarını disallow eder.

---

## 11. Statik/Yasal Sayfalar

`/[locale]/privacy-policy` ve `/[locale]/terms-of-use` — App Store/Play
Store başvurusu için eklendi. Ortak render bileşeni:
`src/components/legal/LegalDocument.tsx`. Bu sayfaların içeriği, ayrı bir
mobil uygulama projesindeki gizlilik/kullanım metinleridir (bu web sitesi
değil) — App Store Connect / Play Console'a her zaman `/en/...` URL'i
verilmeli (dil kodu URL'de açık olduğu için otomatik yönlendirme/algılama
devreye girmez).
