CREATE OR REPLACE FUNCTION public.buy_crypto_with_balance(_coin text, _network text, _usd_amount numeric, _price_usd numeric)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  fee numeric; total numeric; bal numeric; qty numeric; ref text; tx_id uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Please log in to buy crypto.'; END IF;
  IF _usd_amount IS NULL OR _usd_amount < 1 OR _usd_amount > 1000000 THEN RAISE EXCEPTION 'Enter an amount between $1 and $1,000,000.'; END IF;
  IF _price_usd IS NULL OR _price_usd <= 0 THEN RAISE EXCEPTION 'Price unavailable.'; END IF;
  IF _coin NOT IN ('BTC','ETH','USDT','SOL','XRP') THEN RAISE EXCEPTION 'Unsupported coin.'; END IF;
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
  qty := round(_usd_amount / _price_usd, 10);
  ref := 'BUY-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10));
  INSERT INTO crypto_buys (user_id, coin, network, crypto_amount, usd_amount, fee_usd, total_usd, price_usd, status)
    VALUES (uid, _coin, _network, qty, _usd_amount, fee, total, _price_usd, 'completed');
  INSERT INTO transactions (user_id, kind, direction, coin, network, crypto_amount, usd_amount, fee_usd, price_usd, reference, counterparty, status, note)
    VALUES (uid, 'buy', 'debit', _coin, _network, qty, _usd_amount, fee, _price_usd, ref, 'Wallet balance', 'completed', 'Paid with wallet balance')
    RETURNING id INTO tx_id;
  RETURN jsonb_build_object('reference', ref, 'transaction_id', tx_id, 'crypto_amount', qty, 'fee', fee, 'total', total, 'balance', round(bal - total, 2));
END $$;
REVOKE ALL ON FUNCTION public.buy_crypto_with_balance(text,text,numeric,numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.buy_crypto_with_balance(text,text,numeric,numeric) TO authenticated;