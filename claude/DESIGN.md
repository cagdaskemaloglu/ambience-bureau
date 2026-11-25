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
- Sürekli satışta, stoklu. Kimlik bir **envanter kodu**: `ENV-S-012`
  (`registryNo` alanı bu ürünlerde stok kodu olarak kullanılır).
- **Sınıflar** (`product.category`):

  | Sınıf | Kod | TR | EN |
  |---|---|---|---|
  | S | `floor` | Lambader | Floor Lamp |
  | D | `wall` | Aplik | Wall Sconce |
  | F | `desk` | Masa Lambası | Table Lamp |
  | G | `pendant` | Sarkıt | Pendant |
  | H | `strip` | Şerit | Strip |

  Harfler sol el ana sırasıdır (A = Drops): anasayfa dizininde klavye
  kısayolu olarak da çalışır.

- Stok: `stockQuantity` boşsa "siparişe üretim" (sınırsız), `0` ise
  "stok tükendi", >0 ise adet. Ödeme onayında stok düşer.
- Dil: "envanter", "sınıf", "stokta", "siparişe üretim".

## Anasayfa düzeni (yukarıdan aşağı) — tek sayfa

Ziyaretçi TÜM ürünleri anasayfadan ayrılmadan keşfedebilmeli.

1. **Masthead** (`<h1>`): "Işık, tahsis edilir." + bir cümlelik
   açıklama. Sağda kaydırmalı **Büro Bülteni** paneli. Ortada (yalnızca
   ≥1024px) **tel kafes kutusu** (`HeroWireframe.tsx`): siyahtan uzay
   mavisine zeminde, Extruded Conduit drop'unun `extruded-conduit-1.0`
   ürününün kayıtlı dizilimi (taban → gövdeler → başlık) Sanity STL'lerinden
   kenar + soluk üçgen ağı olarak çizilip yavaşça döner. Canvas sayfa
   boşa çıkınca (requestIdleCallback) başlar, ~30 fps çizer, ekran
   dışındayken durur; telefona three.js inmez. Ürün slug'ı
   `queries.ts` → `HERO_WIREFRAME_PRODUCT_SLUG`.
   (Alternatif: 3D görüntüleyici görünümlü "sahne" anasayfası
   `deneme/sahne-hero` branch'inde duruyor.)
2. **Tahsis dizini** (`HomeIndex.tsx`, bölüm başlığı YOK): tek liste —
   `A Drops · S Lambader · D Aplik · F Masa Lambası · G Sarkıt`. Satırlar
   KAPALI başlar (Drops → drop satırları, sınıf → ürün kartları).
   Harf tuşu: kapalıysa açar ve kaydırır; açık ama odak başka satırdaysa o
   satıra GERİ döner; odak zaten oradaysa kapatır. Tıklama aç/kapat.
   Masaüstünde masthead + dizin tam bir ekranı doldurur (alttaki §1 başlığı
   ilk ekranda görünmez). Sağdaki yapışkan dosya kartı üzerine gelinen
   satırın ürünlerini 3B vitrinde (coverflow) tek tek tanıtır: ortadaki
   odakta, oklar, ← →, 3,2 sn'de bir otomatik ilerleme (hover/odakta durur,
   hareketi azalt ayarında kapalı). `#drop-NNN` bağlantıları Drops'u açıp
   o drop'a kaydırır.
3. **§1 Tüm Kayıtlar** — bütün ürünler tek ızgarada; rejim (Tümü / Sınırlı /
   Daimi), sınıf çipleri ve fiyat sıralaması sayfa içinde, 12'şer kart.
4. **§2 Özel Tahsis** — Custom Registry daveti.
5. **§3 Kontrol Protokolü** — mobil uygulama.
   Header'daki bölüm linkleri: §1 Dizin, §2 Kayıtlar.

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
  `SINIF S · ENV-S-012`; sağda küçük durum yazısı.
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
