CREATE TABLE public.trade_asset_settings (
  coin TEXT NOT NULL,
  network TEXT NOT NULL,
  buy_price_usd NUMERIC(20,10) NOT NULL CHECK (buy_price_usd > 0),
  sell_price_usd NUMERIC(20,10) NOT NULL CHECK (sell_price_usd > 0),
  minimum_crypto_amount NUMERIC(30,10) NOT NULL CHECK (minimum_crypto_amount > 0),
  maximum_crypto_amount NUMERIC(30,10) NOT NULL CHECK (maximum_crypto_amount >= minimum_crypto_amount),
  buy_enabled BOOLEAN NOT NULL DEFAULT true,
  sell_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (coin, network)
);

CREATE TABLE public.admin_trade_settings_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coin TEXT NOT NULL,
  network TEXT NOT NULL,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  previous_buy_price_usd NUMERIC(20,10) NOT NULL,
  next_buy_price_usd NUMERIC(20,10) NOT NULL,
  previous_sell_price_usd NUMERIC(20,10) NOT NULL,
  next_sell_price_usd NUMERIC(20,10) NOT NULL,
  previous_minimum_crypto_amount NUMERIC(30,10) NOT NULL,
  next_minimum_crypto_amount NUMERIC(30,10) NOT NULL,
  previous_maximum_crypto_amount NUMERIC(30,10) NOT NULL,
  next_maximum_crypto_amount NUMERIC(30,10) NOT NULL,
  previous_buy_enabled BOOLEAN NOT NULL,
  next_buy_enabled BOOLEAN NOT NULL,
  previous_sell_enabled BOOLEAN NOT NULL,
  next_sell_enabled BOOLEAN NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trade_asset_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_trade_settings_audit ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.trade_asset_settings TO authenticated;
GRANT ALL ON public.trade_asset_settings, public.admin_trade_settings_audit TO service_role;
CREATE POLICY "Authenticated users view trade settings" ON public.trade_asset_settings
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE TRIGGER trade_asset_settings_updated_at
  BEFORE UPDATE ON public.trade_asset_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.trade_asset_settings (
  coin, network, buy_price_usd, sell_price_usd, minimum_crypto_amount, maximum_crypto_amount
) VALUES
  ('BTC', 'Bitcoin', 43200, 42800, 0.0001, 2),
  ('ETH', 'Ethereum', 2715, 2685, 0.01, 50),
  ('USDT', 'Ethereum (ERC-20)', 1.001, 0.999, 10, 100000),
  ('XRP', 'XRP Ledger', 0.659, 0.648, 1, 500000),
  ('SOL', 'Solana', 151, 149, 0.1, 1000)
ON CONFLICT (coin, network) DO NOTHING;

CREATE OR REPLACE FUNCTION public.admin_update_trade_asset_settings(
  _coin TEXT,
  _network TEXT,
  _admin_id UUID,
  _buy_price_usd NUMERIC,
  _sell_price_usd NUMERIC,
  _minimum_crypto_amount NUMERIC,
  _maximum_crypto_amount NUMERIC,
  _buy_enabled BOOLEAN,
  _sell_enabled BOOLEAN,
  _note TEXT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE current_row public.trade_asset_settings;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _admin_id AND role = 'admin') THEN
    RAISE EXCEPTION 'Admin access required.';
  END IF;
  IF _buy_price_usd IS NULL OR _buy_price_usd <= 0 OR _sell_price_usd IS NULL OR _sell_price_usd <= 0
    OR _minimum_crypto_amount IS NULL OR _minimum_crypto_amount <= 0
    OR _maximum_crypto_amount IS NULL OR _maximum_crypto_amount < _minimum_crypto_amount
    OR _buy_enabled IS NULL OR _sell_enabled IS NULL OR nullif(trim(_note), '') IS NULL THEN
    RAISE EXCEPTION 'Invalid trade settings.';
  END IF;
  SELECT * INTO current_row FROM public.trade_asset_settings
  WHERE coin = _coin AND network = _network FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Asset/network settings not found.'; END IF;

  UPDATE public.trade_asset_settings SET
    buy_price_usd = _buy_price_usd,
    sell_price_usd = _sell_price_usd,
    minimum_crypto_amount = _minimum_crypto_amount,
    maximum_crypto_amount = _maximum_crypto_amount,
    buy_enabled = _buy_enabled,
    sell_enabled = _sell_enabled,
    updated_by = _admin_id
  WHERE coin = _coin AND network = _network;

  INSERT INTO public.admin_trade_settings_audit (
    coin, network, admin_id,
    previous_buy_price_usd, next_buy_price_usd,
    previous_sell_price_usd, next_sell_price_usd,
    previous_minimum_crypto_amount, next_minimum_crypto_amount,
    previous_maximum_crypto_amount, next_maximum_crypto_amount,
    previous_buy_enabled, next_buy_enabled,
    previous_sell_enabled, next_sell_enabled, note
  ) VALUES (
    _coin, _network, _admin_id,
    current_row.buy_price_usd, _buy_price_usd,
    current_row.sell_price_usd, _sell_price_usd,
    current_row.minimum_crypto_amount, _minimum_crypto_amount,
    current_row.maximum_crypto_amount, _maximum_crypto_amount,
    current_row.buy_enabled, _buy_enabled,
    current_row.sell_enabled, _sell_enabled, left(trim(_note), 500)
  );
  RETURN jsonb_build_object('coin', _coin, 'network', _network, 'updated', true);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_trade_asset_settings(TEXT, TEXT, UUID, NUMERIC, NUMERIC, NUMERIC, NUMERIC, BOOLEAN, BOOLEAN, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_trade_asset_settings(TEXT, TEXT, UUID, NUMERIC, NUMERIC, NUMERIC, NUMERIC, BOOLEAN, BOOLEAN, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.buy_crypto_with_balance(_coin text, _network text, _usd_amount numeric, _price_usd numeric)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  settings public.trade_asset_settings;
  fee numeric; total numeric; bal numeric; qty numeric; ref text; tx_id uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Please log in to buy crypto.'; END IF;
  IF _usd_amount IS NULL OR _usd_amount < 1 OR _usd_amount > 1000000 THEN RAISE EXCEPTION 'Enter an amount between $1 and $1,000,000.'; END IF;
  IF _coin NOT IN ('BTC','ETH','USDT','SOL','XRP') THEN RAISE EXCEPTION 'Unsupported coin.'; END IF;
  SELECT * INTO settings FROM public.trade_asset_settings WHERE coin = _coin AND network = _network FOR SHARE;
  IF NOT FOUND OR NOT settings.buy_enabled THEN RAISE EXCEPTION 'Buying this asset is currently unavailable.'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(uid::text));
  fee := round(_usd_amount * 0.015, 2);
  total := round(_usd_amount, 2) + fee;
  SELECT COALESCE((SELECT sum(amount) FROM wallet_fundings WHERE user_id = uid AND (
      lower(status) IN ('completed','paid','succeeded','success')
      OR (lower(status) = 'pending' AND (coalesce(reference,'') LIKE 'cs_live_%' OR coalesce(reference,'') LIKE 'cs_test_%' OR payment_method LIKE 'Stripe%') AND payment_method NOT LIKE '%awaiting bank verification%'))),0)
   + COALESCE((SELECT sum(CASE WHEN direction='debit' THEN -(usd_amount+fee_usd) ELSE usd_amount-fee_usd END) FROM transactions
      WHERE user_id = uid AND lower(kind) <> 'funding' AND lower(status) IN ('completed','paid','succeeded','success')),0)
  INTO bal;
  IF total > bal THEN RAISE EXCEPTION 'Insufficient wallet balance. Available: $%', round(bal,2); END IF;
  qty := round(_usd_amount / settings.buy_price_usd, 10);
  IF qty < settings.minimum_crypto_amount OR qty > settings.maximum_crypto_amount THEN
    RAISE EXCEPTION 'Buy amount must be between % and % %.', settings.minimum_crypto_amount, settings.maximum_crypto_amount, _coin;
  END IF;
  ref := 'BUY-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10));
  INSERT INTO public.crypto_buys (user_id, coin, network, crypto_amount, usd_amount, fee_usd, total_usd, price_usd, status)
    VALUES (uid, _coin, _network, qty, _usd_amount, fee, total, settings.buy_price_usd, 'completed');
  INSERT INTO public.transactions (user_id, kind, direction, coin, network, crypto_amount, usd_amount, fee_usd, price_usd, reference, counterparty, status, note)
    VALUES (uid, 'buy', 'debit', _coin, _network, qty, _usd_amount, fee, settings.buy_price_usd, ref, 'Wallet balance', 'completed', 'Paid with wallet balance')
    RETURNING id INTO tx_id;
  RETURN jsonb_build_object('reference', ref, 'transaction_id', tx_id, 'crypto_amount', qty, 'fee', fee, 'total', total, 'balance', round(bal - total, 2), 'price_usd', settings.buy_price_usd);
END $$;

CREATE OR REPLACE FUNCTION public.sell_crypto_to_balance(_coin text, _network text, _crypto_amount numeric, _price_usd numeric)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); settings public.trade_asset_settings; held numeric; usd numeric; fee numeric; payout numeric; ref text; tx_id uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Please log in to sell crypto.'; END IF;
  IF _coin NOT IN ('BTC','ETH','USDT','SOL','XRP') THEN RAISE EXCEPTION 'Unsupported coin.'; END IF;
  IF _crypto_amount IS NULL OR _crypto_amount <= 0 THEN RAISE EXCEPTION 'Enter an amount greater than zero.'; END IF;
  SELECT * INTO settings FROM public.trade_asset_settings WHERE coin = _coin AND network = _network FOR SHARE;
  IF NOT FOUND OR NOT settings.sell_enabled THEN RAISE EXCEPTION 'Selling this asset is currently unavailable.'; END IF;
  IF _crypto_amount < settings.minimum_crypto_amount OR _crypto_amount > settings.maximum_crypto_amount THEN
    RAISE EXCEPTION 'Sell amount must be between % and % %.', settings.minimum_crypto_amount, settings.maximum_crypto_amount, _coin;
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext(uid::text));
  SELECT COALESCE(sum(CASE WHEN kind='buy' THEN crypto_amount WHEN kind='sell' THEN -crypto_amount ELSE 0 END),0) INTO held
    FROM public.transactions WHERE user_id = uid AND coin = _coin AND kind IN ('buy','sell') AND lower(status) = 'completed';
  IF _crypto_amount > held THEN RAISE EXCEPTION 'Not enough % to sell. Available: %', _coin, round(held, 8); END IF;
  usd := round(_crypto_amount * settings.sell_price_usd, 2);
  IF usd < 1 THEN RAISE EXCEPTION 'Minimum sale is $1.'; END IF;
  fee := round(usd * 0.015, 2); payout := usd - fee;
  ref := 'SELL-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10));
  INSERT INTO public.crypto_sells (user_id, coin, network, crypto_amount, usd_amount, fee_usd, payout_usd, price_usd, status)
    VALUES (uid, _coin, _network, _crypto_amount, usd, fee, payout, settings.sell_price_usd, 'completed');
  INSERT INTO public.transactions (user_id, kind, direction, coin, network, crypto_amount, usd_amount, fee_usd, price_usd, reference, counterparty, status, note)
    VALUES (uid, 'sell', 'credit', _coin, _network, _crypto_amount, usd, fee, settings.sell_price_usd, ref, 'Wallet balance', 'completed', 'Proceeds added to wallet balance')
    RETURNING id INTO tx_id;
  RETURN jsonb_build_object('reference', ref, 'transaction_id', tx_id, 'payout', payout, 'fee', fee, 'price_usd', settings.sell_price_usd);
END $$;

REVOKE ALL ON FUNCTION public.buy_crypto_with_balance(text,text,numeric,numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.buy_crypto_with_balance(text,text,numeric,numeric) TO authenticated;
REVOKE ALL ON FUNCTION public.sell_crypto_to_balance(text,text,numeric,numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sell_crypto_to_balance(text,text,numeric,numeric) TO authenticated;