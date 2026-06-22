-- ============================================================
-- THE AMBIENCE BUREAU — Supabase Database Schema
-- Supabase Dashboard > SQL Editor'da çalıştır
-- ============================================================

-- ── Extensions ───────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Enum Tipleri ─────────────────────────────────────────

CREATE TYPE order_status AS ENUM (
  'pending',        -- ödeme bekleniyor
  'processing',     -- ödeme alındı, hazırlanıyor
  'shipped',        -- kargoya verildi
  'delivered',      -- teslim edildi
  'cancelled',      -- iptal edildi
  'refunded'        -- iade edildi
);

CREATE TYPE order_item_type AS ENUM (
  'product',        -- standart ürün
  'custom'          -- Custom Registry tasarımı
);

CREATE TYPE design_status AS ENUM (
  'draft',          -- taslak (kaydedildi ama sipariş verilmedi)
  'ordered',        -- siparişe eklendi
  'archived'        -- arşivlendi
);

-- ── Tablolar ─────────────────────────────────────────────

-- Kullanıcı profilleri (auth.users ile 1:1)
CREATE TABLE IF NOT EXISTS public.profiles (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email          TEXT NOT NULL,
  full_name      TEXT,
  phone          TEXT,
  -- Varsayılan teslimat adresi
  address_line1  TEXT,
  address_line2  TEXT,
  city           TEXT,
  postal_code    TEXT,
  country        TEXT DEFAULT 'TR',
  -- Tercihler
  locale         TEXT DEFAULT 'tr' CHECK (locale IN ('tr', 'en')),
  marketing_opt  BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Siparişler
CREATE TABLE IF NOT EXISTS public.orders (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number      TEXT UNIQUE NOT NULL,  -- TAB-2026-xxxxx formatı
  -- Kullanıcı (üye veya misafir)
  user_id           UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  guest_email       TEXT,                  -- misafir checkout için
  -- Fiyat
  subtotal          INTEGER NOT NULL,      -- kuruş cinsinden (₺7490 → 749000)
  vat_amount        INTEGER NOT NULL DEFAULT 0,
  shipping_amount   INTEGER NOT NULL DEFAULT 0,
  total_amount      INTEGER NOT NULL,
  currency          TEXT NOT NULL DEFAULT 'TRY',
  -- Durum
  status            order_status DEFAULT 'pending',
  -- Teslimat adresi (snapshot — sipariş sonrası adres değişse bile kayıt korunur)
  shipping_name     TEXT,
  shipping_phone    TEXT,
  shipping_address1 TEXT,
  shipping_address2 TEXT,
  shipping_city     TEXT,
  shipping_postal   TEXT,
  shipping_country  TEXT DEFAULT 'TR',
  -- Ödeme
  iyzico_payment_id TEXT,                  -- iyzico'dan gelen ödeme ID
  iyzico_token      TEXT,                  -- iyzico checkout token
  paid_at           TIMESTAMPTZ,
  -- Notlar
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Özel tasarımlar (Custom Registry / 3D konfigüratörden)
-- NOT: Bu tablo order_items'tan ÖNCE oluşturulmalı çünkü order_items
-- bu tabloya foreign key ile referans veriyor.
CREATE TABLE IF NOT EXISTS public.custom_designs (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Kullanıcı
  user_id            UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  guest_session_id   TEXT,                 -- misafir için geçici session ID
  -- Tasarım verisi
  collection_key     TEXT NOT NULL,        -- Sanity collection key
  design_data        JSONB NOT NULL,       -- tüm slot/parça/malzeme seçimleri
  total_price        INTEGER NOT NULL,     -- hesaplanan toplam fiyat (kuruş)
  -- Görsel
  snapshot_url       TEXT,                 -- PNG export URL (Supabase Storage)
  -- Durum
  status             design_status DEFAULT 'draft',
  -- Referans numarası (bürokratik dil için)
  design_ref         TEXT UNIQUE,          -- FORM-104B-xxxxx formatı
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Sipariş kalemleri
CREATE TABLE IF NOT EXISTS public.order_items (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id         UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  item_type        order_item_type NOT NULL DEFAULT 'product',
  -- Ürün referansı (Sanity'den — snapshot olarak kopyalanır)
  sanity_product_id TEXT,                  -- Sanity _id
  registry_no      TEXT NOT NULL,          -- REG. NO. (snapshot)
  product_name     TEXT NOT NULL,          -- lokalize edilmiş isim (snapshot)
  -- Fiyat (snapshot — sonradan değişse bile sipariş fiyatı korunur)
  unit_price       INTEGER NOT NULL,       -- kuruş cinsinden
  quantity         INTEGER NOT NULL DEFAULT 1,
  total_price      INTEGER NOT NULL,       -- unit_price * quantity
  -- Custom tasarım için ek veri (order_item_type = 'custom' ise dolar)
  custom_design_id UUID REFERENCES public.custom_designs(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── İndeksler ────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS orders_user_id_idx       ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS orders_status_idx        ON public.orders(status);
CREATE INDEX IF NOT EXISTS orders_order_number_idx  ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS custom_designs_user_idx  ON public.custom_designs(user_id);
CREATE INDEX IF NOT EXISTS custom_designs_status_idx ON public.custom_designs(status);

-- ── Otomatik updated_at trigger'ı ────────────────────────

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER custom_designs_updated_at
  BEFORE UPDATE ON public.custom_designs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── Yeni kullanıcı profil oluşturma trigger'ı ─────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Sipariş numarası üretici ──────────────────────────────

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  random_part TEXT;
  new_number TEXT;
BEGIN
  year_part   := TO_CHAR(NOW(), 'YYYY');
  random_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 5));
  new_number  := 'TAB-' || year_part || '-' || random_part;
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- ── Tasarım referans numarası üretici ────────────────────

CREATE OR REPLACE FUNCTION public.generate_design_ref()
RETURNS TEXT AS $$
BEGIN
  RETURN 'FORM-104B-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
END;
$$ LANGUAGE plpgsql;

-- Sipariş ve tasarım numaralarını otomatik ata
CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := public.generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.set_design_ref()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.design_ref IS NULL OR NEW.design_ref = '' THEN
    NEW.design_ref := public.generate_design_ref();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_order_number();

CREATE TRIGGER custom_designs_set_ref
  BEFORE INSERT ON public.custom_designs
  FOR EACH ROW EXECUTE FUNCTION public.set_design_ref();
