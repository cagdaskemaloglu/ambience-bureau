# ARCHITECTURE.md — The Ambience Bureau

Teknik derinlemesine referans. Sıralama: stack → routing/i18n → veri
modeli (Supabase + Sanity) → sipariş yaşam döngüsü → belge üretimi →
3D konfigüratör → auth/sepet → admin → SEO → statik sayfalar → drop
sistemi → spin-frame'ler → tema/header → başvurular → mobil uygulama ile
ilişki.

**Son gözden geçirme:** 2026-11-21 (`96f72e4` commit'i itibarıyla).

---

## 1. Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| Framework | Next.js 16 (App Router, React 19) |
| Dil | TypeScript |
| Stil | Tailwind CSS (özel `bureau.*` renk paleti — bkz. `tailwind.config.ts`) |
| i18n | `next-intl` (locale: `tr` \| `en`, `localePrefix: 'always'`) |
| Veritabanı / Auth | Supabase (Postgres + Supabase Auth + Storage) |
| CMS | Sanity (`sanity` + `next-sanity`) — ürünler, drop'lar, koleksiyonlar, lamba parçaları, malzemeler, blog (Arşiv) |
| 3D | `three` + `@react-three/fiber` + `@react-three/drei` + `@react-three/postprocessing` |
| Harita | `d3-geo` + `topojson-client` + `world-atlas` + `i18n-iso-countries` (Bölge Bürosu dünya haritası) |
| State (client) | Zustand (`cart` store, `configurator` store) |
| Ödeme | **PayTR** (iFrame API, `src/lib/paytr/client.ts`) — Ekim 2026'dan beri. iyzico anlaşması sona erdi; `iyzipay-ts` paketi ve `IyzicoPaymentForm.tsx` artık kullanılmayan kalıntılar |
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

### İlk ziyarette dil seçimi: ülkeye göre (geo)
`proxy.ts`, `NEXT_LOCALE` cookie'si **yoksa** (gerçekten ilk ziyaret)
Vercel'in `x-vercel-ip-country` header'ına bakar: `TR` → `tr`, diğer her
ülke → `en`. Karar 1 yıllık `NEXT_LOCALE` cookie'sine yazılır; sonraki
ziyaretlerde ve kullanıcı dili elle değiştirdiğinde geo-tespiti devreye
girmez. Bu header yerelde (`next dev`) yoktur — orada next-intl'in
varsayılan Accept-Language davranışı çalışır.

### Locale-bağımlı diğer davranışlar
- `currency = locale === 'tr' ? 'TRY' : 'USD'` (checkout formunda türetilir).
- Sipariş/durum e-postalarının dili **currency**'ye göre (locale'e göre
  DEĞİL) seçilir — bkz. `src/app/api/checkout/paytr-notify/route.ts` ve
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
- `bureau_credits_used`, `credits_earned` — Bureau Credits (aşağıda).

**PayTR notu:** Ayrı `paytr_*` kolonları AÇILMADI. `iyzico_payment_id` /
`iyzico_token` kolonları geçici olarak genel amaçlı yeniden kullanılıyor
(PayTR'nin `merchant_oid` ve `payment_type` değerlerini taşıyor — bkz.
`paytr-notify/route.ts`). Kolon adları yanıltıcı; yeni kod yazarken bunu
bilin.

### Bureau Credits (migration ile eklendi, schema.sql'de YOK)
`profiles.bureau_credits_try` / `bureau_credits_usd` bakiyeleri +
`grant_bureau_credits(p_user_id, p_amount, ...)` RPC'si. Üye siparişinde
checkout'ta kredi harcanabilir; ödeme onayında harcanan düşülür ve
ödenen tutarın **%10'u** kredi olarak kazanılır. Admin elle kredi
verebilir (`POST /api/admin/grant-credits`). Hesap sayfasında "Kredi
Geçmişi" sekmesi.

### `applications` (`supabase/applications.sql` — ayrı dosya)
"Bölge Bürosu Ol" (`type='hub'`) ve "Tasarım Departmanına Katıl"
(`type='creator'`) başvuruları. `user_id` zorunlu (başvuru için üyelik
şart), `country` ISO alpha-2, `details` JSONB, `status`
(`new|reviewing|approved|rejected`). RLS: üye yalnızca kendi
başvurusunu ekler/görür. Bu dosya `schema.sql`'e dahil değil, elle
çalıştırılmalı.

### `service_requests`
`/api/service-request` ve `/api/admin/service-requests` tarafından
kullanılıyor; tablosu da `schema.sql`'de yok (elle oluşturulmuş).

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

Kayıtlı tipler (`index.ts`): `product`, `post`, `lampPart`, `collection`,
`material`, `drop`.

### `product.ts` — Registry ürünleri
Alanlar: `active` (kapalıysa ürün sitede HİÇBİR yerde görünmez, sitemap
dahil — dossier sayfaları etkilenmez), `registryNo` (benzersiz seri no,
örn. "007/050" — tek fiziksel parçayı temsil eder; Studio'da
`RegistryNoHint.tsx` sıradaki numarayı öneriyor), `slug`, `status`:
- `certified` (satışta), `limited`, `decommissioned` (satıldı/üretimden kalktı),
- `owned` — Custom Registry'den tasarlanıp **satın alınmış**, bir
  müşteriye ait adet. Ödeme onayında kod tarafından otomatik oluşturulur
  (§5, §12). Yanında `ownerDisplayName` (sansürlü ad, örn. "Ça*** KE***" —
  `src/lib/nameCensor.ts`; misafirde rastgele üretilmiş ad), `ownerCity`,
  `ownerUserId` (opsiyonel, sadece üye siparişinde) alanları.

Ayrıca: lokalize `name`/`shortDescription`/`description`, `images[]`,
`category`, `collection` (ref), `drop` (ref, opsiyonel — boşsa anasayfa
drop satırlarında görünmez), `priority` (drop satırındaki sıra, küçük
önce; eşitse `registryNo`), `priceTRY`/`priceUSD`, `vatIncluded`,
`discountPriceTRY`/`discountPriceUSD` (opsiyonel indirim — kartta ve
detayda üstü çizili eski fiyat; mantık `src/lib/sanity.ts` →
`getPricingForLocale` / `getCartPricing`), `specs[]`, `photonOutput`,
`netWeightKg`, `firmwareVersion`, `assetSubtype` (belge şablonları için),
`compatibility`, `isConfigurable` + `configuratorCollection` +
`configuratorParts[]` (ürünün Custom Registry'deki TAM parça/malzeme
kombinasyonu — "Özelleştir" butonu ve spin-frame üretimi bunu kullanır),
`seo`, `publishedAt`.

### `drop.ts` — Sınırlı satış dalgaları (DROP-000, DROP-001…)
`active`, `scheduledAt` (zamanlanmış yayın), `dropNo`, lokalize `name`,
`collection` (ref — Custom Registry koleksiyonu), `sortOrder`,
`plannedQuantity` (toplam satılacak adet — registry no'nun paydası ve
checkout'taki stok sınırı), opsiyonel `hardwareBaseFeeTRY/USD` +
`iotFeeTRY/USD` (koleksiyon ücretini SADECE bu drop için ezer; `0` =
ücretsiz, boş = koleksiyonunki geçerli). Görünürlük mantığı için bkz. §12.

### `collection.ts` — Koleksiyonlar (hem Registry hem Custom Registry'yi gruplar)
`active`, `key` (slug, `custom_designs.collection_key` ile eşleşir),
lokalize `name`/`description`, `coverImage`, `sortOrder`,
`minBodyLayers` / `maxBodyLayers` (gövde katmanı sınırları; boşsa
0/5 — `DEFAULT_BODY_LIMITS`; `max = 0` Gövde sekmesini gizler),
`hardwareBaseFeeTRY`, `hardwareBaseFeeUSD`, `iotFeeTRY`, `iotFeeUSD`
— Custom Registry'deki "Donanım Tahsisi" ücretleri kod içinde sabit
DEĞİL, koleksiyon (ve gerekirse drop) bazında buradan yönetilir (bkz. §7).

### `material.ts` — Ortak malzeme kütüphanesi (yeni)
`materialId`, lokalize `label`, `color`, `isTranslucent` + `opacity`
(şeffaf malzeme), `roughness`, `metalness`, `priceModifierTRY/USD`,
`thumbnail`, `sortOrder`. Malzemeler artık bir kere tanımlanıp
parçalardan **referansla** seçiliyor (eskiden her parçanın içine gömülü
bir dizi idi). Göç script'i: `scripts/migrate-materials-to-references.ts`.

### `lampPart.ts` — Custom Registry parça kütüphanesi
`partId`, lokalize `name`/`description`, `slotType` (`base`|`body`|`head`),
`collections[]` (hangi koleksiyonlarda kullanılabilir), `modelFile`
(Sanity file asset — STL/GLB, genel/herkese açık CDN URL'i verir),
`thumbnail`, `dimensions` (mm), `materials[]` (**`material` belgelerine
referans**, en az 1), `basePriceTRY/USD`, `sortOrder`.

DİKKAT: `modelFile.asset->url`, kimlik doğrulamasız, genel bir Sanity CDN
linkidir. Mobil uygulama bu URL'leri KULLANMIYOR — kendi STL kaynağı
`public/parts/stl/` (bkz. §16).

### `post.ts` — Arşiv (blog) yazıları
`/[locale]/archive` (liste, `getAllPosts()`) ve `/[locale]/archive/[slug]`
(detay, `getPostBySlug()`) sayfaları bu şemayı kullanıyor. "Arşiv" =
herkese açık bülten/blog; hesap sayfasındaki "Ürün Arşivi" sekmesi
(satın alınan ürünler) ondan farklı bir şey.

### Sanity sorgu dosyası: `src/lib/queries.ts`
Önemli fonksiyonlar: `getAllProducts(filters)` (registry listesi; drop
filtresi + `priority`/`registryNo` sıralaması), `getAllDropsWithProducts()`
(anasayfa), `getProductBySlug`, `getRelatedProducts`, `getAllPosts`,
`getPostBySlug`, `getLampPartsByCollection`, `getAllProductSlugs` (sitemap).

İki paralel "tüm koleksiyonları getir" fonksiyonu var, ikisi de
donanım/IoT ücret alanlarını ve gövde sınırlarını dönmeli:
- `getAllCollections()` — admin panelinde kullanılır.
- `getAllLampCollections()` — Custom Registry sayfasında kullanılır
  (sadece en az 1 `lampPart`'ı olan koleksiyonları filtreler).

İkisinde de ücretler `coalesce(<koleksiyona bağlı drop'un ücreti>,
<koleksiyonun ücreti>)` şeklinde hesaplanıyor (drop override'ı). Yeni bir
alan eklerken ikisini de güncellemeyi unutmayın; bu projede bir kez bu
ikisi birbirinden geride kalmıştı.

Sunucu tarafı yazma işlemleri için `src/lib/sanity.ts` → `sanityAdminClient`
(yazma yetkili token) — sadece API route'larında import edin.

---

## 5. Sipariş Yaşam Döngüsü (uçtan uca)

```
1. Müşteri sepete ürün/custom tasarım ekler (Zustand cart store, localStorage)
2. /checkout -> CheckoutForm.tsx -> POST /api/checkout
   - Custom kalemler için checkCustomDesignCapacity(): koleksiyonun bağlı
     olduğu drop'un plannedQuantity'si dolduysa sipariş "stok tükendi"
     hatasıyla REDDEDİLİR (konfigüratör açık kalır, sadece ödeme engellenir)
   - Bureau Credits harcaması hesaplanır (üye ise)
   - 'pending' durumunda sipariş açılır (orders.locale kaydedilir)
   - PayTR token'ı alınır (createPaymentToken). Dikkat:
       * para birimi kodu "TL" (ISO "TRY" değil)
       * merchant_oid'de tire yasak: TAB-2026-AB12C -> TAB2026AB12C
         (toPaytrOid / fromPaytrOid)
       * basket formatı [isim, birim_fiyat, adet]
       * user_ip tek bir IP olmalı (x-forwarded-for'un ilki)
   - Token hatasında sipariş iptal edilir
   - PayTRPaymentForm.tsx, PayTR iFrame'ini sayfada gösterir
3. PayTR, sunucudan sunucuya POST /api/checkout/paytr-notify (PUSH modeli)
   - Hash doğrulanır (uyumsuzsa 400)
   - Sipariş bulunamazsa yine "OK" döner (PayTR panelinin test
     bildirimleri sahte oid gönderir); geçici DB hatasında 500 döner ki
     PayTR tekrar denesin
   - Ödeme başarılıysa status: 'pending' -> 'received'
   - Sipariş onay e-postası + admin bildirimi gönderilir (dil: currency'ye göre)
   - Custom kalemler -> createOwnedProductFromCustomDesign(): Sanity'de
     status:'owned' bir product belgesi açılır (registryNo drop'tan
     otomatik, sansürlü sahip adı/şehri; bkz. §12) ve spin-frame üretimi
     tetiklenir (§13). Hata sadece loglanır, ödeme akışını bloklamaz.
   - Bureau Credits: harcanan düşülür, ödenenin %10'u kazanılır (üye)
   - Ödeme başarısızsa sipariş 'cancelled'
   - Tarayıcının gördüğü merchant_ok_url / merchant_fail_url sayfaları
     SADECE görseldir; sipariş durumu orada değişmez.
   - Belge üretimi BURADA TETİKLENMEZ (bilinçli tasarım -- müşterinin
     ödeme sonrası bekleme süresini kısaltmak için admin'in 'processing'e
     almasına ertelendi)
   - Eski iyzico callback'i (/api/checkout/callback) artık 410 dönüyor,
     silinebilir. /api/iyzico-test de 404 dönen ölü bir uç nokta.
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

QR kodları (`src/lib/documents/qr.ts`): dossier QR'ı ve **App Store QR'ı**
artık doğrudan linkten üretiliyor (`APP_STORE_URL` —
`https://apps.apple.com/tr/app/ambience-bureau/id6794577754`, aynı sabit
Footer'daki rozette de kullanılıyor). Google Play QR'ı hâlâ statik
`public/documents/google-play-qr.png` dosyasından okunuyor; dosya henüz
yok (bkz. `CURRENT_STATUS.md`).

---

## 7. 3D Konfigüratör (Custom Registry)

```
CustomRegistryClient.tsx          <- ana orkestratör (masaüstü/mobil layout ayrımı; mobilde sekme sistemi)
  |- CollectionPicker.tsx          <- koleksiyon seçimi
  |- ConfiguratorCanvas.tsx        <- <Scene> + <LampModel> + <LightSimulator> + <CameraFit>
  |    |- Scene.tsx                <- Canvas, gradient arka plan, Bloom, ışıklandırma, gölgeler
  |    |- LampModel.tsx            <- seçili parçaları dikey istifler, glow (emissive) mantığı
  |    |- ModelMesh.tsx            <- STL/GLTF yükleme + malzeme (şeffaf dahil) + glow damping
  |    |- LightSimulator.tsx       <- lambanın "kendi ışığı" (pointLight, yumuşak geçişli)
  |    |- CameraFit.tsx            <- kamerayı istife sığdırır; varsayılan izometrik açı (ISO_AZIMUTH_DEG=45)
  |    |- DimensionAnnotations.tsx <- 3D üzerinde genişlik/yükseklik/derinlik ölçü çizgileri
  |    |- SpinCaptureHook.tsx      <- capture modunda spin-frame yakalama köprüsü (§13)
  |- CameraFitButton.tsx           <- "kamerayı sığdır" butonu (requestCameraFit)
  |- CombinationCountBadge.tsx     <- "N farklı kombinasyon" rozeti (src/lib/combinatorics.ts)
  |- ControlPanel.tsx (masaüstü) / MobileControlPanel.tsx (mobil)
  |    |- SlotPicker.tsx / MobileSlotPicker.tsx  <- parça seçimi (thumbnail grid)
  |    |- MaterialPicker.tsx       <- renk/malzeme seçimi (daire swatch'lar)
  |- ConfigSummary.tsx             <- fiyat özeti + "Tasarımı Kaydet" (compact/normal mod)
  |- CustomRegistryTutorial.tsx    <- ilk kez gelen/hiç sipariş vermemiş kullanıcı için
                                      gerçek arayüz elemanlarını işaret eden interaktif rehber
                                      (bir "bitiş" adımıyla sonlanıyor)
```

### URL parametreleri (`custom-registry/page.tsx`)
- `?collection=<key>` — koleksiyonu doğrudan seçer.
- `?preset=<productSlug>` — bir Registry ürününün `configuratorParts`
  kombinasyonunu yükler ("Özelleştir" butonu: `CustomizeButton.tsx` /
  `CustomizeButtonMini.tsx`). Preset varsa tutorial atlanır. Ürün
  bulunamazsa sessizce boş ekrana düşmek yerine `presetStatus` ile hata
  gösterilir.
- `?capture=1` — SADECE tam ekran 3D canvas (panel/header/tutorial yok);
  spin-frame script'i için (§13).

Footer bu sayfada gizli (`ConditionalFooter.tsx` → `HIDE_FOOTER_PATHS`).

### State: `src/lib/store/configurator.ts` (Zustand)
`collectionKey, availableParts, hardwareFees, bodyLimits (min/max, Sanity'den),
base, body[], head, lightColor, lightBrightness, lightEnabled, iotEnabled`,
istif ölçüleri (`stackTotalHeight/Width/Depth`, `display*` — ölçü
anotasyonları için), `cameraFitRequestId` + action'lar (`setCollection`,
`clearCollection`, `loadPreset`, `toggleSinglePart`, `addBodyPart`,
`removeBodyLayer`, `moveBodyLayer`, `selectMaterial`, `toggleLight`,
`toggleIot`, `requestCameraFit`, `reset`, `getTotalPrice(locale)`,
`isComplete()` — `minBodyLayers` sağlanmadan tasarım tamamlanmış sayılmaz).

### İki yerleşim modu ve sabit parçalar (masa lambası, aplik, sarkıt...)
- `collection.layoutMode`:
  - `stack` (varsayılan, eski davranış): parçalar kendi merkezlerinden
    dikey istiflenir (taban → gövdeler → başlık).
  - `assembled` ("Blender konumu"): geometri MERKEZLENMEZ
    (`useSTLGeometry(url, false)` / GLB'de düğüm dönüşümü uygulanır); her
    parça dosyadaki konumunda + Sanity'deki `offsetMm` / `rotationDeg`
    düzeltmesiyle durur. Model bütün olarak X/Z'de ortalanır ve zemine
    oturtulur. Parçalar Blender'dan ORTAK ORİJİNLE ve Y ekseni yukarı
    aktarılmalı (mevcut STL'lerle aynı eksen).
- `collection.hangFromCeiling` (sadece `assembled`): model en üst noktası
  yüksekliğin 1.6 katında olacak şekilde havada asılı gösterilir; ölçü
  çizgileri bu modda gizlenir.
- `lampPart.isFixed` + `fixedColor`: sabit parça (ör. sarkıt kablosu).
  Store'da `fixedParts` olarak AYRI tutulur (`splitParts`); seçim
  listelerinde, kombinasyon sayısında ve tasarım kaydında YOKTUR, 3D'de
  her zaman sabit renkle çizilir, fiyatı (girildiyse) toplama eklenir.
  Sabit parçalarda malzeme seçimi gerekmez.
- Zorunlu slotlar parçalardan türetilir: koleksiyonda seçilebilir taban
  yoksa Taban sekmesi gizlenir ve zorunlu değildir (başlık ve gövde için
  de aynı; `hasSlot`). Tutorial adımları da buna göre süzülür.
- `model` ("Montajlı model"): sarkıt/aplik/masa lambası gibi KENDİ PARÇA
  SETİYLE gelen ürünler. Studio > Montajlı Modeller (`lampModel`): key,
  ad, koleksiyon, `parts[]` (lampPart referansları, 1..n), görsel.
  Müşteri önce modeli seçer (tek model varsa otomatik), sonra modelin
  sabit olmayan HER parçasının rengini ayrı seçer (`ModelPanel.tsx`).
  - Store: `models`, `modelId`, `selectModel`. Renkli parçalar `body`
    dizisine (modeldeki sırayla, `slotType` 'body'ye zorlanır), sabitler
    `fixedParts`'a yazılır; `bodyLimits` = parça sayısı. Böylece fiyat,
    özet, sepet (`customDesign.parts`), sipariş → Sanity ürün
    (`configuratorParts`) ve "Customize" preset'i değişmeden çalışır.
    `loadPreset` modeli, preset'teki partId'leri en çok kapsayan model
    olarak bulur.
  - Parlayan parça: `lampPart.emitsLight` ("Işık yayar").
  - Model Görselleri: `lampModel.images[]` (ilki seçim kartında; tümü
    model seçilince panelde şerit + tam ekran görüntüleyici). Eski tek
    `thumbnail` alanı sadece doluysa görünür, geriye dönük okunur.
  - Model parçalarında `slotType` ve `collections` zorunlu değil (Studio
    doğrulaması parçanın bir lampModel'de kullanılıp kullanılmadığına bakar).
  - Sorgular: `getLampModelsByCollection`; `getAllLampCollections`
    lampModel'i olan koleksiyonları da listeler; drop kombinasyon sayısı
    model başına parça renk sayılarının çarpımının toplamıdır.
  - Kamera: model değişince ve ölçüler gelince yeniden sığdırılır
    (`CameraFit` kural 4). Tutorial model modunda gösterilmez.
- Mobil uygulama (`ESPTest`) bu modları henüz bilmiyor — bkz. `TASKS.md`.
- Local test: Sanity CDN model dosyaları CORS nedeniyle sadece
  `localhost:3000`'e veriliyor; konfigüratörü başka portta açarsanız
  modeller yüklenmez.

### Montajlı Modeller → Daimi Envanter (otomatik kartlar)
- `getModelStandingCards()` (`queries.ts`): "Montajlı model" koleksiyonlarındaki
  her aktif `lampModel`, ürün belgesi OLMADAN Daimi Envanter kartına
  (`ProductCard` biçimi, `_id: "model-<id>"`, `modelLink` dolu) çevrilir.
  Anasayfa §2/§3 ve `/registry` (sadece sınıf/fiyat/mod süzgeçleriyle)
  bu kartları ürün belgelerinin yanına ekler.
- Sınıf: `collection.productClass` (boşsa `pendant`). Fiyat: parça taban
  fiyatları + koleksiyonun donanım taban ücreti ("…'den başlayan").
- Kart ürün sayfasına değil konfigüratöre gider:
  `/custom-registry?collection=<key>&model=<modelKey>` → model seçili açılır.
  Kartta iki eylem: "Nesne Talep Et" (`ModelRequestMini`) modeli
  VARSAYILAN renklerle (her parçanın ilk rengi, IoT'siz) `/api/custom-design`
  ile kaydedip özel tasarım olarak sepete ekler; "Özelleştir" konfigüratörü
  açar. Kart fiyatı = bu varsayılan tasarımın fiyatı (`modelDefault`).
- GROQ notu: referans dizisini deref öncesi süzmek için
  `parts[@->isFixed != true]->` kullanın; `parts[]->[isFixed != true]`
  null dizisi döndürür.
- Tekrarı önleme: `product.linkedModel` bir modele bağlıysa o modelin
  otomatik kartı üretilmez, ürün kartı görünür.
- Konfigüratörde model seçiliyken model ızgarası daralır ("Modeli değiştir").

### Parça renkleri: "Tüm renkler" varsayılanı
- `lampPart.materialMode`: `all` (yeni parçaların varsayılanı) → Studio >
  Materials'taki TÜM malzemeler, `excludedMaterials` hariç; yeni eklenen
  malzeme otomatik gelir. `custom` → elle seçilen `materials[]`.
- Modu boş ESKİ parçalar: `materials[]` doluysa `custom`, boşsa `all`.
  Kural iki yerde aynı tutulmalı: GROQ `MATERIALS_ALL_COND`
  (`queries.ts`) ve Studio `isAllMaterialsDoc` (`lampPart.ts`); ürün
  preset'indeki malzeme filtresi (`product.ts`) de aynı koşulu kullanır.
- Sıralama: malzemenin `sortOrder`'ı.

### Kombinasyon sayısı (`src/lib/combinatorics.ts`)
Gövde katmanları SIRALI ve TEKRARLI kabul edilir:
`TOPLAM = taban_varyant × başlık_varyant × Σ(k=min..max) gövde_varyant^k`.
Drop kartlarındaki "XXX Different Combinations" sayısı bundan KASITLI
olarak farklı, basitleştirilmiş bir formül kullanıyor.

### Fiyatlandırma mantığı (`getTotalPrice`)
```
toplam = SUM(parça taban fiyatı + malzeme fiyat farkı)
       + hardwareFees.base{TRY|USD}                    // her zaman eklenir
       + (iotEnabled ? hardwareFees.iot{TRY|USD} : 0)   // IoT açıksa ÜSTÜNE eklenir
```
`hardwareFees`, `setCollection()` çağrısında seçilen koleksiyonun Sanity
alanlarından gelir — koleksiyona bağlı drop'ta ücret tanımlıysa o
öncelikli (§4). `DEFAULT_HARDWARE_FEES` (1600 TRY / 40 USD taban,
1200 TRY / 30 USD IoT) sadece alan boşsa devreye giren bir varsayılan. Kod değişikliği olmadan fiyat güncellemek için
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
`POST /api/admin/grant-credits`, `/api/admin/service-requests`.
Yetkilendirme: `x-admin-secret` header'ı `ADMIN_API_SECRET` env
değişkeniyle karşılaştırılıyor (Supabase Auth rolü değil — güçlendirme
`TASKS.md`'de). Sipariş listesi artık: koleksiyon adı (custom
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

Dört yasal sayfa, hepsi ortak `src/components/legal/LegalDocument.tsx`
ile render ediliyor:
- `/[locale]/privacy-policy`, `/[locale]/terms-of-use` — App Store/Play
  Store başvurusu için eklendi. Metin, mobil uygulamadaki
  (`ESPTest/screens/LegalScreen.tsx`) metinle ortak: uygulamayı VE siteyi
  birlikte kapsıyor. Birinde değişiklik yaparsanız diğerini de güncelleyin.
  App Store Connect / Play Console'a her zaman `/en/...` URL'i verilmeli.
- `/[locale]/distance-sales-agreement` (Mesafeli Satış Sözleşmesi) ve
  `/[locale]/shipping-returns` (Kargo & İade) — e-ticaret yasal
  gereklilikleri için eklendi.

Diğer statik sayfalar: `/bureau` (hakkımızda + `ContactForm` →
`/api/contact`), `/control-protocol` (mobil uygulama tanıtımı,
`AppShowcase.tsx` — `public/app-showcase/{tr,en}/` altındaki 9'ar ekran
görüntüsü yerinde), `/archive` (blog).

---

## 12. Anasayfa, İki Satış Rejimi ve Drop Sistemi

Tasarım kurgusu için bkz. `DESIGN.md` ("Işık Tahsis Bürosu").

### Anasayfa düzeni (`[locale]/page.tsx`)
`HomeMasthead` (sitenin tek `<h1>`'i + Büro Bülteni) → `§1 Sınırlı Tahsis`
(drop satırları) → `§2 Daimi Envanter` (`StandingInventory.tsx`, sınıf
indeksi/dosya dolabı) → `§3 Özel Tahsis` → `§4 Kontrol Protokolü`.
Bileşenler `src/components/home/`. Bölüm başlıkları `SectionHeading`.

### Satış rejimi (`product.saleMode`) ve sınıflar
- `limited` (veya boş — eski kayıtlar): Sınırlı Tahsis, drop'a bağlı,
  numaralı adet. Kartta `REG. NO.` + sertifika durumu.
- `standing`: Daimi Envanter, sürekli satış. `registryNo` envanter kodu
  olarak kullanılır (`ENV-F-012`); kartta `ENV. KODU` + stok durumu.
  `stockQuantity`: boş = siparişe üretim, 0 = tükendi, >0 = adet.
- Sınıflar (`product.category`) TEK kaynaktan: `src/lib/lightClasses.ts`
  → `LIGHT_CLASSES` (F Lambader, W Aplik, D Masa Lambası,
  P Sarkıt, S Şerit). Sanity şeması, Registry filtresi, anasayfa ve
  ürün sayfası buradan okur.
- Yardımcılar: `resolveSaleMode`, `resolveStockState`,
  `isProductPurchasable` (decommissioned / owned / stoğu tükenmiş
  standing ürün sepete eklenemez).
- Sorgular: `getAllProducts({ mode })` (`?mode=limited|standing`),
  `getStandingInventory()`.
- Stok: checkout'ta `checkProductAvailability()` (ödemeye gitmeden 409),
  ödeme onayında `decrementStandingStock()` (paytr-notify, bloklamaz).
  İkisi de `src/lib/sanity-fulfillment.ts`.
- `paytr-notify` artık sipariş `pending` değilse hiçbir şey yapmadan
  "OK" döner (tekrarlanan bildirimlerde e-posta/owned ürün/stok/kredi
  iki kez işlenmesin).

### Büro Bülteni
- Sanity tipi `bulletin` (`src/sanity/schemaTypes/bulletin.ts`): `bulletinNo`,
  `kind` (drop/inventory/bureau/notice), `publishedAt` (ileri tarihli
  olabilir — tarihi gelmeden görünmez), lokalize `title`/`text`, link
  (`linkType`: drop/product/post/path), `showInPanel`, `pinned`.
- **Satırlar:** bülten, canlı durum sayfasıyla aynı "etiket → değer"
  düzeninde gösterilir. Elle girilen `rows[]` + link bir drop ise o
  drop'un CANLI satırları (Tahsis, Kalan adet, Durum) otomatik eklenir
  (`src/lib/bulletinRows.ts`). Böylece eski bir drop'un güncel durumu
  bültende her zaman doğru görünür.
- Sorgular: `getPanelBulletins()` (anasayfa paneli, sabitlenenler önce,
  en fazla 8) ve `getAllBulletins()` (`/bulletin` arşivi). Link GROQ'da
  site içi yola çevrilir (`href`). Önbellek: 5 dk (`revalidate: 300`).
- Bileşenler: `src/components/home/BulletinPanel.tsx` (istemci, kaydırmalı),
  sayfa `src/app/[locale]/bulletin/page.tsx`.
- **Local önizleme:** `BULLETIN_DEMO=1` ile sunucu başlatılırsa, Sanity'de
  hiç bülten yoksa `src/lib/bulletinDemo.ts`'teki "(örnek)" etiketli
  bültenler gösterilir ve `/[locale]/preview/cards` kart önizleme sayfası
  açılır. Değişken yoksa (üretim) ikisi de devre dışı / 404. Gerçek
  bültenler girilince bu dosya ve önizleme sayfası silinebilir.

### Ürün kartı
`src/components/registry/ProductCard.tsx` — dosya kartı (bkz. `DESIGN.md`).
Kart verisi (`PRODUCT_CARD_FRAGMENT`) artık `dropNo` ve `compatibility`
de içerir. Drop'un tüm adetleri tahsis edildiyse (`plannedQuantity -
soldCount <= 0`) `DropRow` panelde "TAHSİS TAMAMLANDI" damgası basar,
"Oluştur"u pasifleştirir ve kartlara `dropSoldOut` geçer (TÜKENDİ damgası,
eylem yok). NOT: bu şimdilik sadece görsel; checkout drop dolu olsa da
vitrin ürünlerini engellemiyor (sadece custom tasarımları engelliyor). Stiller `globals.css` → `.product-file`, `.bureau-stamp`,
`.card-actions-overlay` / `.card-actions-inline`.

### Drop'lar
Her drop için `DropRow.tsx` (yatay
kaydırılabilir ürün kartları, "N Farklı Kombinasyon" sayacı —
`useAnimatedNumber`) veya `UpcomingDropRow.tsx` (geri sayım, ürünler
gizli). Ürünü olmayan CANLI drop'lar gösterilmez.

Görünürlük (`src/lib/dropSchedule.ts` → `resolveDropState`, saf fonksiyon,
her istekte `now` ile yeniden hesaplanır):
- `active !== false` → `live`
- `active === false` + `scheduledAt` gelecekte → `upcoming` (geri sayım)
- `active === false` + `scheduledAt` geçmişte → `live` (otomatik yayın)
- `active === false` + `scheduledAt` yok → `hidden`

Stok: drop'a bağlı (`product.drop`) ürün sayısı `plannedQuantity`'ye
ulaşınca o koleksiyon için checkout engellenir. Custom Registry'den
satın alınan her tasarım bir `owned` ürün olarak drop'a eklenir;
`registryNo` = `<sıra>/<plannedQuantity>` (drop yoksa `C-<zaman>`).

Registry sayfası (`/registry`): `CategoryFilterBar`, `ProductGrid`,
`ProductCard` (+ `AddToCartMini`, `CustomizeButtonMini`). `owned`
kartlarda sansürlü sahip adı ve şehri görünür.

---

## 13. Spin-Frame'ler (kartlarda 360° dönüş)

"Özelleştirilebilir" ve `owned` ürünlerin kartında fotoğraf ↔ 3D dönüş
geçişi var (`ProductCardMedia.tsx`; varsayılan HER ZAMAN fotoğraf, 3D'ye
ziyaretçi elle geçer).
- Kareler: Supabase Storage `product-spins` public bucket'ı,
  `product-spins/<slug>/00.webp … 23.webp` (24 kare, 15°'de bir,
  `src/lib/spinFrames.ts`). Sanity'de ayrı bir alan YOK — ilk kare 404
  verirse kart sadece fotoğraf gösterir.
- Üretim: `scripts/generate-spin-frames.ts` (`npm run spin-frames
  [-- --slug=x] [-- --base-url=...]`) siteyi headless Chrome'da
  `?preset=<slug>&capture=1` ile açıp kareleri yakalar. Çalışan bir site
  gerekir (varsayılan `http://localhost:3000`).
- Otomasyon: `owned` ürün oluşunca `triggerSpinFrameGeneration()` GitHub
  Actions'taki `.github/workflows/generate-spin-frames.yml`'ı
  `workflow_dispatch` ile tetikler. Gerekli env: `GITHUB_REPO`,
  `GITHUB_ACTIONS_TOKEN` (repo + workflow yetkili PAT). Yoksa sessizce
  atlanır ve log'a elle çalıştırma komutu yazılır.
- `SPIN_ISO_AZIMUTH_DEG` (45) ile `CameraFit.tsx`'teki `ISO_AZIMUTH_DEG`
  birebir aynı kalmalı.

---

## 14. Tema, Header, Footer

- **Karanlık/aydınlık tema:** Tailwind `darkMode: 'class'`. `bureau.*`
  renkleri artık CSS değişkenleri (`rgb(var(--bureau-*) / <alpha-value>)`,
  `globals.css`) — temayla birlikte değişir. Temadan bağımsız kalması
  gereken yerler için `bureau-fixed-*` ve `bureau-dark-line-*` paletleri
  var. Tercih `localStorage['ambience-bureau-theme']`'da; kayıtlı tercih
  yoksa site HER ZAMAN karanlık açılır. `src/app/layout.tsx`'teki
  `THEME_INIT_SCRIPT` (hydration öncesi) ile `ThemeProvider.tsx` aynı
  mantığı taşımalı, yoksa tema "flaşı" olur. Geçiş: `ThemeToggle.tsx`.
- **Header:** Menüde Özel Tahsis (koleksiyon açılır menüsü), Envanter,
  Kontrol Protokolü. Büro ve Arşiv linkleri menüden kaldırılıp Footer'a
  taşındı, ama `HeaderStickman.tsx` animasyonu (merdivene tırmanıp lambayı
  yakan çöp adam) bu iki yazının konumunu referans aldığı için header'da
  GÖRÜNMEZ yer tutucu olarak duruyorlar (`data-stickman-anchor`). Bunları
  silmeyin. Mobil menüde "Bölge Bürosu Ol" / "Tasarım Departmanına Katıl"
  linkleri var.
- **Footer:** App Store / Google Play rozetleri, başvuru linkleri, Arşiv,
  Büro ve 4 yasal sayfa. Artık `<main>` scroll alanının İÇİNDE, içerikle
  birlikte kayıyor ve mobilde de görünür. `/custom-registry`'de gizli.
- **Atlama linki:** `[locale]/layout.tsx`'te ilk odak durağı "İçeriğe
  geç" → `#main-content`.
- **404:** `[locale]/not-found.tsx` (markalı "Kayıt bulunamadı" belgesi)
  + `[locale]/[...rest]/page.tsx` catch-all (tanımsız yollar buraya düşer).

---

## 15. Başvurular (Bölge Bürosu / Tasarım Departmanı)

- `/become-bureau-hub`: `BureauHubExperience.tsx` → `WorldMap.tsx`
  (d3-geo dünya haritası, ülke seçimi) + `ApplicationForm type="hub"`.
  Aktif büro sayıları `src/lib/bureauHubs.ts` → `ACTIVE_BUREAUS` (şu an
  `TR: 1`); yeni büro açılınca buraya satır eklemek yeterli.
- `/become-bureau-creator`: `ApplicationForm type="creator"` (disiplin
  seçimi: lighting/industrial/product3d/interior/other).
- `POST /api/apply`: **üyelik şart**. `applications` tablosuna yazar
  (hata olursa e-posta yine gönderilir) + Resend ile `CONTACT_EMAIL`'e
  (varsayılan `ambiencebureau@gmail.com`) bildirim.

---

## 16. Mobil Uygulama ile İlişki

Mobil uygulama + ESP32 firmware ayrı bir repoda:
`/Users/cagdas/ESPTest` (Expo/React Native; firmware `arduino/` altında).
Lambalarla sadece yerel Wi-Fi üzerinden, sunucusuz konuşur. Bu siteyle
tek programatik bağı **STL dosyaları**:

- Uygulama (`services/stlCache.ts`) parça modellerini şu sırayla arar:
  uygulama paketi → cihaz diski cache'i → **`https://www.ambiencebureau.com/parts/stl`**.
- Sitedeki `public/parts/stl/manifest.json` (`{ folders, files: {key →
  klasör/dosya} }`) anahtar → dosya eşlemesini verir; `scripts/generate-stl-manifest.js`
  ile üretilir. Klasörler: `extrudedCollection/`, `helicalCollection/` +
  kökte birkaç eski dosya.
- Bu yüzden **`public/parts/stl/` silinmemeli / yeniden adlandırılmamalı**;
  yeni bir parça eklendiğinde STL'i buraya koyup manifest'i yeniden
  üretmek gerekir. Konfigüratör ise bu klasörü kullanmıyor, Sanity
  CDN'den okuyor — aynı parçanın iki kopyası var.
- Uygulamanın "müşterinin satın aldığı tasarımı otomatik öğrenmesi"
  için bir API hâlâ yok (bkz. `TASKS.md`).
