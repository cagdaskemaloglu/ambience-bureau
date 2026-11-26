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

  Harfler sınıf kodudur (kartlardaki "Sınıf S" gibi); anasayfada klavye
  kısayolu DEĞİLDİR (kaldırıldı).

- Stok: `stockQuantity` boşsa "siparişe üretim" (sınırsız), `0` ise
  "stok tükendi", >0 ise adet. Ödeme onayında stok düşer.
- Dil: "envanter", "sınıf", "stokta", "siparişe üretim".

## Tel kafes teması (karanlık tema)

Karanlık tema = **tel kafes teması**; aydınlık tema = **materyal**
görünümü (kırık beyaz kâğıt). Tema düğmesi, uygulamadaki
Tel kafes ↔ Materyal fikrinin site karşılığıdır.

- Renkler `globals.css` → `.dark` değişkenlerinde: zemin `#050A18`, yüzey
  `#0A152E`, tel çizgi (`rule`) `#1F2F52`, ikincil metin mavi-gri
  `#A4B2CC`, ön plan kırık beyaz `#F2F0EA`, vurgu yine amber. Header/footer
  çizgisi `#1F3A66`. Yeni token: `bureau-wire` (karanlıkta `#A9C8FF`,
  aydınlıkta Space Blue) — 3B çizimlerle aynı mavi.
- Sayfa zemini (`.dark body`): siyahtan uzay mavisine sabit gradyan.
- 3B tel kafes sahneleri (`HeroWireframeScene.tsx`) iki tonda çizilir:
  `night` (gece mavisi zemin, açık mavi additive çizgi) ve `paper` (kâğıt
  zemin, Space Blue mürekkep). Zemin sınıfları `.hero-wireframe` /
  `.wire-stage`, temaya göre değişir.
- Ürün sayfası (`ProductViewer.tsx`): parça dizilimi kayıtlı "stack"
  ürünlerde **TEL KAFES | MATERYAL** düğmesi. Varsayılan temaya göre
  (karanlık → tel kafes, aydınlık → materyal/fotoğraflar).

## Anasayfa düzeni (yukarıdan aşağı) — tek sayfa

Ziyaretçi TÜM ürünleri anasayfadan ayrılmadan keşfedebilmeli.

1. **İlk ekran = tek sayfalık "header"** (`HomeIndex.tsx`, `<h1>` dahil):
   header'ın altından ekranın sonuna kadar (masaüstü). 3B tel kafes sahnesi
   (`HeroWireframe.tsx`) ilk ekranın TAMAMINA yayılır; kenarlara doğru
   vinyetle siyaha erir (`.hero-vignette`; aydınlık temada kâğıda).
   Sahne nesneleri SIRAYLA gösterir (`queries.ts` → `getHeroWireframes`:
   önce `HERO_WIREFRAME_PRODUCT_SLUG`, sonra drop ("stack") ürünleri ile
   Montajlı Modeller (`lampModel`) karışık, en çok 40); gösterilen yüklenince
   sıradaki arka planda iner, ≥12 sn sonra yumuşak geçişle girer. Çizim:
   yatay halkalar + meridyen kesitleri (üçgen ağı yok). Montajlı modeller
   Blender konumunda + Sanity ofset/rotasyonuyla; masa lambaları zemine
   oturur, sarkıtlar (`hangFromCeiling`) tavan ızgarası ve göbeğinden
   kordonla sarkar (priz/kablo yok). Oda lambanın yüksekliği VE taban izine
   göre büyür. `?wf=<ürün-slug|model-id>` sahneyi o nesneyle başlatır.
   Solda künye + başlık + açıklama + eylemler (`MastheadIntro`); sağda Büro
   Bülteni ve üzerine gelinen satırın önizleme kartı (3B vitrin). Dizin
   menüsü ilk ekranın ALTINDA tam genişlikte YATAY bir şerit. Satır
   içerikleri (drop'lar, ürün kartları) ilk ekranın altında panel olarak
   açılır.
   **Çerçeve (md+):** header ve footer SABİT, içerik aralarında kayar
   (`[locale]/layout.tsx`); telefonda footer içerikle kayar. İçerik aşağı
   kayınca footer'ın üstünde **"Header'a ışınla"** oku (`BackToHeader.tsx`)
   belirir: anında en üste ışınlar, kısa bir amber ışın izi bırakır.
2. **Dizin menüsü** (ilk ekranın altındaki yatay şerit; aşağı kayınca
   header'ın altında SABİT/sticky kalır, telefonda tek satır ve yana kayar):
   `Drops · Lambader · Aplik · Masa Lambası · Sarkıt · Tüm Kayıtlar`.
   Harf kısayolu YOK. Anasayfa = header + footer + aralarında TEK seçim
   alanı (`#secim-alani`): bir kalem seçilince içeriği ilk ekranın altında
   gösterilir ve öncekinin YERİNE geçer; seçili kaleme ya da "Kapat ✕"a
   tıklamak alanı kapatıp ilk ekrana döner. Drops → drop satırları, sınıf →
   ürün kartları, Tüm Kayıtlar → `RegisterSection` (rejim/sınıf/fiyat
   süzgeçleri). Seçim alanı en az (görünür alan − menü) yüksekliğindedir:
   içerik kısa olsa da menü en üste oturur. Önizleme kartı SABİT
   yükseklikte (boş kategoride de aynı), menüde gezinirken yerleşim
   zıplamaz; üzerine gelinen kalemin ürünlerini 3B
   vitrinde (coverflow) tanıtır: oklar, ← →, 3,2 sn'de bir otomatik
   ilerleme (hover/odakta durur, hareketi azalt ayarında kapalı).
   `#drop-NNN` Drops'u açıp o drop'a, `#tum-kayitlar` Tüm Kayıtlar'ı açar
   (header linkleri ve `requestRegisterFilter` hash + `hashchange` ile).
3. Eski §1 Tüm Kayıtlar / §2 Özel Tahsis / §3 Kontrol Protokolü bantları
   anasayfadan KALDIRILDI (Tüm Kayıtlar menüde; Özel Tahsis header
   düğmesinde; Kontrol Protokolü kendi sayfasında).
   Header'da anasayfa bölüm linkleri YOK (§1 Dizin / §2 Kayıtlar kaldırıldı;
   menü ilk ekranın altında).
4. **Özel Tahsis (koleksiyon seçimi)** ilk ekranda, "Işık, tahsis edilir."
   bloğunun YERİNDE açılır (`HeroCollectionPicker.tsx`); 3B görüntüleyici
   yerinde kalır. Tetikleyenler: "Kendi lambanı tasarla", header'daki
   "Özel Tahsis" ve `#ozel-tahsis`. Koleksiyon seçilince konfigüratör
   `/custom-registry?collection=…` ile doğrudan açılır; koleksiyonsuz
   `/custom-registry` anasayfadaki seçime (`/{locale}#ozel-tahsis`)
   yönlendirilir. "← Geri" tanıtıma döner.

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
