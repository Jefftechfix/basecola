CREATE TABLE public.treasury_wallet_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  network TEXT NOT NULL,
  address TEXT NOT NULL,
  wallet_type TEXT NOT NULL CHECK (wallet_type IN ('hot', 'cold', 'treasury')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (network, address)
);

CREATE TABLE public.treasury_balance_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_account_id UUID NOT NULL REFERENCES public.treasury_wallet_accounts(id) ON DELETE RESTRICT,
  asset TEXT NOT NULL,
  balance NUMERIC(38,18) NOT NULL CHECK (balance >= 0),
  amount_usd NUMERIC(20,2) CHECK (amount_usd IS NULL OR amount_usd >= 0),
  block_number BIGINT CHECK (block_number IS NULL OR block_number >= 0),
  block_hash TEXT,
  observation_ref TEXT NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (wallet_account_id, asset, observation_ref)
);

CREATE INDEX treasury_balance_observations_latest_idx
  ON public.treasury_balance_observations (wallet_account_id, asset, observed_at DESC);
CREATE INDEX treasury_wallet_accounts_status_idx
  ON public.treasury_wallet_accounts (status, network, wallet_type);

ALTER TABLE public.treasury_wallet_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treasury_balance_observations ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.treasury_wallet_accounts, public.treasury_balance_observations TO service_role;

CREATE TRIGGER treasury_wallet_accounts_updated_at
  BEFORE UPDATE ON public.treasury_wallet_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE VIEW public.treasury_latest_balance_observations AS
SELECT DISTINCT ON (wallet_account_id, asset)
  id, wallet_account_id, asset, balance, amount_usd, block_number, block_hash, observation_ref, observed_at
FROM public.treasury_balance_observations
ORDER BY wallet_account_id, asset, observed_at DESC, created_at DESC;

REVOKE ALL ON public.treasury_latest_balance_observations FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.treasury_latest_balance_observations TO service_role;

CREATE OR REPLACE FUNCTION public.record_treasury_balance_observation(
  _network TEXT,
  _address TEXT,
  _asset TEXT,
  _balance NUMERIC,
  _amount_usd NUMERIC,
  _block_number BIGINT,
  _block_hash TEXT,
  _observation_ref TEXT,
  _observed_at TIMESTAMPTZ
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE wallet_id UUID; observation_id UUID;
BEGIN
  IF nullif(trim(_network), '') IS NULL OR nullif(trim(_address), '') IS NULL
    OR nullif(trim(_asset), '') IS NULL OR nullif(trim(_observation_ref), '') IS NULL
    OR _balance IS NULL OR _balance < 0 OR (_amount_usd IS NOT NULL AND _amount_usd < 0)
    OR _observed_at IS NULL THEN
    RAISE EXCEPTION 'Invalid treasury balance observation.';
  END IF;

  SELECT id INTO wallet_id FROM public.treasury_wallet_accounts
  WHERE network = trim(_network) AND address = trim(_address);
  IF wallet_id IS NULL THEN RAISE EXCEPTION 'Treasury wallet is not registered.'; END IF;

  INSERT INTO public.treasury_balance_observations (
    wallet_account_id, asset, balance, amount_usd, block_number, block_hash, observation_ref, observed_at
  ) VALUES (
    wallet_id, upper(trim(_asset)), _balance, _amount_usd, _block_number, _block_hash, trim(_observation_ref), _observed_at
  )
  ON CONFLICT (wallet_account_id, asset, observation_ref) DO UPDATE SET
    balance = EXCLUDED.balance,
    amount_usd = EXCLUDED.amount_usd,
    block_number = EXCLUDED.block_number,
    block_hash = EXCLUDED.block_hash,
    observed_at = EXCLUDED.observed_at
  RETURNING id INTO observation_id;

  RETURN observation_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_treasury_balance_observation(TEXT, TEXT, TEXT, NUMERIC, NUMERIC, BIGINT, TEXT, TEXT, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_treasury_balance_observation(TEXT, TEXT, TEXT, NUMERIC, NUMERIC, BIGINT, TEXT, TEXT, TIMESTAMPTZ) TO service_role;