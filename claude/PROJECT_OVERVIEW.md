# PROJECT_OVERVIEW.md — The Ambience Bureau

> Bu doküman, projeye yeni katılan bir geliştiricinin veya bir AI asistanının
> "bu proje nedir, kimin için, ne satıyor" sorusuna 10 dakikada cevap
> bulabilmesi için yazıldı. Teknik derinlik için `ARCHITECTURE.md`'ye,
> güncel durum için `CURRENT_STATUS.md`'ye bakın.

## Ne satıyoruz?

**The Ambience Bureau**, akıllı (IoT) ve standart mimari aydınlatma
ürünleri (lambalar) satan bir e-ticaret sitesi. İki farklı satın alma
yolu var:

1. **Registry (Envanter)** — Sanity CMS'te önceden tanımlanmış, hazır
   ürünler. Genelde **sınırlı edisyon**: her ürün kaydı aslında **tek bir
   fiziksel parçayı** temsil ediyor (`registryNo` alanı "007/050" gibi
   benzersiz bir seri numarası taşıyor), satıldığında `decommissioned`
   durumuna alınıyor.
2. **Custom Registry (Özel Tahsis)** — kullanıcının tarayıcıda, 3D bir
   konfigüratörde (Three.js/React Three Fiber) **kendi lambasını**
   Taban + Gövde (N adet) + Başlık parçalarından, malzeme/renk seçerek
   tasarlayıp sipariş verdiği akış.

Ürünler **drop**'lar halinde (numaralı, sınırlı adetli satış dalgaları)
çıkıyor: anasayfa bir drop listesi. DROP-000 "Eritilmiş Boru" yayında,
DROP-001 "Sarmal Düğümler" geri sayımda (Kasım 2026). Custom Registry'den
satın alınan her tasarım, ilgili drop'a numaralı bir "sahipli" (`owned`)
ürün olarak eklenir ve Registry'de sansürlü sahip adıyla görünür.

Ödeme altyapısı **PayTR** (Ekim 2026'ya kadar iyzico idi). Üyeler
siparişlerinden **Bureau Credits** kazanıp sonraki siparişte harcayabiliyor.

Her iki yoldan gelen sipariş de **Donanım Tahsisi** adında sabit bir
elektronik tesisat ücreti taşır (taban ücret + IoT seçiliyse ek ücret,
koleksiyon bazında Sanity'den yönetiliyor — bkz. `ARCHITECTURE.md`).

## Marka kimliği ve ton

Site, kasıtlı olarak **bürokratik / resmi belge / gümrük formu**
estetiğinde: Courier/Cutive Mono fontlar, "FORM 104-B", "REG. NO.",
"SICIL", damga/kaşe motifleri, amber (`#E6792E`) tek vurgu rengi ("ışığın
kendisi"). Yeni metin/UI eklerken bu tonu koru — gündelik/samimi bir dil
yerine resmi/belgesel bir dil kullanılıyor.

## Diller ve para birimleri

- Site **TR/EN** iki dilli (`next-intl`, `localePrefix: 'always'` — her
  URL `/tr/...` veya `/en/...` ile başlar). İlk ziyarette dil ülkeye göre
  seçilir (Türkiye → TR, diğer → EN); sonra kullanıcının seçimi cookie'de
  saklanır.
- Site karanlık/aydınlık temalı; varsayılan karanlık.
- **Para birimi dile kilitli**: `tr` → TRY, `en` → USD. Bağımsız bir para
  birimi seçici yok (checkout formunda `currency = locale === 'tr' ?
  'TRY' : 'USD'`).
- **E-posta dili farklı bir kuralla belirleniyor**: sipariş onay ve durum
  e-postalarının dili, checkout'taki site dilinden BAĞIMSIZ olarak
  **ödeme para birimine** göre seçiliyor (USD→EN, TRY→TR). Bilinçli bir
  tasarım kararı, kafa karıştırmasın diye not düşülüyor.

## Kayıtlı bir eşlik eden mobil uygulama var

Şirketin, satılan akıllı lambaların **ESP32 tabanlı donanımını** kontrol
eden ayrı bir mobil uygulaması (iOS/Android) var. Bu uygulama:
- Bu web sitesinin kod tabanının **parçası değil** — ayrı repo:
  `/Users/cagdas/ESPTest` (Expo/React Native + `arduino/` altında ESP32
  firmware). App Store'da yayında; Google Play rozeti de footer'da.
- Cihazlarla **sadece yerel Wi-Fi ağı üzerinden**, sunucusuz iletişim
  kuruyor (bkz. `privacy-policy` sayfası — metin uygulamayla ortak).
- Web sitesindeki `/[locale]/control-protocol` sayfasında ekran
  görüntüleriyle tanıtılıyor (`AppShowcase.tsx`).
- **Siteyle tek bağı STL dosyaları:** uygulama lamba parçalarının 3D
  modellerini `https://www.ambiencebureau.com/parts/stl/` adresinden
  (`manifest.json` ile) indiriyor — bu yüzden `public/parts/stl/`
  silinmemeli. "Müşterinin satın aldığı tasarımı otomatik öğrenme" API'si
  ise hâlâ yok (bkz. `ARCHITECTURE.md` §16, `TASKS.md`).

## Ürün Kimlik Sayfası ve fiziksel belgeler

Her satın alınan (fiziksel veya custom) ürün için sistem otomatik olarak:
- Halka açık bir **"Ürün Kimlik Sayfası"** (`/[locale]/dossier/[certificateNo]`)
  üretiyor — ürün görseli, adı, teknik özellikler, ve aşağıdaki 3 belgenin
  görüntüleme/indirme linkleri.
- **Sertifika, Ürün Kartı (ön+arka), Garanti Belgesi** adında 3 PDF
  belgesini, sipariş admin panelinde "İşleniyor" durumuna alındığında
  otomatik üretiyor (Puppeteer ile HTML→PDF, bürokratik temaya uygun
  şablonlar). Bu belgeler fiziksel olarak kutuya da konuyor.

## Kimler için

- **Son kullanıcı (müşteri):** ürün/özel tasarım satın alan, hesabından
  sipariş takibi yapabilen, teslim aldığını işaretleyebilen kişi.
- **Başvuru sahipleri:** "Bölge Bürosu Ol" (ülkesinde temsilci olmak
  isteyen) ve "Tasarım Departmanına Katıl" (tasarımcı) formlarını dolduran
  üyeler.
- **Admin (proje sahibi, Çağdaş Kemaloğlu):** `/admin` panelinden
  siparişleri işleme alan, kargo bilgisi giren, koleksiyon/ürün fiyatlarını
  Sanity Studio'dan yöneten kişi.

## Bu dokümantasyon setinin diğer dosyaları

| Dosya | İçerik |
|---|---|
| `ARCHITECTURE.md` | Teknik mimari: klasör yapısı, veri modeli, akışlar |
| `CURRENT_STATUS.md` | Şu an ne çalışıyor, ne yarım/bilinen eksik |
| `TASKS.md` | Yapılacaklar listesi / backlog |
| `CLAUDE.md` | AI asistanları için repo-özel çalışma kuralları |
