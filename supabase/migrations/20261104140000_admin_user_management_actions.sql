CREATE TABLE public.admin_balance_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL UNIQUE REFERENCES public.transactions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  direction TEXT NOT NULL CHECK (direction IN ('credit', 'debit')),
  amount NUMERIC(20,2) NOT NULL CHECK (amount > 0),
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_balance_adjustments ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.admin_balance_adjustments TO service_role;

CREATE OR REPLACE FUNCTION public.admin_adjust_user_balance(
  _target_user_id UUID,
  _admin_id UUID,
  _direction TEXT,
  _amount NUMERIC,
  _note TEXT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  current_balance NUMERIC(20,2);
  tx_id UUID := gen_random_uuid();
  reference_code TEXT := 'ADM-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
  clean_note TEXT := nullif(left(trim(_note), 500), '');
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _admin_id AND role = 'admin') THEN
    RAISE EXCEPTION 'Admin access required.';
  END IF;
  IF _direction NOT IN ('credit', 'debit') OR _amount IS NULL OR _amount <= 0 OR _amount > 1000000 OR round(_amount, 2) <> _amount THEN
    RAISE EXCEPTION 'Enter a valid amount between $0.01 and $1,000,000.00.';
  END IF;
  IF clean_note IS NULL THEN RAISE EXCEPTION 'An adjustment reason is required.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = _target_user_id) THEN
    RAISE EXCEPTION 'User not found.';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(_target_user_id::text));

  SELECT round(
    COALESCE((
      SELECT sum(amount)
      FROM public.wallet_fundings
      WHERE user_id = _target_user_id AND (
        lower(status) IN ('completed', 'paid', 'succeeded', 'success')
        OR (lower(status) = 'pending'
          AND (coalesce(reference, '') LIKE 'cs_live_%' OR coalesce(reference, '') LIKE 'cs_test_%' OR payment_method LIKE 'Stripe%')
          AND payment_method NOT LIKE '%awaiting bank verification%')
      )
    ), 0)
    + COALESCE((
      SELECT sum(CASE WHEN direction = 'debit' THEN -(usd_amount + fee_usd) ELSE usd_amount - fee_usd END)
      FROM public.transactions
      WHERE user_id = _target_user_id
        AND lower(kind) <> 'funding'
        AND lower(status) IN ('completed', 'paid', 'succeeded', 'success')
    ), 0), 2
  ) INTO current_balance;

  IF _direction = 'debit' AND _amount > current_balance THEN
    RAISE EXCEPTION 'Insufficient balance. Available: $%', current_balance;
  END IF;

  INSERT INTO public.transactions (
    id, user_id, kind, direction, usd_amount, fee_usd, reference, counterparty, status, note
  ) VALUES (
    tx_id, _target_user_id, CASE WHEN _direction = 'credit' THEN 'receive' ELSE 'send' END,
    _direction, _amount, 0, reference_code, 'Admin balance adjustment', 'completed', clean_note
  );

  INSERT INTO public.admin_balance_adjustments (transaction_id, user_id, admin_id, direction, amount, note)
  VALUES (tx_id, _target_user_id, _admin_id, _direction, _amount, clean_note);

  RETURN jsonb_build_object(
    'transaction_id', tx_id,
    'reference', reference_code,
    'balance', CASE WHEN _direction = 'credit' THEN current_balance + _amount ELSE current_balance - _amount END
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_user_balance(_target_user_id UUID, _admin_id UUID)
RETURNS NUMERIC(20,2)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result NUMERIC(20,2);
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _admin_id AND role = 'admin') THEN
    RAISE EXCEPTION 'Admin access required.';
  END IF;
  SELECT round(
    COALESCE((
      SELECT sum(amount)
      FROM public.wallet_fundings
      WHERE user_id = _target_user_id AND (
        lower(status) IN ('completed', 'paid', 'succeeded', 'success')
        OR (lower(status) = 'pending'
          AND (coalesce(reference, '') LIKE 'cs_live_%' OR coalesce(reference, '') LIKE 'cs_test_%' OR payment_method LIKE 'Stripe%')
          AND payment_method NOT LIKE '%awaiting bank verification%')
      )
    ), 0)
    + COALESCE((
      SELECT sum(CASE WHEN direction = 'debit' THEN -(usd_amount + fee_usd) ELSE usd_amount - fee_usd END)
      FROM public.transactions
      WHERE user_id = _target_user_id
        AND lower(kind) <> 'funding'
        AND lower(status) IN ('completed', 'paid', 'succeeded', 'success')
    ), 0), 2
  ) INTO result;
  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_adjust_user_balance(UUID, UUID, TEXT, NUMERIC, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_get_user_balance(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_adjust_user_balance(UUID, UUID, TEXT, NUMERIC, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_get_user_balance(UUID, UUID) TO service_role;