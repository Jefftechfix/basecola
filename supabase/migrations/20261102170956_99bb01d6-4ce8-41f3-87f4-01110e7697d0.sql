CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('buy', 'sell', 'send', 'receive', 'funding')),
  direction TEXT NOT NULL DEFAULT 'credit' CHECK (direction IN ('credit', 'debit')),
  coin TEXT,
  network TEXT,
  crypto_amount NUMERIC(30,10),
  usd_amount NUMERIC(20,2) NOT NULL DEFAULT 0,
  fee_usd NUMERIC(20,2) NOT NULL DEFAULT 0,
  price_usd NUMERIC(20,2) NOT NULL DEFAULT 0,
  reference TEXT,
  counterparty TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  tx_hash TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own transactions select" ON public.transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own transactions insert" ON public.transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own transactions update" ON public.transactions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX ON public.transactions (user_id, created_at DESC);
CREATE INDEX ON public.transactions (user_id, kind, created_at DESC);
CREATE TRIGGER transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();