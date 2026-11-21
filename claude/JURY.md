# JURY.md — Awwwards tarzı jüri puanları

> Araç: [juliobsz/skills](https://github.com/juliobsz/skills) `/jury`.
> Awwwards ile bağlantısı yok; puanlar TAHMİNDİR. Her turda kodu ve
> tasarım notlarını görmeyen YENİ bir eleştirmen ajanı, sadece ekran
> görüntüleri + ölçümlerden puanlar. "Jüri tahmini" = eleştirmen + 1.1
> (aracın iki gerçek Site of the Day üzerinde ölçtüğü fark).

## Puan geçmişi

| Tur | Tarih | Hedef | Tasarım | Kullanılabilirlik | Yaratıcılık | İçerik | Eleştirmen | Jüri tahmini |
|---|---|---|---|---|---|---|---|---|
| 0 (başlangıç) | 2026-11-21 | canlı site | 6 | 5 | 7 | 6 | **5.9** | ~7.0 (Honorable Mention bandı) |
| 1 (yeni tasarım) | 2026-11-21 | yerel production build | 7 | 6.5 | 7 | 6.5 | **6.8** | ~7.9 (Site of the Day bandı) |

| Geliştirici alanı | Tur 0 | Tur 1 |
|---|---|---|
| Semantics/SEO | 4 | 5 |
| Animations/Transitions | 4 | 6 |
| Accessibility | 4 | 7 |
| WPO | 4 | 7* |
| Responsive | 5 | 6 |
| Markup/Meta-data | 4 | 5 |

\* Tur 1 yerel sunucuda (127.0.0.1) ölçüldü; WPO/LCP rakamları canlı CDN'e
göre iyimser. Adil karşılaştırma için bir sonraki tur canlıya deploy
sonrası yapılmalı. Teknik denetim FAIL sayısı: 15 → 2.

**Önemli ölçüm kısıtı:** sayfa `body` yerine iç bir `<main>` içinde
kaydığı için jüri aracı aşağı kaydıramıyor; iki turda da sadece ilk ekran
değerlendirildi (drop satırları, Daimi Envanter, footer puan alamadı).

## Tur 1 sonrası kalan en değerli düzeltmeler (eleştirmenin sırası)

1. Sayfa kaydırmasını `window`'a taşımak (body `overflow-hidden` + iç
   scroller yerine doğal belge kaydırması). Hem jüri hem mobil tarayıcı
   (adres çubuğu küçülmesi) için.
2. Konfigüratör: varsayılan bir koleksiyonla dolu açılsın; mobilde 3D
   sahne hiç görünmüyor, listenin üstünde ~55vh sahne olsun.
3. Sayfa geçişleri sert kesme; View Transitions API ile "form sayfası
   süpürme" geçişi.
4. Renk-sadece hover'lar: tema/dil butonları, "↓ Eritilmiş Boru",
   konfigüratördeki koleksiyon kartları.
5. og:image (1200x630), eksik canonical'lar, test arşiv yazıları.
6. Odak halkaları tarayıcı mavisi; amber 2px halkaya geçilmeli.
7. Mobil header: marka yazısı 3 satıra kırılıyor; nav hedefleri 17-18px.
8. three.js tüm sayfalarda yükleniyor (JS 310-373 KB gzip); sadece
   konfigüratör/hub sayfalarında dinamik import.

Tur 1'den SONRA zaten düzeltilenler (henüz puanlanmadı): konfigüratör
`<h1>`'i, 404 başlık tekrarı, header menü linklerine amber alt çizgi,
mobilde "SEPET (00)" satır kırılması.
