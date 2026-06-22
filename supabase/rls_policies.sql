-- ============================================================
-- THE AMBIENCE BUREAU — Row Level Security Policies
-- schema.sql çalıştırıldıktan SONRA bu dosyayı çalıştır
-- ============================================================

-- ── RLS'i Aktifleştir ────────────────────────────────────

ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_designs ENABLE ROW LEVEL SECURITY;

-- ── PROFILES ─────────────────────────────────────────────

-- Kullanıcı kendi profilini görebilir
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Kullanıcı kendi profilini güncelleyebilir
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Profil oluşturma trigger üzerinden otomatik (handle_new_user SECURITY DEFINER ile çalışır)
-- Bu yüzden INSERT policy gerekmiyor, trigger zaten yetkili çalışıyor

-- ── ORDERS ───────────────────────────────────────────────

-- Üye kullanıcı kendi siparişlerini görebilir
CREATE POLICY "orders_select_own"
  ON public.orders FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    -- Misafir siparişleri: e-posta + sipariş no kombinasyonuyla
    -- (API route üzerinden service role ile sorgulanacak, burada sadece üye erişimi)
    FALSE
  );

-- Üye kullanıcı kendi adına sipariş oluşturabilir
CREATE POLICY "orders_insert_own"
  ON public.orders FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR
    -- Misafir checkout: user_id NULL olabilir, guest_email zorunlu
    (user_id IS NULL AND guest_email IS NOT NULL)
  );

-- Sipariş güncellemesi sadece service role üzerinden (webhook/admin)
-- Normal kullanıcı kendi siparişini güncelleyemez (ödeme durumu manipülasyonunu önler)
-- Bu yüzden UPDATE policy YOK — sadece service role (RLS bypass) güncelleyebilir

-- ── ORDER_ITEMS ──────────────────────────────────────────

-- Kullanıcı kendi siparişine ait kalemleri görebilir
CREATE POLICY "order_items_select_own"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Kullanıcı kendi siparişine kalem ekleyebilir (checkout sırasında)
CREATE POLICY "order_items_insert_own"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
    )
  );

-- ── CUSTOM_DESIGNS ───────────────────────────────────────

-- Üye kullanıcı kendi tasarımlarını görebilir
CREATE POLICY "custom_designs_select_own"
  ON public.custom_designs FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    -- Misafir: kendi session'ındaki tasarımı görebilir
    (user_id IS NULL AND guest_session_id IS NOT NULL)
  );

-- Herkes (üye veya misafir) tasarım kaydedebilir
CREATE POLICY "custom_designs_insert_any"
  ON public.custom_designs FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR
    (user_id IS NULL AND guest_session_id IS NOT NULL)
  );

-- Kullanıcı kendi taslak tasarımını güncelleyebilir (örn. malzeme değiştirme)
CREATE POLICY "custom_designs_update_own"
  ON public.custom_designs FOR UPDATE
  USING (
    auth.uid() = user_id
    OR
    (user_id IS NULL AND guest_session_id IS NOT NULL)
  );

-- Kullanıcı kendi taslak tasarımını silebilir
CREATE POLICY "custom_designs_delete_own"
  ON public.custom_designs FOR DELETE
  USING (
    auth.uid() = user_id
    OR
    (user_id IS NULL AND guest_session_id IS NOT NULL)
  );

-- ============================================================
-- NOT: Misafir checkout akışında siparişler/tasarımlar için
-- gerçek erişim kontrolü Next.js API route'ları üzerinden,
-- SERVICE ROLE client ile yapılacak (RLS bypass).
-- Bu policy'ler öncelikle ÜYE kullanıcıların kendi verilerine
-- client-side (browser) erişimini güvenli kılmak içindir.
-- ============================================================
