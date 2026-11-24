# TASKS.md — The Ambience Bureau

> Öncelik sırasına göre değil, kategoriye göre gruplanmıştır. Bir görevi
> tamamladığınızda buradan silin ve gerekirse `CURRENT_STATUS.md`'deki
> "Çalışan Özellikler" listesine taşıyın. Yeni bir eksik/fikir bulduğunuzda
> ilgili kategoriye ekleyin.
>
> **Son gözden geçirme:** 2026-11-21.

---

## 🔴 Karar Bekleyen / Netleştirilmesi Gereken

- [ ] **Mobil uygulama <-> web sitesi "sahip olunan tasarım" API'si.**
      Uygulama STL'leri zaten siteden (`public/parts/stl/`) çekiyor, ama
      müşterinin satın aldığı tam tasarımı (parça+malzeme) öğrenemiyor.
      Karar verilmesi gerekenler:
      - Kaynak `custom_designs.design_data` mı, yoksa Sanity'deki `owned`
        ürünün `configuratorParts` alanı mı olacak?
      - Kimlik doğrulama: `certificate_no` (dossier'deki QR) ile mi,
        kullanıcı hesabıyla mı? (`registry_no` asla kimlik olarak kullanılmaz.)
- [ ] **STL'lerin iki kopyası.** Konfigüratör Sanity CDN'den, uygulama
      `public/parts/stl/`'den okuyor. Tek kaynağa mı indirilecek, yoksa
      yeni parça eklerken ikisini de güncellemek bir süreç olarak mı
      belgelenecek?
- [ ] **Daimi Envanter ürünlerinin envanter kodu düzeni.** `ENV-S-012`
      önerildi (sınıf harfi + sıra). Onaylanırsa Studio'da otomatik
      öneri (RegistryNoHint benzeri) eklenebilir.

## 🟠 Teknik Borç / Sağlamlaştırma

- [ ] **Mobil uygulama:** "Blender konumu" (`layoutMode: assembled`) ve
      "Montajlı model" (`layoutMode: model`, `lampModel`) koleksiyonlarını
      ve sabit parçaları (`isFixed`) uygulamada destekleyin (`ESPTest`).
- [ ] İlk gerçek sarkıt modellerini Studio'da (Koleksiyon: Montajlı model,
      Montajlı Modeller altında 1/2/3 parçalı modeller) kurup konfigüratörde
      doğrulayın; ardından `lib/bulletinDemo.ts`'teki örnek koleksiyonları silin.
- [ ] Sipariş e-postası/admin ekranında Montajlı Model siparişlerinin parça
      adlarıyla ("Gövde — Kırmızı") okunduğunu kontrol edin (şu an satırlar
      slotType 'body' olarak kaydediliyor).

- [ ] **Güvenlik:** `/api/checkout` fiyatları istemciden alıyor; sunucuda
      Sanity fiyatından yeniden hesaplayın (bkz. `CURRENT_STATUS.md` #3).

- [ ] Elle uygulanan tüm Supabase değişikliklerini (order_documents,
      certificate_no, order_status.received, orders.locale/tracking_number/
      admin_note, Bureau Credits kolonları + `grant_bureau_credits`,
      service_requests, storage bucket'ları) `supabase/migrations/`
      altında numaralı dosyalar olarak repoya ekleyin; `applications.sql`'i
      de README'deki kurulum adımlarına yazın.
- [ ] iyzico kalıntılarını temizleyin: `api/checkout/callback/`,
      `api/iyzico-test/`, `IyzicoPaymentForm.tsx`, `iyzipay-ts` bağımlılığı,
      `product.ts`'teki eski iyzico yorumu.
- [ ] `orders` tablosuna ayrı `paytr_*` kolonları açıp (veya mevcutları
      yeniden adlandırıp) `iyzico_payment_id`/`iyzico_token`'ın PayTR
      verisi taşımasına son verin ("Faz 4").
- [ ] `.env.local.example`'a `ADMIN_API_SECRET`, `GITHUB_REPO`,
      `GITHUB_ACTIONS_TOKEN`, `CONTACT_EMAIL` ekleyin; Vercel'de
      tanımlı olduklarını doğrulayın.
- [ ] `/api/admin/*` route'larının yetkilendirmesini (şu an
      `x-admin-secret`) Supabase Auth rolü + RLS ile güçlendirin.
- [ ] `backup.tar.gz`'yi repodan çıkarın ve `.gitignore`'a ekleyin.
- [ ] Bloom/ışık parametrelerini (`MAX_INTENSITY`, `MAX_HEAD_GLOW`,
      `luminanceThreshold`, `intensity`, `radius`) gerçek ürünlerle test
      edip nihai değerlere sabitleyin.

## 🟡 Eksik Görsel/İçerik (kod hazır, dosya/veri bekleniyor)

- [ ] Sanity Studio'da ilk Daimi Envanter ürünlerini girin (Satış Rejimi:
      Daimi Envanter, sınıf, envanter kodu, stok adedi).
- [ ] `/tr/archive/test` ve `test-2` test yazılarını yayından kaldırın
      (jüri bunları placeholder içerik olarak yakaladı).
- [ ] Siteye 1200x630 bir og:image tasarlayıp ekleyin (şu an hiçbir
      sayfada yok).

- [ ] `public/documents/google-play-qr.png` ekleyin (ya da App Store'daki
      gibi Google Play linkinden üretilecek şekilde `qr.ts`'i güncelleyin).
- [ ] Sanity Studio'da mevcut `product` kayıtlarında `netWeightKg`,
      `firmwareVersion`, `assetSubtype` alanlarını doldurun (boşsa belgede
      "—" görünür).
- [ ] Sanity Studio'da mevcut `collection` kayıtlarında
      `hardwareBaseFeeTRY/USD`, `iotFeeTRY/USD`, `minBodyLayers`,
      `maxBodyLayers` alanlarını doldurun (boşsa kod varsayılanı:
      1600 TRY / 40 USD taban, 1200 TRY / 30 USD IoT, gövde 0–5).
- [ ] Spin-frame'i olmayan configurable/owned ürünler için
      `npm run spin-frames` çalıştırın.

## 🟢 İyileştirme Fikirleri (acil değil)

- [ ] Custom Registry paneli için "E: Üç sütunlu profesyonel konfigüratör
      düzeni" seçeneği konuşuldu ama uygulanmadı.
- [ ] Bölge Bürosu / Tasarım Departmanı başvurularını admin panelinde
      listeleyip durumlarını (`new → reviewing → approved/rejected`)
      yönetme ekranı (şu an sadece veritabanına + e-postaya düşüyor).
- [ ] `owned` ürünlerin sahip adından gidilecek herkese açık profil
      sayfası (şemada `ownerUserId` hazır, "Faz 3" olarak not edilmiş;
      sayfa yok).
- [ ] E-posta gönderiminin (Resend) gerçek hacme göre ücretsiz plan
      limitlerini aşıp aşmadığını periyodik kontrol edin.
- [ ] `[locale]/layout.tsx`'teki `alternates.languages` varsayılanının,
      kendi `generateMetadata`'sını tanımlamayan sayfalarda her zaman
      anasayfaya işaret edip etmediğini kontrol edin.
- [ ] Google Search Console'a domain doğrulaması ve sitemap gönderimi
      yapılıp yapılmadığını teyit edin.

## ✅ Bu listeye YENİ görev eklerken

Kısa, eyleme dönüştürülebilir cümleler kullanın ("X'i Y yap" formatında).
Bir görev birden fazla dosyayı etkiliyorsa, `ARCHITECTURE.md`'deki ilgili
bölüme referans verin ki gelecekteki bir geliştirici/AI bağlamı hızlıca
yakalayabilsin.
