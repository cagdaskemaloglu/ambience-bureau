# TASKS.md — The Ambience Bureau

> Öncelik sırasına göre değil, kategoriye göre gruplanmıştır. Bir görevi
> tamamladığınızda buradan silin ve gerekirse `CURRENT_STATUS.md`'deki
> "Çalışan Özellikler" listesine taşıyın. Yeni bir eksik/fikir bulduğunuzda
> ilgili kategoriye ekleyin.

---

## 🔴 Karar Bekleyen / Netleştirilmesi Gereken

- [ ] **Mobil uygulama <-> web sitesi API entegrasyonu.** Şu an hiçbir
      programatik bağlantı yok. Karar verilmesi gerekenler:
      - Uygulama, müşterinin satın aldığı tam tasarımı (parça+malzeme
        kombinasyonu) nasıl öğrenecek? (`custom_designs.design_data`'yı
        dışarıya sunan, cihaz/sertifika bazlı kimlik doğrulamalı bir GET
        endpoint'i mi kurulacak?)
      - `lampPart.modelFile` STL/GLB dosyaları şu an genel/herkese açık
        Sanity CDN URL'lerinde — bu kabul edilebilir mi, yoksa
        kimlik doğrulamalı bir proxy/imzalı-URL mekanizması mı gerekiyor?
- [ ] **`public/parts/stl/` klasörünün amacı ne?** Kodda hiç referans
      edilmiyor. Silinecek mi, Sanity'ye mi taşınacak, yoksa mobil
      uygulamanın doğrudan kullanması mı planlanıyor?
- [ ] **Blog/Archive karışıklığı netleştirilmeli.** Sanity'de `post.ts` var
      ama sayfa yok; `/archive` route'u farklı bir şeye (satın alınan
      ürünler) hizmet ediyor gibi görünüyor. İsimlendirme çakışması var mı
      kontrol edin.

## 🟠 Teknik Borç / Sağlamlaştırma

- [ ] `supabase/schema.sql`'i, bu projede elle uygulanan tüm migration'ları
      (order_documents, certificate_no, order_status.received,
      orders.locale/tracking_number/admin_note) içerecek şekilde güncelleyin
      — ya doğrudan schema.sql'e işleyin ya da `supabase/migrations/`
      altında numaralı dosyalar olarak ekleyin.
- [ ] `/api/admin/*` route'larının yetkilendirmesini gözden geçirin
      (Supabase Auth rolü + RLS ile güçlendirme değerlendirin).
- [ ] Bloom/ışık parametrelerini (`MAX_INTENSITY`, `MAX_HEAD_GLOW`,
      `luminanceThreshold`, `intensity`, `radius`) gerçek ürünlerle test
      edip nihai değerlere sabitleyin, kod yorumlarındaki "başlangıç
      noktası" notlarını kaldırın.
- [ ] Footer'ın mobilde (`hidden sm:block`) tamamen gizli olması —
      Privacy Policy/Terms of Use gibi sayfalara mobil ziyaretçilerin
      erişimi kısıtlı. Mobil için de görünür/erişilebilir bir footer ya da
      hamburger menüde bir bağlantı eklenmeli mi?

## 🟡 Eksik Görsel/İçerik (kod hazır, dosya bekleniyor)

- [ ] `public/documents/app-store-qr.png` ekle
- [ ] `public/documents/google-play-qr.png` ekle
- [ ] Sanity Studio'da **mevcut** (yeni oluşturulmamış) tüm `product`
      kayıtlarında şu alanları elle doldurun: `netWeightKg`,
      `firmwareVersion`, `assetSubtype` (boşsa belgede "—" görünür,
      hata vermez ama eksik görünür).
- [ ] Sanity Studio'da **mevcut** tüm `collection` kayıtlarında:
      `hardwareBaseFeeTRY`, `hardwareBaseFeeUSD`, `iotFeeTRY`, `iotFeeUSD`
      alanlarını doldurun (boşsa kod varsayılana düşer: 1600 TRY / 40 USD
      taban, 1200 TRY / 30 USD IoT eki — ama bu koleksiyon-özel
      fiyatlandırmanın amacını boşa çıkarır).
- [ ] Control Protocol sayfasındaki `AppShowcase` bileşeni için
      `public/app-showcase/{tr,en}/` altına 9+9 ekran görüntüsü
      (bkz. component içi tam dosya adı listesi).

## 🟢 İyileştirme Fikirleri (acil değil)

- [ ] Custom Registry paneli için "E: Üç sütunlu profesyonel konfigüratör
      düzeni" seçeneği konuşuldu ama uygulanmadı (kullanıcı daha basit bir
      genişletme + kompakt fiyat çubuğunu tercih etti). İleride daha
      kapsamlı bir redesign istenirse bu konuşma geçmişine bakılabilir.
- [ ] E-posta gönderiminin (Resend) gerçek gönderim hacmine göre
      ücretsiz plan limitlerini aşıp aşmadığını periyodik kontrol edin.
- [ ] `[locale]/layout.tsx`'teki `alternates.languages` varsayılanının,
      kendi `generateMetadata`'sını tanımlamayan sayfalarda her zaman
      anasayfaya işaret edip etmediğini kontrol edin (hreflang doğruluğu
      için sayfa sayfa gözden geçirme gerekebilir).
- [ ] Google Search Console'a domain doğrulaması ve sitemap gönderimi
      (`sitemap.xml`) yapılıp yapılmadığını teyit edin.

## ✅ Bu listeye YENİ görev eklerken

Kısa, eyleme dönüştürülebilir cümleler kullanın ("X'i Y yap" formatında).
Bir görev birden fazla dosyayı etkiliyorsa, `ARCHITECTURE.md`'deki ilgili
bölüme referans verin ki gelecekteki bir geliştirici/AI bağlamı hızlıca
yakalayabilsin.
