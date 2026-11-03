CREATE OR REPLACE FUNCTION public.sell_crypto_to_balance(_coin text, _network text, _crypto_amount numeric, _price_usd numeric)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); held numeric; usd numeric; fee numeric; payout numeric; ref text; tx_id uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Please log in to sell crypto.'; END IF;
  IF _coin NOT IN ('BTC','ETH','USDT','SOL','XRP') THEN RAISE EXCEPTION 'Unsupported coin.'; END IF;
  IF _crypto_amount IS NULL OR _crypto_amount <= 0 THEN RAISE EXCEPTION 'Enter an amount greater than zero.'; END IF;
  IF _price_usd IS NULL OR _price_usd <= 0 THEN RAISE EXCEPTION 'Price unavailable.'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(uid::text));
  SELECT COALESCE(sum(CASE WHEN kind='buy' THEN crypto_amount WHEN kind='sell' THEN -crypto_amount ELSE 0 END),0) INTO held
    FROM transactions WHERE user_id = uid AND coin = _coin AND kind IN ('buy','sell') AND lower(status) = 'completed';
  IF _crypto_amount > held THEN RAISE EXCEPTION 'Not enough % to sell. Available: %', _coin, round(held, 8); END IF;
  usd := round(_crypto_amount * _price_usd, 2);
  IF usd < 1 THEN RAISE EXCEPTION 'Minimum sale is $1.'; END IF;
  fee := round(usd * 0.015, 2); payout := usd - fee;
  ref := 'SELL-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10));
  INSERT INTO crypto_sells (user_id, coin, network, crypto_amount, usd_amount, fee_usd, payout_usd, price_usd, status)
    VALUES (uid, _coin, _network, _crypto_amount, usd, fee, payout, _price_usd, 'completed');
  INSERT INTO transactions (user_id, kind, direction, coin, network, crypto_amount, usd_amount, fee_usd, price_usd, reference, counterparty, status, note)
    VALUES (uid, 'sell', 'credit', _coin, _network, _crypto_amount, usd, fee, _price_usd, ref, 'Wallet balance', 'completed', 'Proceeds added to wallet balance')
    RETURNING id INTO tx_id;
  RETURN jsonb_build_object('reference', ref, 'transaction_id', tx_id, 'payout', payout, 'fee', fee);
END $$;
REVOKE ALL ON FUNCTION public.sell_crypto_to_balance(text,text,numeric,numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sell_crypto_to_balance(text,text,numeric,numeric) TO authenticated;