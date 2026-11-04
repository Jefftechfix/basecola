CREATE TABLE public.deposit_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  wallet_account_id UUID REFERENCES public.wallet_accounts(id) ON DELETE SET NULL,
  network TEXT NOT NULL,
  asset TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  event_index INTEGER NOT NULL DEFAULT 0 CHECK (event_index >= 0),
  deposit_address TEXT NOT NULL,
  destination_tag BIGINT CHECK (destination_tag BETWEEN 0 AND 4294967295),
  crypto_amount NUMERIC(38,18) NOT NULL CHECK (crypto_amount > 0),
  amount_usd NUMERIC(20,2) CHECK (amount_usd IS NULL OR amount_usd >= 0),
  block_number BIGINT CHECK (block_number IS NULL OR block_number >= 0),
  block_hash TEXT,
  confirmations INTEGER NOT NULL DEFAULT 0 CHECK (confirmations >= 0),
  required_confirmations INTEGER NOT NULL DEFAULT 1 CHECK (required_confirmations > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  failure_reason TEXT,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (network, tx_hash, event_index)
);

CREATE INDEX deposit_observations_status_date_idx ON public.deposit_observations (status, observed_at DESC);
CREATE INDEX deposit_observations_user_date_idx ON public.deposit_observations (user_id, observed_at DESC);
CREATE INDEX deposit_observations_asset_network_date_idx ON public.deposit_observations (asset, network, observed_at DESC);

ALTER TABLE public.deposit_observations ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.deposit_observations TO authenticated;
GRANT ALL ON public.deposit_observations TO service_role;

CREATE POLICY "Users view own deposit observations"
  ON public.deposit_observations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER deposit_observations_updated_at
  BEFORE UPDATE ON public.deposit_observations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.record_chain_deposit(
  _network TEXT,
  _asset TEXT,
  _tx_hash TEXT,
  _event_index INTEGER,
  _deposit_address TEXT,
  _destination_tag BIGINT,
  _crypto_amount NUMERIC,
  _amount_usd NUMERIC,
  _block_number BIGINT,
  _block_hash TEXT,
  _confirmations INTEGER,
  _required_confirmations INTEGER,
  _is_failed BOOLEAN DEFAULT false,
  _failure_reason TEXT DEFAULT NULL,
  _observed_at TIMESTAMPTZ DEFAULT now()
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  matched_user_id UUID;
  matched_wallet_account_id UUID;
  next_status TEXT;
  observation_id UUID;
BEGIN
  IF nullif(trim(_network), '') IS NULL OR nullif(trim(_asset), '') IS NULL
    OR nullif(trim(_tx_hash), '') IS NULL OR nullif(trim(_deposit_address), '') IS NULL
    OR _event_index IS NULL OR _event_index < 0
    OR _crypto_amount IS NULL OR _crypto_amount <= 0
    OR (_amount_usd IS NOT NULL AND _amount_usd < 0)
    OR _confirmations IS NULL OR _confirmations < 0
    OR _required_confirmations IS NULL OR _required_confirmations <= 0 THEN
    RAISE EXCEPTION 'Invalid chain deposit event.';
  END IF;

  SELECT wa.user_id, wa.id INTO matched_user_id, matched_wallet_account_id
  FROM public.wallet_accounts wa
  WHERE wa.network = trim(_network)
    AND wa.address = trim(_deposit_address)
    AND wa.destination_tag IS NOT DISTINCT FROM _destination_tag
    AND wa.status = 'active'
  LIMIT 1;

  next_status := CASE
    WHEN coalesce(_is_failed, false) THEN 'failed'
    WHEN _confirmations >= _required_confirmations THEN 'confirmed'
    ELSE 'pending'
  END;

  INSERT INTO public.deposit_observations (
    user_id, wallet_account_id, network, asset, tx_hash, event_index, deposit_address,
    destination_tag, crypto_amount, amount_usd, block_number, block_hash,
    confirmations, required_confirmations, status, failure_reason, observed_at, confirmed_at
  ) VALUES (
    matched_user_id, matched_wallet_account_id, trim(_network), upper(trim(_asset)), trim(_tx_hash), _event_index, trim(_deposit_address),
    _destination_tag, _crypto_amount, _amount_usd, _block_number, _block_hash,
    _confirmations, _required_confirmations, next_status, nullif(left(trim(_failure_reason), 500), ''), coalesce(_observed_at, now()),
    CASE WHEN next_status = 'confirmed' THEN now() ELSE NULL END
  )
  ON CONFLICT (network, tx_hash, event_index) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    wallet_account_id = EXCLUDED.wallet_account_id,
    asset = EXCLUDED.asset,
    deposit_address = EXCLUDED.deposit_address,
    destination_tag = EXCLUDED.destination_tag,
    crypto_amount = EXCLUDED.crypto_amount,
    amount_usd = EXCLUDED.amount_usd,
    block_number = EXCLUDED.block_number,
    block_hash = EXCLUDED.block_hash,
    confirmations = EXCLUDED.confirmations,
    required_confirmations = EXCLUDED.required_confirmations,
    status = EXCLUDED.status,
    failure_reason = EXCLUDED.failure_reason,
    observed_at = EXCLUDED.observed_at,
    confirmed_at = CASE
      WHEN EXCLUDED.status = 'confirmed' THEN coalesce(public.deposit_observations.confirmed_at, now())
      ELSE NULL
    END
  WHERE EXCLUDED.observed_at >= public.deposit_observations.observed_at
  RETURNING id INTO observation_id;

  IF observation_id IS NULL THEN
    SELECT id INTO observation_id FROM public.deposit_observations
    WHERE network = trim(_network) AND tx_hash = trim(_tx_hash) AND event_index = _event_index;
  END IF;
  RETURN observation_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_chain_deposit(TEXT, TEXT, TEXT, INTEGER, TEXT, BIGINT, NUMERIC, NUMERIC, BIGINT, TEXT, INTEGER, INTEGER, BOOLEAN, TEXT, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_chain_deposit(TEXT, TEXT, TEXT, INTEGER, TEXT, BIGINT, NUMERIC, NUMERIC, BIGINT, TEXT, INTEGER, INTEGER, BOOLEAN, TEXT, TIMESTAMPTZ) TO service_role;