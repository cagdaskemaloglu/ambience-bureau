# Supabase Kurulumu — The Ambience Bureau

## 1. Proje Oluştur

[supabase.com](https://supabase.com) → New Project → bölge olarak Frankfurt (eu-central-1) seç (Türkiye'ye en yakın, KVKK için de mantıklı).

## 2. SQL Şemalarını Çalıştır

Supabase Dashboard → **SQL Editor** → sırasıyla çalıştır:

1. `schema.sql` — tabloları, enum'ları, trigger'ları oluşturur
2. `rls_policies.sql` — Row Level Security politikalarını ekler

**Önemli:** Sırayla çalıştır, `rls_policies.sql` tablolar oluşmadan çalışmaz.

## 3. Auth Ayarları

Dashboard → **Authentication** → **Providers**:
- Email provider'ı aktif et
- "Confirm email" ayarını projenin ihtiyacına göre aç/kapat (geliştirme sırasında kapatabilirsin, hız için)

Dashboard → **Authentication** → **URL Configuration**:
- Site URL: `http://localhost:3000` (geliştirme), sonra production domain
- Redirect URLs: `http://localhost:3000/auth/callback` ekle

## 4. API Anahtarlarını Al

Dashboard → **Settings** → **API**:
- `Project URL` → `.env.local`'de `NEXT_PUBLIC_SUPABASE_URL`
- `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY` (**asla client'a expose etme**)

## 5. Doğrulama

```bash
npm run dev
```

Tarayıcı console'da Supabase bağlantı hatası yoksa kurulum tamam.

## Tablo Özeti

| Tablo | Amaç |
|---|---|
| `profiles` | Kullanıcı profili (auth.users ile otomatik senkron, trigger ile) |
| `orders` | Sipariş kaydı — üye veya misafir (`guest_email`) |
| `order_items` | Sipariş kalemleri — ürün veya custom tasarım |
| `custom_designs` | 3D konfigüratörden gelen özel tasarımlar |

## Güvenlik Notu

- Normal kullanıcı sipariş **durumunu** değiştiremez (RLS'de UPDATE policy yok) — bu sadece `service_role` (API route/webhook) üzerinden yapılır, ödeme manipülasyonunu önler.
- Misafir checkout, `guest_email` / `guest_session_id` ile çalışır, gerçek erişim kontrolü API route'ları üzerinden (service role ile) sağlanır.
