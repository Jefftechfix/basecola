ALTER TABLE public.wallet_accounts
  DROP CONSTRAINT wallet_accounts_network_check,
  ADD CONSTRAINT wallet_accounts_network_check CHECK (
    network IN (
      'bitcoin-testnet', 'ethereum-sepolia', 'solana-devnet', 'xrpl-testnet',
      'bitcoin-mainnet', 'ethereum-mainnet', 'solana-mainnet', 'xrpl-mainnet'
    )
  ),
  ADD COLUMN turnkey_wallet_id TEXT,
  ADD COLUMN turnkey_account_id TEXT;

REVOKE SELECT ON public.wallet_accounts, public.custody_provisioning_jobs FROM authenticated;
GRANT SELECT (
  id, user_id, network, address, destination_tag, status, created_at, updated_at
) ON public.wallet_accounts TO authenticated;

CREATE UNIQUE INDEX wallet_accounts_turnkey_identity_idx
  ON public.wallet_accounts (turnkey_wallet_id, turnkey_account_id)
  WHERE turnkey_wallet_id IS NOT NULL AND turnkey_account_id IS NOT NULL;

ALTER TABLE public.custody_provisioning_jobs
  DROP CONSTRAINT custody_provisioning_jobs_network_check,
  ADD CONSTRAINT custody_provisioning_jobs_network_check CHECK (
    network IN (
      'bitcoin-testnet', 'ethereum-sepolia', 'solana-devnet', 'xrpl-testnet',
      'bitcoin-mainnet', 'ethereum-mainnet', 'solana-mainnet', 'xrpl-mainnet'
    )
  );

ALTER TABLE public.deposit_observations
  ADD COLUMN sender_address TEXT,
  ADD COLUMN accounting_revision INTEGER NOT NULL DEFAULT 0 CHECK (accounting_revision >= 0);

INSERT INTO public.platform_asset_networks (
  asset, network, display_name, minimum_deposit, required_confirmations, enabled
) VALUES
  ('BTC', 'bitcoin-mainnet', 'Bitcoin', 0, 6, false),
  ('ETH', 'ethereum-mainnet', 'Ethereum', 0, 12, false),
  ('USDT', 'ethereum-mainnet', 'Tether (ERC-20)', 0, 12, false),
  ('SOL', 'solana-mainnet', 'Solana', 0, 32, false),
  ('XRP', 'xrpl-mainnet', 'XRP Ledger', 10, 1, false)
ON CONFLICT (asset, network) DO NOTHING;

CREATE TABLE public.crypto_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  wallet_id UUID REFERENCES public.wallet_accounts(id) ON DELETE RESTRICT,
  asset TEXT NOT NULL,
  network TEXT NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal')),
  transaction_hash TEXT,
  event_index INTEGER NOT NULL DEFAULT 0 CHECK (event_index >= 0),
  amount NUMERIC(38,18) NOT NULL CHECK (amount > 0),
  fee NUMERIC(38,18) NOT NULL DEFAULT 0 CHECK (fee >= 0),
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'failed', 'reversed', 'requested', 'signed', 'broadcast')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (network, transaction_hash, event_index)
);

CREATE INDEX crypto_transactions_user_date_idx
  ON public.crypto_transactions (user_id, created_at DESC);
CREATE INDEX crypto_transactions_status_date_idx
  ON public.crypto_transactions (status, created_at DESC);

CREATE TABLE public.crypto_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  wallet_id UUID NOT NULL REFERENCES public.wallet_accounts(id) ON DELETE RESTRICT,
  asset TEXT NOT NULL,
  network TEXT NOT NULL,
  destination_address TEXT NOT NULL,
  destination_tag BIGINT CHECK (destination_tag BETWEEN 0 AND 4294967295),
  amount NUMERIC(38,18) NOT NULL CHECK (amount > 0),
  network_fee NUMERIC(38,18) NOT NULL CHECK (network_fee >= 0),
  transaction_hash TEXT,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'signed', 'broadcast', 'confirmed', 'failed', 'cancelled')),
  approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  idempotency_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, idempotency_key)
);

CREATE INDEX crypto_withdrawals_user_date_idx
  ON public.crypto_withdrawals (user_id, created_at DESC);
CREATE INDEX crypto_withdrawals_review_idx
  ON public.crypto_withdrawals (approval_status, created_at)
  WHERE approval_status = 'pending';

CREATE TABLE public.crypto_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  asset TEXT NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'deposit_reversal', 'withdrawal_reserve', 'withdrawal_release', 'withdrawal_settlement')),
  reference_id UUID NOT NULL,
  debit NUMERIC(38,18) NOT NULL DEFAULT 0 CHECK (debit >= 0),
  credit NUMERIC(38,18) NOT NULL DEFAULT 0 CHECK (credit >= 0),
  balance_after NUMERIC(38,18) NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0))
);

CREATE INDEX crypto_ledger_user_asset_date_idx
  ON public.crypto_ledger (user_id, asset, created_at DESC);
CREATE INDEX crypto_ledger_reference_idx
  ON public.crypto_ledger (reference_id);

ALTER TABLE public.crypto_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_ledger ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.crypto_transactions, public.crypto_withdrawals, public.crypto_ledger TO authenticated;
GRANT ALL ON public.crypto_transactions, public.crypto_withdrawals, public.crypto_ledger TO service_role;

CREATE POLICY "Users view own crypto transactions"
  ON public.crypto_transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users view own crypto withdrawals"
  ON public.crypto_withdrawals FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users view own crypto ledger"
  ON public.crypto_ledger FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER crypto_transactions_updated_at
  BEFORE UPDATE ON public.crypto_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER crypto_withdrawals_updated_at
  BEFORE UPDATE ON public.crypto_withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.claim_custody_provisioning_job(
  _user_id UUID,
  _network TEXT,
  _lease_seconds INTEGER DEFAULT 120
) RETURNS SETOF public.custody_provisioning_jobs
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _user_id IS NULL OR _network NOT IN (
    'bitcoin-mainnet', 'ethereum-mainnet', 'solana-mainnet', 'xrpl-mainnet'
  ) OR _lease_seconds NOT BETWEEN 30 AND 600 THEN
    RAISE EXCEPTION 'Invalid provisioning job claim.';
  END IF;

  RETURN QUERY
  UPDATE public.custody_provisioning_jobs AS job
  SET status = 'processing',
      attempts = job.attempts + 1,
      locked_until = now() + make_interval(secs => _lease_seconds),
      last_error_code = NULL
  WHERE job.id = (
    SELECT candidate.id
    FROM public.custody_provisioning_jobs AS candidate
    WHERE candidate.user_id = _user_id
      AND candidate.network = _network
      AND (
        (candidate.status IN ('queued', 'retry') AND candidate.available_at <= now())
        OR (candidate.status = 'processing' AND candidate.locked_until < now())
      )
    FOR UPDATE SKIP LOCKED
    LIMIT 1
  )
  RETURNING job.*;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_custody_provisioning_job(UUID, TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_custody_provisioning_job(UUID, TEXT, INTEGER) TO service_role;

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
  _observed_at TIMESTAMPTZ DEFAULT now(),
  _sender_address TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  matched_user_id UUID;
  matched_wallet_id UUID;
  next_status TEXT;
  observation_id UUID;
  existing public.deposit_observations;
  has_existing BOOLEAN;
BEGIN
  IF _network NOT IN ('bitcoin-mainnet', 'ethereum-mainnet', 'solana-mainnet', 'xrpl-mainnet')
    OR _asset NOT IN ('BTC', 'ETH', 'USDT', 'SOL', 'XRP')
    OR nullif(trim(_tx_hash), '') IS NULL
    OR nullif(trim(_deposit_address), '') IS NULL
    OR _event_index IS NULL OR _event_index < 0
    OR _crypto_amount IS NULL OR _crypto_amount <= 0
    OR (_amount_usd IS NOT NULL AND _amount_usd < 0)
    OR _confirmations IS NULL OR _confirmations < 0
    OR _required_confirmations IS NULL OR _required_confirmations <= 0 THEN
    RAISE EXCEPTION 'Invalid chain deposit event.';
  END IF;

  SELECT wa.user_id, wa.id INTO matched_user_id, matched_wallet_id
  FROM public.wallet_accounts AS wa
  WHERE wa.network = _network
    AND wa.address = trim(_deposit_address)
    AND wa.destination_tag IS NOT DISTINCT FROM _destination_tag
    AND wa.status = 'active'
  LIMIT 1;

  IF matched_user_id IS NULL THEN
    RAISE EXCEPTION 'No active wallet matches this deposit.';
  END IF;

  SELECT * INTO existing
  FROM public.deposit_observations
  WHERE network = _network AND tx_hash = trim(_tx_hash) AND event_index = _event_index
  FOR UPDATE;
  has_existing := FOUND;

  IF NOT has_existing AND NOT EXISTS (
    SELECT 1 FROM public.platform_asset_networks
    WHERE asset = upper(trim(_asset))
      AND network = _network
      AND enabled
  ) THEN
    RAISE EXCEPTION 'Asset/network deposits are not enabled.';
  END IF;

  next_status := CASE
    WHEN coalesce(_is_failed, false) THEN 'failed'
    WHEN _confirmations >= _required_confirmations THEN 'confirmed'
    ELSE 'pending'
  END;

  IF has_existing THEN
    IF existing.user_id IS DISTINCT FROM matched_user_id
      OR existing.wallet_account_id IS DISTINCT FROM matched_wallet_id
      OR existing.asset IS DISTINCT FROM upper(trim(_asset))
      OR existing.deposit_address IS DISTINCT FROM trim(_deposit_address)
      OR existing.destination_tag IS DISTINCT FROM _destination_tag
      OR existing.crypto_amount IS DISTINCT FROM _crypto_amount THEN
      RAISE EXCEPTION 'A previously recorded chain event does not match.';
    END IF;

    UPDATE public.deposit_observations
    SET confirmations = _confirmations,
        required_confirmations = _required_confirmations,
        block_number = _block_number,
        block_hash = _block_hash,
        status = next_status,
        failure_reason = nullif(left(trim(_failure_reason), 500), ''),
        sender_address = nullif(trim(_sender_address), ''),
        observed_at = coalesce(_observed_at, now())
    WHERE id = existing.id
      AND coalesce(_observed_at, now()) >= existing.observed_at;
    RETURN existing.id;
  END IF;

  INSERT INTO public.deposit_observations (
    user_id, wallet_account_id, network, asset, tx_hash, event_index, deposit_address,
    destination_tag, crypto_amount, amount_usd, block_number, block_hash,
    confirmations, required_confirmations, status, failure_reason, sender_address, observed_at
  ) VALUES (
    matched_user_id, matched_wallet_id, _network, upper(trim(_asset)), trim(_tx_hash), _event_index,
    trim(_deposit_address), _destination_tag, _crypto_amount, _amount_usd, _block_number, _block_hash,
    _confirmations, _required_confirmations, next_status,
    nullif(left(trim(_failure_reason), 500), ''), nullif(trim(_sender_address), ''), coalesce(_observed_at, now())
  )
  RETURNING id INTO observation_id;

  RETURN observation_id;
END;
$$;

DROP FUNCTION IF EXISTS public.record_chain_deposit(TEXT, TEXT, TEXT, INTEGER, TEXT, BIGINT, NUMERIC, NUMERIC, BIGINT, TEXT, INTEGER, INTEGER, BOOLEAN, TEXT, TIMESTAMPTZ);
REVOKE ALL ON FUNCTION public.record_chain_deposit(TEXT, TEXT, TEXT, INTEGER, TEXT, BIGINT, NUMERIC, NUMERIC, BIGINT, TEXT, INTEGER, INTEGER, BOOLEAN, TEXT, TIMESTAMPTZ, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_chain_deposit(TEXT, TEXT, TEXT, INTEGER, TEXT, BIGINT, NUMERIC, NUMERIC, BIGINT, TEXT, INTEGER, INTEGER, BOOLEAN, TEXT, TIMESTAMPTZ, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.bump_deposit_accounting_revision() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status
    AND (OLD.status = 'confirmed' OR NEW.status = 'confirmed') THEN
    NEW.accounting_revision := OLD.accounting_revision + 1;
  ELSE
    NEW.accounting_revision := OLD.accounting_revision;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER zz_deposit_observations_accounting_revision
  BEFORE UPDATE ON public.deposit_observations
  FOR EACH ROW EXECUTE FUNCTION public.bump_deposit_accounting_revision();

CREATE OR REPLACE FUNCTION public.apply_crypto_deposit_ledger() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  previous_status TEXT := NULL;
  is_credit BOOLEAN;
  entry_amount NUMERIC(38,18);
  entry_type TEXT;
  balance NUMERIC(38,18);
  revision INTEGER;
BEGIN
  IF TG_OP = 'UPDATE' THEN previous_status := OLD.status; END IF;

  IF NEW.user_id IS NOT NULL THEN
    INSERT INTO public.crypto_transactions (
      user_id, wallet_id, asset, network, transaction_type, transaction_hash,
      event_index, amount, fee, status
    ) VALUES (
      NEW.user_id, NEW.wallet_account_id, NEW.asset, NEW.network, 'deposit',
      NEW.tx_hash, NEW.event_index, NEW.crypto_amount, 0,
      CASE WHEN NEW.status = 'confirmed' THEN 'confirmed' ELSE NEW.status END
    )
    ON CONFLICT (network, transaction_hash, event_index) DO UPDATE
      SET status = CASE
        WHEN EXCLUDED.status = 'failed' AND public.crypto_transactions.status = 'confirmed' THEN 'reversed'
        ELSE EXCLUDED.status
      END;
  END IF;

  IF NEW.status = 'confirmed' AND previous_status IS DISTINCT FROM 'confirmed' THEN
    is_credit := true;
    entry_type := 'deposit';
  ELSIF previous_status = 'confirmed' AND NEW.status IS DISTINCT FROM 'confirmed' THEN
    is_credit := false;
    entry_type := 'deposit_reversal';
  ELSE
    RETURN NEW;
  END IF;

  IF NEW.user_id IS NULL THEN RAISE EXCEPTION 'Confirmed deposit has no owner.'; END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.user_id::TEXT || ':' || NEW.asset, 0));
  SELECT coalesce(sum(credit - debit), 0) INTO balance
  FROM public.crypto_ledger
  WHERE user_id = NEW.user_id AND asset = NEW.asset;

  entry_amount := NEW.crypto_amount;
  revision := NEW.accounting_revision;
  INSERT INTO public.crypto_ledger (
    user_id, asset, transaction_type, reference_id, debit, credit,
    balance_after, idempotency_key
  ) VALUES (
    NEW.user_id, NEW.asset, entry_type, NEW.id,
    CASE WHEN is_credit THEN 0 ELSE entry_amount END,
    CASE WHEN is_credit THEN entry_amount ELSE 0 END,
    balance + CASE WHEN is_credit THEN entry_amount ELSE -entry_amount END,
    'deposit:' || NEW.id::TEXT || ':' || revision::TEXT || ':' || entry_type
  )
  ON CONFLICT (idempotency_key) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER deposit_observations_apply_crypto_ledger
  AFTER INSERT OR UPDATE OF status ON public.deposit_observations
  FOR EACH ROW EXECUTE FUNCTION public.apply_crypto_deposit_ledger();

REVOKE ALL ON FUNCTION public.bump_deposit_accounting_revision() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.apply_crypto_deposit_ledger() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  code TEXT := nullif(upper(trim(NEW.raw_user_meta_data->>'referral_code')), '');
  ref UUID;
  selected_network TEXT;
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, country, referral_code, my_referral_code)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'country',
    code,
    public.generate_referral_code()
  );

  IF code IS NOT NULL THEN
    SELECT id INTO ref
    FROM public.profiles
    WHERE my_referral_code = code AND id <> NEW.id;

    IF ref IS NOT NULL THEN
      INSERT INTO public.admin_referrals (referrer_id, referred_id, referral_code)
      VALUES (ref, NEW.id, code)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  FOREACH selected_network IN ARRAY ARRAY[
    'bitcoin-mainnet',
    'ethereum-mainnet',
    'solana-mainnet',
    'xrpl-mainnet'
  ] LOOP
    INSERT INTO public.wallet_accounts (user_id, network)
    VALUES (NEW.id, selected_network)
    ON CONFLICT (user_id, network) DO NOTHING;

    INSERT INTO public.custody_provisioning_jobs (user_id, network)
    VALUES (NEW.id, selected_network)
    ON CONFLICT (user_id, network, provisioning_version) DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
