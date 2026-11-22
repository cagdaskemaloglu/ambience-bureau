# DESIGN.md — The Ambience Bureau tasarım yönü

> Bu dosya sitenin görsel/kurgusal yönünü tanımlar. Yeni bir sayfa,
> bileşen ya da metin eklerken önce buraya bakın. Teknik ayrıntılar için
> `ARCHITECTURE.md`.
>
> **Oluşturulma:** 2026-11-21 — sürekli satılan ürünlerin (lambader, avize,
> aplik, masa lambası, sarkıt) eklenmesiyle birlikte.

## Konsept: Işık Tahsis Bürosu

Site bir mağaza değil, **ışığı tahsis eden bir devlet bürosu**. Ziyaretçi
alışveriş yapmaz; bir talep formu doldurur, bürodan bir nesne tahsis
edilir, nesne sicile işlenir ve belgesiyle birlikte teslim edilir.

Bu cümleden türeyen kararlar:

| Karar | Kural |
|---|---|
| Yerleşim | Her sayfa bir **resmi belge**: üstte form başlığı (FORM no, belge ref.), bölümler **§ numaralı maddeler** (§1, §2…), altta imza/onay şeridi. |
| Hareket fiili | **Dosyalamak**: kartlar çekmeceden çekilir gibi kayar, durum değişimleri **kaşe** gibi iner (kısa, net, ölçülü). Sürekli süs animasyonu yok. |
| Tip | Gövde ve başlıklar Inter; tüm sicil/kod/etiket verisi JetBrains Mono (tabular rakamlar). Büyük harf + geniş aralık SADECE belge etiketlerinde; ürün adları ve paragraflar normal yazım. |
| Renk | Kâğıt (açık) / mürekkep (koyu) zemin + **tek sıcak renk amber = ışığın kendisi**. Amber yalnızca: canlı durum, birincil eylem, ışık. Başka vurgu rengi eklenmez. |
| İmza anı | **Daimi Envanter dosya dolabı**: anasayfada sınıf indeksi (Sınıf F, C, W, D, P); bir sınıfın üstüne gelindiğinde/odaklanıldığında o sınıfın kartı çekmeceden kayarak önizleme gösterir. |
| Ekran görüntüsü karesi | Masthead: "Işık, tahsis edilir." başlığı + sağda canlı büro bülteni (aktif tahsis, kalan adet, envanter sayısı). |

**Swap testi:** "tahsis, sicil, sınıf, kaşe" başka bir lamba markasına
taşınamaz — Ambience Bureau'nun adına ve mevcut belge sistemine
(sertifika, dossier, registry no) bağlı.

## İki tahsis rejimi

Bütün ürünler iki rejimden birindedir (`product.saleMode`):

### 1. Sınırlı Tahsis (`limited`) — Drop'lar
- Numaralı, sonlu: `REG. NO. 006/050`.
- Anasayfada drop satırları (`DropRow`), geri sayım (`UpcomingDropRow`).
- Custom Registry'den tasarlanıp satın alınan adetler `owned` olarak
  drop'a işlenir.
- Dil: "drop", "tahsis", "kalan adet", "sicile işlendi".

### 2. Daimi Envanter (`standing`) — sürekli satış
- Sürekli satışta, stoklu. Kimlik bir **envanter kodu**: `ENV-F-012`
  (`registryNo` alanı bu ürünlerde stok kodu olarak kullanılır).
- **Sınıflar** (`product.category`):

  | Sınıf | Kod | TR | EN |
  |---|---|---|---|
  | F | `floor` | Lambader | Floor Lamp |
  | W | `wall` | Aplik | Wall Sconce |
  | D | `desk` | Masa Lambası | Table Lamp |
  | P | `pendant` | Sarkıt | Pendant |
  | S | `strip` | Şerit | Strip |

- Stok: `stockQuantity` boşsa "siparişe üretim" (sınırsız), `0` ise
  "stok tükendi", >0 ise adet. Ödeme onayında stok düşer.
- Dil: "envanter", "sınıf", "stokta", "siparişe üretim".

## Anasayfa düzeni (yukarıdan aşağı) — tek sayfa

Ziyaretçi TÜM ürünleri anasayfadan ayrılmadan keşfedebilmeli.

1. **Masthead** (`<h1>`): "Işık, tahsis edilir." + bir cümlelik
   açıklama. Sağda kaydırmalı **Büro Bülteni** paneli.
   (Alternatif: 3D görüntüleyici görünümlü "sahne" anasayfası
   `deneme/sahne-hero` branch'inde duruyor.)
2. **Yapışkan bölüm çubuğu** (§1 · §2 · §3 · §4 · §5): masthead'in altında
   durur, kaydırınca üste yapışır; ekrandaki bölüm amber çizgiyle işaretli.
3. **§1 Sınırlı Tahsis** — drop satırları.
4. **§2 Daimi Envanter** — sınıf indeksi (dosya dolabı). Bir sınıfa
   tıklamak sayfadan ayrılmaz: §3'e kayar ve onu o sınıfa süzer.
5. **§3 Tüm Kayıtlar** — bütün ürünler tek ızgarada; rejim (Tümü / Sınırlı /
   Daimi), sınıf çipleri ve fiyat sıralaması sayfa içinde, 12'şer kart.
6. **§4 Özel Tahsis** — Custom Registry daveti.
7. **§5 Kontrol Protokolü** — mobil uygulama.

## Büro Bülteni (duyuru paneli)

- Masthead'in sağındaki panel kaydırmalı: sayfa 1 canlı tahsis durumu
  (veriden otomatik), sonraki sayfalar Sanity "Bülten" kayıtları
  (sabitlenenler önce). `‹ 02 / 05 ›` sayacı, çekmece geçişi, 7 sn'de bir
  yavaş otomatik ilerleme (hover/odakta durur, kullanıcı gezinince kapanır,
  hareketi azalt ayarında hiç çalışmaz).
- Eski duyurular `/bulletin` sayfasında kayıt defteri gibi listelenir
  (Form 003 · Bülten Defteri), türe göre süzülür.
- Bülten kısa olmalı: başlık + 1-2 cümle. Uzun içerik Arşiv'e (post) yazılır
  ve bülten oraya link verir.

## Ürün kartı = dosya kartı

- Başlık şeridi kimliği taşır: `DROP-001 · 006/050` ya da
  `SINIF F · ENV-F-012`; sağda küçük durum yazısı.
- **Damga** sadece önemli durumlarda basılır: `TAHSİS EDİLDİ` (owned, amber),
  `HİZMET DIŞI` / `TÜKENDİ` (kırmızı), `SON N ADET` (amber, stok ≤ 3).
  Sıradan "sertifikalı" ürün sessiz kalır.
- Gövde: ad, sınıf · ışık sıcaklığı (renk noktası) · uygulama, owned ise
  sansürlü sahip satırı, fiyat.
- Eylemler: fareli büyük ekranda fotoğrafın altından çekmece gibi kayar;
  dokunmatikte kartın altında hep görünür. Sepete eklenemeyen kartta
  "Nesne Talep Et" hiç gösterilmez.
- Hover: kart 4px yükselir, köşelerde amber baskı kesim işaretleri belirir,
  fotoğraf %3 yakınlaşır.

## Etkileşim kuralları

- Birincil hedefler (CTA, ürün kartı, sınıf satırı) **renk değişiminden
  fazlasıyla** cevap verir: dolgu taşması, içerik kayması, çekmece.
  Yasal/yardımcı linkler sadece renk değiştirebilir.
- Her odak (focus) durumu görünür: amber 1px halka + 2px boşluk.
- `prefers-reduced-motion`: kayma/kaşe animasyonları kapanır, içerik
  aynen görünür.
- Native imleç korunur.

## Kaçınılacaklar

- Her başlığın üstüne otomatik mono etiket koymak — etiket ancak gerçek
  bir belge verisi taşıyorsa (FORM no, kod, tarih, adet) kullanılır.
- İkinci bir vurgu rengi, gradyan parıltılar, cam efekti.
- Placeholder metin; her metin büro diliyle ama **anlaşılır** olmalı —
  ziyaretçi 3 saniyede bunların lamba olduğunu anlamalı.
- Em/en dash (—) dolu UI metni; noktalı virgül veya iki nokta tercih edin.

## Jüri (kalite kontrol)

Kalite kontrolü juliobsz/skills `/jury` puanlamasıyla yapılır (Awwwards
ölçütleri: Tasarım %40, Kullanılabilirlik %30, Yaratıcılık %20, İçerik %10).
Puanlayan ajan kodu ve bu dosyayı GÖRMEZ, sadece ekran görüntülerini.
