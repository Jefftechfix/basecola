ALTER TABLE public.crypto_withdrawals
  ADD COLUMN usd_value NUMERIC(20,2) CHECK (usd_value IS NULL OR usd_value >= 0);

CREATE OR REPLACE FUNCTION public.request_crypto_withdrawal(
  _asset TEXT,
  _network TEXT,
  _wallet_id UUID,
  _destination_address TEXT,
  _destination_tag BIGINT,
  _amount NUMERIC,
  _idempotency_key TEXT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid UUID := auth.uid();
  wallet public.wallet_accounts;
  settings public.trade_asset_settings;
  asset_policy public.platform_asset_networks;
  existing public.crypto_withdrawals;
  balance NUMERIC(38,18);
  usd_value NUMERIC(38,18);
  daily_usd NUMERIC(38,18);
  withdrawal_id UUID;
  tx_id UUID;
  display_network TEXT;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Please log in to request a withdrawal.'; END IF;
  IF _asset NOT IN ('BTC', 'ETH', 'USDT', 'SOL', 'XRP')
    OR _network NOT IN ('bitcoin-mainnet', 'ethereum-mainnet', 'solana-mainnet', 'xrpl-mainnet')
    OR (_asset = 'BTC' AND _network <> 'bitcoin-mainnet')
    OR (_asset IN ('ETH', 'USDT') AND _network <> 'ethereum-mainnet')
    OR (_asset = 'SOL' AND _network <> 'solana-mainnet')
    OR (_asset = 'XRP' AND _network <> 'xrpl-mainnet')
    OR _wallet_id IS NULL
    OR nullif(trim(_destination_address), '') IS NULL
    OR length(trim(_destination_address)) > 128
    OR _amount IS NULL OR _amount <= 0
    OR _amount::TEXT !~ '^[0-9]{1,20}(\.[0-9]{1,18})?$'
    OR (_destination_tag IS NOT NULL AND (_destination_tag < 0 OR _destination_tag > 4294967295))
    OR (_network <> 'xrpl-mainnet' AND _destination_tag IS NOT NULL)
    OR _idempotency_key IS NULL
    OR _idempotency_key !~* '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN
    RAISE EXCEPTION 'Invalid crypto withdrawal request.';
  END IF;

  IF (_asset IN ('ETH', 'USDT') AND trim(_destination_address) !~ '^0x[0-9a-fA-F]{40}$')
    OR (_asset = 'BTC' AND trim(_destination_address) !~ '^(bc1[ac-hj-np-z02-9]{11,71}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$')
    OR (_asset = 'SOL' AND trim(_destination_address) !~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$')
    OR (_asset = 'XRP' AND trim(_destination_address) !~ '^r[1-9A-HJ-NP-Za-km-z]{24,34}$') THEN
    RAISE EXCEPTION 'Invalid destination address for the selected asset.';
  END IF;

  SELECT * INTO wallet
  FROM public.wallet_accounts
  WHERE id = _wallet_id AND user_id = uid
    AND network = _network AND status = 'active'
  FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Active wallet not found.'; END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(uid::TEXT || ':withdrawals', 0));
  PERFORM pg_advisory_xact_lock(hashtextextended(uid::TEXT || ':' || _asset, 0));

  SELECT * INTO existing
  FROM public.crypto_withdrawals
  WHERE user_id = uid AND idempotency_key = _idempotency_key;
  IF FOUND THEN
    IF existing.wallet_id <> _wallet_id
      OR existing.asset <> _asset
      OR existing.network <> _network
      OR existing.destination_address <> trim(_destination_address)
      OR existing.destination_tag IS DISTINCT FROM _destination_tag
      OR existing.amount <> _amount THEN
      RAISE EXCEPTION 'Idempotency key was already used for a different withdrawal.';
    END IF;
    RETURN jsonb_build_object(
      'withdrawal_id', existing.id,
      'status', existing.status,
      'approval_status', existing.approval_status,
      'replayed', true
    );
  END IF;

  display_network := CASE _network
    WHEN 'bitcoin-mainnet' THEN 'Bitcoin'
    WHEN 'ethereum-mainnet' THEN CASE WHEN _asset = 'USDT' THEN 'Ethereum (ERC-20)' ELSE 'Ethereum' END
    WHEN 'solana-mainnet' THEN 'Solana'
    WHEN 'xrpl-mainnet' THEN 'XRP Ledger'
  END;

  SELECT * INTO asset_policy
  FROM public.platform_asset_networks
  WHERE asset = _asset AND network = _network AND enabled
  FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Withdrawals for this asset are currently unavailable.'; END IF;

  SELECT * INTO settings
  FROM public.trade_asset_settings
  WHERE coin = _asset AND network = display_network
  FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Withdrawals for this asset are currently unavailable.'; END IF;

  IF _amount < settings.minimum_crypto_amount OR _amount > settings.maximum_crypto_amount THEN
    RAISE EXCEPTION 'Amount must be within the configured limits for this asset.';
  END IF;
  usd_value := round(_amount * settings.sell_price_usd, 2);
  IF usd_value <= 0 OR usd_value > 5000 THEN
    RAISE EXCEPTION 'Withdrawal exceeds the $5,000 per-request limit.';
  END IF;

  SELECT coalesce(sum(coalesce(
    withdrawal.usd_value,
    round(withdrawal.amount * asset_settings.sell_price_usd, 2)
  )), 0)
  INTO daily_usd
  FROM public.crypto_withdrawals AS withdrawal
  JOIN public.trade_asset_settings AS asset_settings
    ON asset_settings.coin = withdrawal.asset
   AND asset_settings.network = CASE withdrawal.network
     WHEN 'bitcoin-mainnet' THEN 'Bitcoin'
     WHEN 'ethereum-mainnet' THEN CASE WHEN withdrawal.asset = 'USDT' THEN 'Ethereum (ERC-20)' ELSE 'Ethereum' END
     WHEN 'solana-mainnet' THEN 'Solana'
     WHEN 'xrpl-mainnet' THEN 'XRP Ledger'
   END
  WHERE withdrawal.user_id = uid
    AND withdrawal.created_at >= now() - interval '24 hours'
    AND withdrawal.status NOT IN ('failed', 'cancelled');
  IF daily_usd + usd_value > 5000 THEN
    RAISE EXCEPTION 'Withdrawal exceeds the $5,000 rolling 24-hour limit.';
  END IF;

  SELECT coalesce(sum(credit - debit), 0)
  INTO balance
  FROM public.crypto_ledger
  WHERE user_id = uid AND asset = _asset;
  IF balance < _amount THEN
    RAISE EXCEPTION 'Insufficient confirmed crypto balance.';
  END IF;

  INSERT INTO public.crypto_withdrawals (
    user_id, wallet_id, asset, network, destination_address, destination_tag,
    amount, usd_value, network_fee, status, approval_status, approved_at, idempotency_key
  ) VALUES (
    uid, _wallet_id, _asset, _network, trim(_destination_address), _destination_tag,
    _amount, usd_value, 0, 'requested', 'approved', now(), _idempotency_key
  )
  RETURNING id INTO withdrawal_id;

  INSERT INTO public.crypto_ledger (
    user_id, asset, transaction_type, reference_id, debit, credit,
    balance_after, idempotency_key
  ) VALUES (
    uid, _asset, 'withdrawal_reserve', withdrawal_id, _amount, 0,
    balance - _amount, 'withdrawal-reserve:' || withdrawal_id::TEXT
  );

  INSERT INTO public.crypto_transactions (
    user_id, wallet_id, asset, network, transaction_type,
    amount, fee, status
  ) VALUES (
    uid, _wallet_id, _asset, _network, 'withdrawal',
    _amount, 0, 'requested'
  )
  RETURNING id INTO tx_id;

  RETURN jsonb_build_object(
    'withdrawal_id', withdrawal_id,
    'transaction_id', tx_id,
    'status', 'requested',
    'approval_status', 'approved',
    'amount_usd', usd_value,
    'replayed', false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.request_crypto_withdrawal(TEXT, TEXT, UUID, TEXT, BIGINT, NUMERIC, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_crypto_withdrawal(TEXT, TEXT, UUID, TEXT, BIGINT, NUMERIC, TEXT)
  TO authenticated;
