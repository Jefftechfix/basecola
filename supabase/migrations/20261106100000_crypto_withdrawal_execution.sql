ALTER TABLE public.crypto_withdrawals
  DROP CONSTRAINT crypto_withdrawals_status_check,
  ADD CONSTRAINT crypto_withdrawals_status_check CHECK (
    status IN (
      'requested', 'processing', 'approved', 'signed', 'broadcast',
      'broadcast_unknown', 'confirmed', 'failed', 'cancelled'
    )
  ),
  ADD COLUMN network_fee_usd NUMERIC(20, 2) NOT NULL DEFAULT 0
    CHECK (network_fee_usd >= 0),
  ADD COLUMN turnkey_status_id TEXT,
  ADD COLUMN confirmations INTEGER NOT NULL DEFAULT 0 CHECK (confirmations >= 0),
  ADD COLUMN required_confirmations INTEGER CHECK (
    required_confirmations IS NULL OR required_confirmations > 0
  ),
  ADD COLUMN execution_attempts INTEGER NOT NULL DEFAULT 0 CHECK (execution_attempts >= 0),
  ADD COLUMN execution_locked_until TIMESTAMPTZ,
  ADD COLUMN last_reconciled_at TIMESTAMPTZ,
  ADD COLUMN failure_code TEXT,
  ADD COLUMN confirmed_at TIMESTAMPTZ;

ALTER TABLE public.crypto_transactions
  ADD COLUMN withdrawal_id UUID REFERENCES public.crypto_withdrawals(id) ON DELETE RESTRICT;

CREATE UNIQUE INDEX crypto_transactions_withdrawal_id_idx
  ON public.crypto_transactions (withdrawal_id)
  WHERE withdrawal_id IS NOT NULL;

CREATE INDEX crypto_withdrawals_execution_queue_idx
  ON public.crypto_withdrawals (created_at)
  WHERE status = 'requested' AND approval_status = 'approved';

CREATE UNIQUE INDEX crypto_withdrawals_one_active_per_wallet_idx
  ON public.crypto_withdrawals (wallet_id)
  WHERE status IN ('processing', 'signed', 'broadcast', 'broadcast_unknown');

CREATE TABLE public.crypto_withdrawal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  withdrawal_id UUID NOT NULL REFERENCES public.crypto_withdrawals(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'requested', 'fee_reserved', 'processing', 'signed', 'broadcast',
    'broadcast_unknown', 'confirmed', 'failed', 'reorg_detected',
    'reconciliation_required', 'fee_released', 'funds_released'
  )),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX crypto_withdrawal_events_withdrawal_date_idx
  ON public.crypto_withdrawal_events (withdrawal_id, created_at);

ALTER TABLE public.crypto_withdrawal_events ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.crypto_withdrawal_events TO authenticated;
GRANT ALL ON public.crypto_withdrawal_events TO service_role;

CREATE POLICY "Users view own crypto withdrawal events"
  ON public.crypto_withdrawal_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

INSERT INTO public.platform_settings (id, policies)
VALUES (
  1,
  jsonb_build_object(
    'cryptoWithdrawalsEnabled', false,
    'cryptoWithdrawalDailyLimitUSD', '5000',
    'cryptoWithdrawalPerRequestLimitUSD', '5000',
    'cryptoWithdrawalRateLimitPerHour', '5',
    'cryptoWithdrawalFeeCapBitcoinUSD', '0',
    'cryptoWithdrawalFeeCapEthereumUSD', '0',
    'cryptoWithdrawalFeeCapSolanaUSD', '0',
    'cryptoWithdrawalFeeCapXrplUSD', '0'
  )
)
ON CONFLICT (id) DO UPDATE SET
  policies = public.platform_settings.policies || jsonb_build_object(
    'cryptoWithdrawalsEnabled',
      COALESCE(public.platform_settings.policies->'cryptoWithdrawalsEnabled', 'false'::jsonb),
    'cryptoWithdrawalDailyLimitUSD',
      COALESCE(public.platform_settings.policies->'cryptoWithdrawalDailyLimitUSD', '"5000"'::jsonb),
    'cryptoWithdrawalPerRequestLimitUSD',
      COALESCE(public.platform_settings.policies->'cryptoWithdrawalPerRequestLimitUSD', '"5000"'::jsonb),
    'cryptoWithdrawalRateLimitPerHour',
      COALESCE(public.platform_settings.policies->'cryptoWithdrawalRateLimitPerHour', '"5"'::jsonb),
    'cryptoWithdrawalFeeCapBitcoinUSD',
      COALESCE(public.platform_settings.policies->'cryptoWithdrawalFeeCapBitcoinUSD', '"0"'::jsonb),
    'cryptoWithdrawalFeeCapEthereumUSD',
      COALESCE(public.platform_settings.policies->'cryptoWithdrawalFeeCapEthereumUSD', '"0"'::jsonb),
    'cryptoWithdrawalFeeCapSolanaUSD',
      COALESCE(public.platform_settings.policies->'cryptoWithdrawalFeeCapSolanaUSD', '"0"'::jsonb),
    'cryptoWithdrawalFeeCapXrplUSD',
      COALESCE(public.platform_settings.policies->'cryptoWithdrawalFeeCapXrplUSD', '"0"'::jsonb)
  );

CREATE OR REPLACE FUNCTION public.guard_crypto_withdrawal_request()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  policies JSONB;
  limit_per_hour INTEGER;
  recent_requests INTEGER;
BEGIN
  SELECT settings.policies INTO policies
  FROM public.platform_settings AS settings
  WHERE settings.id = 1;

  IF COALESCE((policies->>'cryptoWithdrawalsEnabled')::BOOLEAN, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'Crypto withdrawals are currently suspended.';
  END IF;

  limit_per_hour := COALESCE(
    NULLIF(policies->>'cryptoWithdrawalRateLimitPerHour', '')::INTEGER,
    5
  );
  IF limit_per_hour NOT BETWEEN 1 AND 20 THEN
    RAISE EXCEPTION 'Crypto withdrawal rate limit is not configured safely.';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.user_id::TEXT || ':withdrawals', 0));
  SELECT COUNT(*) INTO recent_requests
  FROM public.crypto_withdrawals AS withdrawal
  WHERE withdrawal.user_id = NEW.user_id
    AND withdrawal.created_at >= now() - interval '1 hour';

  IF recent_requests >= limit_per_hour THEN
    RAISE EXCEPTION 'Too many withdrawal requests. Try again later.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER crypto_withdrawal_request_guard
  BEFORE INSERT ON public.crypto_withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.guard_crypto_withdrawal_request();

CREATE OR REPLACE FUNCTION public.link_crypto_withdrawal_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.transaction_type = 'withdrawal' AND NEW.withdrawal_id IS NULL THEN
    SELECT withdrawal.id INTO NEW.withdrawal_id
    FROM public.crypto_withdrawals AS withdrawal
    WHERE withdrawal.user_id = NEW.user_id
      AND withdrawal.wallet_id = NEW.wallet_id
      AND withdrawal.asset = NEW.asset
      AND withdrawal.network = NEW.network
      AND withdrawal.amount = NEW.amount
      AND withdrawal.status = 'requested'
      AND withdrawal.created_at BETWEEN NEW.created_at - interval '1 second'
                                    AND NEW.created_at + interval '1 second'
      AND NOT EXISTS (
        SELECT 1 FROM public.crypto_transactions AS linked
        WHERE linked.withdrawal_id = withdrawal.id
      )
    ORDER BY withdrawal.created_at DESC
    LIMIT 1
    FOR UPDATE;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER crypto_transaction_link_withdrawal
  BEFORE INSERT ON public.crypto_transactions
  FOR EACH ROW EXECUTE FUNCTION public.link_crypto_withdrawal_transaction();

CREATE OR REPLACE FUNCTION public.audit_crypto_withdrawal_request()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.crypto_withdrawal_events (
    withdrawal_id, user_id, event_type, details
  ) VALUES (
    NEW.id, NEW.user_id, 'requested',
    jsonb_build_object(
      'asset', NEW.asset,
      'network', NEW.network,
      'amount', NEW.amount::TEXT,
      'destination', NEW.destination_address,
      'destination_tag', NEW.destination_tag
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER crypto_withdrawal_request_audit
  AFTER INSERT ON public.crypto_withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.audit_crypto_withdrawal_request();

CREATE OR REPLACE FUNCTION public.reserve_crypto_withdrawal_fee(
  _withdrawal_id UUID,
  _fee NUMERIC,
  _fee_usd NUMERIC
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  withdrawal public.crypto_withdrawals;
  policies JSONB;
  balance NUMERIC(38,18);
  daily_usd NUMERIC(38,18);
  per_request_limit NUMERIC(20,2);
  daily_limit NUMERIC(20,2);
  fee_cap NUMERIC(20,2);
  fee_cap_key TEXT;
  ledger_key TEXT;
BEGIN
  IF _withdrawal_id IS NULL OR _fee IS NULL OR _fee <= 0
    OR _fee_usd IS NULL OR _fee_usd <= 0 THEN
    RAISE EXCEPTION 'Invalid withdrawal fee quote.';
  END IF;

  SELECT * INTO withdrawal
  FROM public.crypto_withdrawals
  WHERE id = _withdrawal_id
  FOR UPDATE;
  IF NOT FOUND OR withdrawal.status <> 'requested'
    OR withdrawal.approval_status <> 'approved' THEN
    RAISE EXCEPTION 'Withdrawal is not eligible for execution.';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended(withdrawal.user_id::TEXT || ':' || withdrawal.asset, 0)
  );

  SELECT settings.policies INTO policies
  FROM public.platform_settings AS settings
  WHERE settings.id = 1;
  IF COALESCE((policies->>'cryptoWithdrawalsEnabled')::BOOLEAN, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'Crypto withdrawals are currently suspended.';
  END IF;

  fee_cap_key := CASE withdrawal.network
    WHEN 'bitcoin-mainnet' THEN 'cryptoWithdrawalFeeCapBitcoinUSD'
    WHEN 'ethereum-mainnet' THEN 'cryptoWithdrawalFeeCapEthereumUSD'
    WHEN 'solana-mainnet' THEN 'cryptoWithdrawalFeeCapSolanaUSD'
    WHEN 'xrpl-mainnet' THEN 'cryptoWithdrawalFeeCapXrplUSD'
    ELSE NULL
  END;
  IF fee_cap_key IS NULL THEN
    RAISE EXCEPTION 'Unsupported withdrawal network.';
  END IF;

  fee_cap := NULLIF(policies->>fee_cap_key, '')::NUMERIC;
  per_request_limit := COALESCE(
    NULLIF(policies->>'cryptoWithdrawalPerRequestLimitUSD', '')::NUMERIC,
    5000
  );
  daily_limit := COALESCE(
    NULLIF(policies->>'cryptoWithdrawalDailyLimitUSD', '')::NUMERIC,
    5000
  );
  IF fee_cap IS NULL OR fee_cap <= 0 OR _fee_usd > fee_cap THEN
    RAISE EXCEPTION 'The network fee exceeds the configured fee cap.';
  END IF;
  IF _fee_usd + withdrawal.usd_value > per_request_limit THEN
    RAISE EXCEPTION 'Withdrawal amount and fee exceed the per-request limit.';
  END IF;

  SELECT COALESCE(SUM(
    COALESCE(withdrawal_row.usd_value, 0) + COALESCE(withdrawal_row.network_fee_usd, 0)
  ), 0)
  INTO daily_usd
  FROM public.crypto_withdrawals AS withdrawal_row
  WHERE withdrawal_row.user_id = withdrawal.user_id
    AND withdrawal_row.created_at >= now() - interval '24 hours'
    AND withdrawal_row.status NOT IN ('failed', 'cancelled');
  IF daily_usd + _fee_usd > daily_limit THEN
    RAISE EXCEPTION 'Withdrawal amount and fee exceed the rolling 24-hour limit.';
  END IF;

  SELECT COALESCE(SUM(credit - debit), 0)
  INTO balance
  FROM public.crypto_ledger
  WHERE user_id = withdrawal.user_id AND asset = withdrawal.asset;
  IF balance < _fee THEN
    RAISE EXCEPTION 'Insufficient confirmed balance to cover the network fee.';
  END IF;

  ledger_key := 'withdrawal-fee-reserve:' || withdrawal.id::TEXT;
  INSERT INTO public.crypto_ledger (
    user_id, asset, transaction_type, reference_id, debit, credit,
    balance_after, idempotency_key
  ) VALUES (
    withdrawal.user_id, withdrawal.asset, 'withdrawal_reserve', withdrawal.id,
    _fee, 0, balance - _fee, ledger_key
  );

  UPDATE public.crypto_withdrawals
  SET network_fee = _fee,
      network_fee_usd = round(_fee_usd, 2),
      execution_locked_until = now() + interval '2 minutes'
  WHERE id = withdrawal.id;

  INSERT INTO public.crypto_withdrawal_events (
    withdrawal_id, user_id, event_type, details
  ) VALUES (
    withdrawal.id, withdrawal.user_id, 'fee_reserved',
    jsonb_build_object('fee', _fee::TEXT, 'fee_usd', round(_fee_usd, 2)::TEXT)
  );

  RETURN jsonb_build_object('reserved', true, 'fee', _fee::TEXT);
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_crypto_withdrawal_fee(UUID, NUMERIC, NUMERIC)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_crypto_withdrawal_fee(UUID, NUMERIC, NUMERIC)
  TO service_role;

CREATE OR REPLACE FUNCTION public.claim_crypto_withdrawal(
  _withdrawal_id UUID,
  _lease_seconds INTEGER DEFAULT 120
) RETURNS SETOF public.crypto_withdrawals
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE claimed public.crypto_withdrawals;
BEGIN
  IF _withdrawal_id IS NULL OR _lease_seconds NOT BETWEEN 30 AND 600 THEN
    RAISE EXCEPTION 'Invalid withdrawal execution claim.';
  END IF;

  UPDATE public.crypto_withdrawals AS withdrawal
  SET status = 'processing',
      execution_attempts = withdrawal.execution_attempts + 1,
      execution_locked_until = now() + make_interval(secs => _lease_seconds),
      failure_code = NULL
  WHERE withdrawal.id = _withdrawal_id
    AND withdrawal.status = 'requested'
    AND withdrawal.approval_status = 'approved'
    AND withdrawal.network_fee > 0
    AND COALESCE((
      SELECT (settings.policies->>'cryptoWithdrawalsEnabled')::BOOLEAN
      FROM public.platform_settings AS settings WHERE settings.id = 1
    ), false) IS TRUE
  RETURNING withdrawal.* INTO claimed;

  IF FOUND THEN
    INSERT INTO public.crypto_withdrawal_events (
      withdrawal_id, user_id, event_type
    ) VALUES (claimed.id, claimed.user_id, 'processing');
    RETURN NEXT claimed;
  END IF;
  RETURN;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_crypto_withdrawal(UUID, INTEGER)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_crypto_withdrawal(UUID, INTEGER)
  TO service_role;

CREATE OR REPLACE FUNCTION public.mark_crypto_withdrawal_signed(
  _withdrawal_id UUID,
  _required_confirmations INTEGER
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE withdrawal public.crypto_withdrawals;
BEGIN
  IF _withdrawal_id IS NULL OR _required_confirmations NOT BETWEEN 1 AND 1000 THEN
    RAISE EXCEPTION 'Invalid withdrawal signing state.';
  END IF;

  UPDATE public.crypto_withdrawals
  SET status = 'signed',
      required_confirmations = _required_confirmations,
      execution_locked_until = now() + interval '2 minutes'
  WHERE id = _withdrawal_id AND status = 'processing'
  RETURNING * INTO withdrawal;
  IF NOT FOUND THEN RAISE EXCEPTION 'Withdrawal is not in the processing state.'; END IF;

  INSERT INTO public.crypto_withdrawal_events (
    withdrawal_id, user_id, event_type
  ) VALUES (withdrawal.id, withdrawal.user_id, 'signed');
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_crypto_withdrawal_broadcast(
  _withdrawal_id UUID,
  _transaction_hash TEXT,
  _turnkey_status_id TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE withdrawal public.crypto_withdrawals;
BEGIN
  IF _withdrawal_id IS NULL OR NULLIF(TRIM(_transaction_hash), '') IS NULL
    OR length(_transaction_hash) > 160 THEN
    RAISE EXCEPTION 'Invalid withdrawal broadcast result.';
  END IF;

  UPDATE public.crypto_withdrawals
  SET status = 'broadcast',
      transaction_hash = trim(_transaction_hash),
      turnkey_status_id = NULLIF(trim(_turnkey_status_id), ''),
      execution_locked_until = NULL,
      failure_code = NULL
  WHERE id = _withdrawal_id AND status IN ('processing', 'signed', 'broadcast_unknown')
  RETURNING * INTO withdrawal;
  IF NOT FOUND THEN
    SELECT * INTO withdrawal FROM public.crypto_withdrawals WHERE id = _withdrawal_id;
    IF withdrawal.status = 'broadcast' AND withdrawal.transaction_hash = trim(_transaction_hash) THEN
      RETURN;
    END IF;
    RAISE EXCEPTION 'Withdrawal is not eligible for broadcast recording.';
  END IF;

  UPDATE public.crypto_transactions
  SET transaction_hash = trim(_transaction_hash), status = 'broadcast'
  WHERE withdrawal_id = withdrawal.id;

  INSERT INTO public.crypto_withdrawal_events (
    withdrawal_id, user_id, event_type, details
  ) VALUES (
    withdrawal.id, withdrawal.user_id, 'broadcast',
    jsonb_build_object('transaction_hash', trim(_transaction_hash))
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.record_crypto_withdrawal_turnkey_submission(
  _withdrawal_id UUID,
  _turnkey_status_id TEXT
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE withdrawal public.crypto_withdrawals;
BEGIN
  IF _withdrawal_id IS NULL OR NULLIF(TRIM(_turnkey_status_id), '') IS NULL
    OR length(_turnkey_status_id) > 160 THEN
    RAISE EXCEPTION 'Invalid Turnkey submission reference.';
  END IF;

  UPDATE public.crypto_withdrawals
  SET status = 'broadcast_unknown',
      turnkey_status_id = trim(_turnkey_status_id),
      execution_locked_until = NULL
  WHERE id = _withdrawal_id AND status IN ('processing', 'signed')
  RETURNING * INTO withdrawal;
  IF NOT FOUND THEN
    SELECT * INTO withdrawal FROM public.crypto_withdrawals WHERE id = _withdrawal_id;
    IF withdrawal.status = 'broadcast_unknown'
      AND withdrawal.turnkey_status_id = trim(_turnkey_status_id) THEN
      RETURN;
    END IF;
    RAISE EXCEPTION 'Withdrawal cannot accept a Turnkey submission reference.';
  END IF;

  INSERT INTO public.crypto_withdrawal_events (
    withdrawal_id, user_id, event_type, details
  ) VALUES (
    withdrawal.id, withdrawal.user_id, 'broadcast_unknown',
    jsonb_build_object('turnkey_status_id', withdrawal.turnkey_status_id)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_crypto_withdrawal_confirmations(
  _withdrawal_id UUID,
  _confirmations INTEGER
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _withdrawal_id IS NULL OR _confirmations < 0 THEN
    RAISE EXCEPTION 'Invalid confirmation update.';
  END IF;

  UPDATE public.crypto_withdrawals
  SET confirmations = _confirmations,
      last_reconciled_at = now()
  WHERE id = _withdrawal_id
    AND status IN ('broadcast', 'broadcast_unknown')
    AND _confirmations >= confirmations;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal confirmation count cannot be updated.';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_crypto_withdrawal_broadcast_unknown(
  _withdrawal_id UUID,
  _failure_code TEXT
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE withdrawal public.crypto_withdrawals;
BEGIN
  UPDATE public.crypto_withdrawals
  SET status = 'broadcast_unknown',
      failure_code = left(COALESCE(NULLIF(trim(_failure_code), ''), 'broadcast_outcome_unknown'), 80),
      execution_locked_until = NULL
  WHERE id = _withdrawal_id AND status IN ('processing', 'signed')
  RETURNING * INTO withdrawal;
  IF NOT FOUND THEN
    SELECT * INTO withdrawal FROM public.crypto_withdrawals WHERE id = _withdrawal_id;
    IF withdrawal.status = 'broadcast_unknown' THEN RETURN; END IF;
    RAISE EXCEPTION 'Withdrawal is not awaiting broadcast reconciliation.';
  END IF;

  INSERT INTO public.crypto_withdrawal_events (
    withdrawal_id, user_id, event_type, details
  ) VALUES (
    withdrawal.id, withdrawal.user_id, 'broadcast_unknown',
    jsonb_build_object('failure_code', withdrawal.failure_code)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.finish_crypto_withdrawal(
  _withdrawal_id UUID,
  _transaction_hash TEXT,
  _confirmations INTEGER,
  _actual_fee NUMERIC,
  _actual_fee_usd NUMERIC,
  _failed BOOLEAN DEFAULT FALSE
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  withdrawal public.crypto_withdrawals;
  balance NUMERIC(38,18);
  release_amount NUMERIC(38,18);
  fee_release NUMERIC(38,18);
  ledger_key TEXT;
BEGIN
  IF _withdrawal_id IS NULL OR _confirmations < 0 OR _actual_fee IS NULL
    OR _actual_fee < 0 OR _actual_fee_usd IS NULL OR _actual_fee_usd < 0 THEN
    RAISE EXCEPTION 'Invalid withdrawal reconciliation result.';
  END IF;

  SELECT * INTO withdrawal
  FROM public.crypto_withdrawals
  WHERE id = _withdrawal_id
  FOR UPDATE;
  IF NOT FOUND OR withdrawal.status NOT IN ('broadcast', 'broadcast_unknown') THEN
    RAISE EXCEPTION 'Withdrawal is not awaiting chain reconciliation.';
  END IF;

  IF _transaction_hash IS NOT NULL AND withdrawal.transaction_hash IS NOT NULL
    AND withdrawal.transaction_hash <> trim(_transaction_hash) THEN
    RAISE EXCEPTION 'Reconciliation transaction hash does not match the recorded broadcast.';
  END IF;
  IF NOT _failed AND (
    withdrawal.required_confirmations IS NULL
    OR _confirmations < withdrawal.required_confirmations
  ) THEN
    RAISE EXCEPTION 'Withdrawal has not reached the required confirmation threshold.';
  END IF;
  IF _actual_fee > withdrawal.network_fee OR _actual_fee_usd > withdrawal.network_fee_usd THEN
    UPDATE public.crypto_withdrawals
    SET failure_code = 'actual_fee_exceeded_reservation',
        last_reconciled_at = now()
    WHERE id = withdrawal.id;
    INSERT INTO public.crypto_withdrawal_events (
      withdrawal_id, user_id, event_type, details
    ) VALUES (
      withdrawal.id, withdrawal.user_id, 'reconciliation_required',
      jsonb_build_object(
        'reserved_fee', withdrawal.network_fee::TEXT,
        'actual_fee', _actual_fee::TEXT,
        'reserved_fee_usd', withdrawal.network_fee_usd::TEXT,
        'actual_fee_usd', _actual_fee_usd::TEXT
      )
    );
    RETURN jsonb_build_object('reconciliation_required', true);
  END IF;

  SELECT COALESCE(SUM(credit - debit), 0)
  INTO balance
  FROM public.crypto_ledger
  WHERE user_id = withdrawal.user_id AND asset = withdrawal.asset;

  fee_release := withdrawal.network_fee - _actual_fee;
  release_amount := CASE WHEN _failed THEN withdrawal.amount ELSE 0 END;
  IF release_amount > 0 OR fee_release > 0 THEN
    ledger_key := 'withdrawal-finish-release:' || withdrawal.id::TEXT;
    INSERT INTO public.crypto_ledger (
      user_id, asset, transaction_type, reference_id, debit, credit,
      balance_after, idempotency_key
    ) VALUES (
      withdrawal.user_id, withdrawal.asset, 'withdrawal_release', withdrawal.id,
      0, release_amount + fee_release, balance + release_amount + fee_release, ledger_key
    );
  END IF;

  UPDATE public.crypto_withdrawals
  SET status = CASE WHEN _failed THEN 'failed' ELSE 'confirmed' END,
      transaction_hash = COALESCE(transaction_hash, NULLIF(trim(_transaction_hash), '')),
      network_fee = _actual_fee,
      network_fee_usd = round(_actual_fee_usd, 2),
      confirmations = _confirmations,
      last_reconciled_at = now(),
      confirmed_at = CASE WHEN _failed THEN NULL ELSE now() END,
      execution_locked_until = NULL,
      failure_code = CASE WHEN _failed THEN 'on_chain_execution_failed' ELSE NULL END
  WHERE id = withdrawal.id;

  UPDATE public.crypto_transactions
  SET transaction_hash = COALESCE(transaction_hash, NULLIF(trim(_transaction_hash), '')),
      fee = _actual_fee,
      status = CASE WHEN _failed THEN 'failed' ELSE 'confirmed' END
  WHERE withdrawal_id = withdrawal.id;

  INSERT INTO public.crypto_withdrawal_events (
    withdrawal_id, user_id, event_type, details
  ) VALUES (
    withdrawal.id, withdrawal.user_id,
    CASE WHEN _failed THEN 'failed' ELSE 'confirmed' END,
    jsonb_build_object(
      'transaction_hash', COALESCE(withdrawal.transaction_hash, _transaction_hash),
      'confirmations', _confirmations,
      'actual_fee', _actual_fee::TEXT,
      'actual_fee_usd', round(_actual_fee_usd, 2)::TEXT,
      'released_amount', release_amount::TEXT,
      'released_fee', fee_release::TEXT
    )
  );

  RETURN jsonb_build_object('status', CASE WHEN _failed THEN 'failed' ELSE 'confirmed' END);
END;
$$;

CREATE OR REPLACE FUNCTION public.fail_unbroadcast_crypto_withdrawal(
  _withdrawal_id UUID,
  _failure_code TEXT
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  withdrawal public.crypto_withdrawals;
  balance NUMERIC(38,18);
  reserved_fee NUMERIC(38,18);
BEGIN
  SELECT * INTO withdrawal
  FROM public.crypto_withdrawals
  WHERE id = _withdrawal_id
  FOR UPDATE;
  IF NOT FOUND OR withdrawal.status NOT IN ('requested', 'processing', 'signed') THEN
    RAISE EXCEPTION 'Withdrawal cannot be safely released.';
  END IF;
  IF withdrawal.status IN ('signed') THEN
    RAISE EXCEPTION 'Signed withdrawal requires broadcast reconciliation.';
  END IF;

  SELECT COALESCE(SUM(credit - debit), 0)
  INTO balance
  FROM public.crypto_ledger
  WHERE user_id = withdrawal.user_id AND asset = withdrawal.asset;
  reserved_fee := CASE
    WHEN EXISTS (
      SELECT 1 FROM public.crypto_ledger
      WHERE idempotency_key = 'withdrawal-fee-reserve:' || withdrawal.id::TEXT
    ) THEN withdrawal.network_fee
    ELSE 0
  END;

  INSERT INTO public.crypto_ledger (
    user_id, asset, transaction_type, reference_id, debit, credit,
    balance_after, idempotency_key
  ) VALUES (
    withdrawal.user_id, withdrawal.asset, 'withdrawal_release', withdrawal.id,
    0, withdrawal.amount + reserved_fee, balance + withdrawal.amount + reserved_fee,
    'withdrawal-failed-release:' || withdrawal.id::TEXT
  );

  UPDATE public.crypto_withdrawals
  SET status = 'failed',
      failure_code = left(COALESCE(NULLIF(trim(_failure_code), ''), 'execution_failed'), 80),
      execution_locked_until = NULL,
      last_reconciled_at = now()
  WHERE id = withdrawal.id;

  UPDATE public.crypto_transactions
  SET status = 'failed'
  WHERE withdrawal_id = withdrawal.id;

  INSERT INTO public.crypto_withdrawal_events (
    withdrawal_id, user_id, event_type, details
  ) VALUES (
    withdrawal.id, withdrawal.user_id, 'funds_released',
    jsonb_build_object('failure_code', left(COALESCE(_failure_code, 'execution_failed'), 80))
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_crypto_withdrawal_reorg(
  _withdrawal_id UUID,
  _observed_block_hash TEXT
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE withdrawal public.crypto_withdrawals;
BEGIN
  SELECT * INTO withdrawal
  FROM public.crypto_withdrawals
  WHERE id = _withdrawal_id
  FOR UPDATE;
  IF NOT FOUND OR withdrawal.status <> 'confirmed' THEN
    RAISE EXCEPTION 'Only confirmed withdrawals can be marked for reorg review.';
  END IF;

  UPDATE public.crypto_withdrawals
  SET failure_code = 'confirmed_withdrawal_reorg_detected',
      last_reconciled_at = now()
  WHERE id = withdrawal.id;

  INSERT INTO public.crypto_withdrawal_events (
    withdrawal_id, user_id, event_type, details
  ) VALUES (
    withdrawal.id, withdrawal.user_id, 'reorg_detected',
    jsonb_build_object(
      'recorded_transaction_hash', withdrawal.transaction_hash,
      'observed_block_hash', left(COALESCE(_observed_block_hash, ''), 128)
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.mark_crypto_withdrawal_signed(UUID, INTEGER)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mark_crypto_withdrawal_broadcast(UUID, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mark_crypto_withdrawal_broadcast_unknown(UUID, TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_crypto_withdrawal_turnkey_submission(UUID, TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_crypto_withdrawal_confirmations(UUID, INTEGER)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.finish_crypto_withdrawal(UUID, TEXT, INTEGER, NUMERIC, NUMERIC, BOOLEAN)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fail_unbroadcast_crypto_withdrawal(UUID, TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mark_crypto_withdrawal_reorg(UUID, TEXT)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.mark_crypto_withdrawal_signed(UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_crypto_withdrawal_broadcast(UUID, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_crypto_withdrawal_broadcast_unknown(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_crypto_withdrawal_turnkey_submission(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_crypto_withdrawal_confirmations(UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.finish_crypto_withdrawal(UUID, TEXT, INTEGER, NUMERIC, NUMERIC, BOOLEAN)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.fail_unbroadcast_crypto_withdrawal(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_crypto_withdrawal_reorg(UUID, TEXT) TO service_role;
