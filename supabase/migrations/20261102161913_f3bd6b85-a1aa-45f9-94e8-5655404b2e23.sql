CREATE TABLE public.wallet_fundings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(20,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.crypto_receives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  coin TEXT NOT NULL,
  network TEXT NOT NULL,
  amount NUMERIC(30,10),
  from_address TEXT,
  wallet_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  tx_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.crypto_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  coin TEXT NOT NULL,
  network TEXT NOT NULL,
  amount NUMERIC(30,10) NOT NULL,
  fee NUMERIC(30,10) NOT NULL DEFAULT 0,
  to_address TEXT NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  tx_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.wallet_fundings, public.crypto_receives, public.crypto_sends TO authenticated;
GRANT ALL ON public.wallet_fundings, public.crypto_receives, public.crypto_sends TO service_role;
ALTER TABLE public.wallet_fundings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_receives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_sends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own fundings select" ON public.wallet_fundings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own fundings insert" ON public.wallet_fundings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own fundings update" ON public.wallet_fundings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own receives select" ON public.crypto_receives FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own receives insert" ON public.crypto_receives FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own receives update" ON public.crypto_receives FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own sends select" ON public.crypto_sends FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own sends insert" ON public.crypto_sends FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own sends update" ON public.crypto_sends FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX ON public.wallet_fundings (user_id, created_at DESC);
CREATE INDEX ON public.crypto_receives (user_id, created_at DESC);
CREATE INDEX ON public.crypto_sends (user_id, created_at DESC);
CREATE TRIGGER wallet_fundings_updated_at BEFORE UPDATE ON public.wallet_fundings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER crypto_receives_updated_at BEFORE UPDATE ON public.crypto_receives FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER crypto_sends_updated_at BEFORE UPDATE ON public.crypto_sends FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();