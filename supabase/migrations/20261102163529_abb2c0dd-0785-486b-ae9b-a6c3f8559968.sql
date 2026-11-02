CREATE TABLE public.crypto_buys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  coin TEXT NOT NULL,
  network TEXT NOT NULL,
  crypto_amount NUMERIC(30,10) NOT NULL,
  usd_amount NUMERIC(20,2) NOT NULL,
  fee_usd NUMERIC(20,2) NOT NULL DEFAULT 0,
  total_usd NUMERIC(20,2) NOT NULL DEFAULT 0,
  price_usd NUMERIC(20,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  tx_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.crypto_sells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  coin TEXT NOT NULL,
  network TEXT NOT NULL,
  crypto_amount NUMERIC(30,10) NOT NULL,
  usd_amount NUMERIC(20,2) NOT NULL,
  fee_usd NUMERIC(20,2) NOT NULL DEFAULT 0,
  payout_usd NUMERIC(20,2) NOT NULL DEFAULT 0,
  price_usd NUMERIC(20,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  tx_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.crypto_buys, public.crypto_sells TO authenticated;
GRANT ALL ON public.crypto_buys, public.crypto_sells TO service_role;
ALTER TABLE public.crypto_buys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_sells ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own buys select" ON public.crypto_buys FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own buys insert" ON public.crypto_buys FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own buys update" ON public.crypto_buys FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own sells select" ON public.crypto_sells FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own sells insert" ON public.crypto_sells FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own sells update" ON public.crypto_sells FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX ON public.crypto_buys (user_id, created_at DESC);
CREATE INDEX ON public.crypto_sells (user_id, created_at DESC);
CREATE TRIGGER crypto_buys_updated_at BEFORE UPDATE ON public.crypto_buys FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER crypto_sells_updated_at BEFORE UPDATE ON public.crypto_sells FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();