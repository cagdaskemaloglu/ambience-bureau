-- ============================================================
-- Başvurular: "Bölge Bürosu Ol" (hub) ve "Tasarım Departmanına Katıl" (creator)
-- Supabase → SQL Editor'de BİR KEZ çalıştırın.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.applications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       text NOT NULL CHECK (type IN ('hub', 'creator')),
  country    text,                       -- ISO 3166-1 alpha-2 (örn. TR)
  name       text NOT NULL,
  email      text NOT NULL,
  phone      text,
  message    text NOT NULL,
  details    jsonb NOT NULL DEFAULT '{}'::jsonb,
  locale     text,
  status     text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS applications_user_idx ON public.applications (user_id);
CREATE INDEX IF NOT EXISTS applications_type_idx ON public.applications (type, created_at DESC);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Üye yalnızca KENDİ adına başvuru ekleyebilir ve kendi başvurularını görebilir.
CREATE POLICY "applications_insert_own"
  ON public.applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "applications_select_own"
  ON public.applications FOR SELECT
  USING (auth.uid() = user_id);
