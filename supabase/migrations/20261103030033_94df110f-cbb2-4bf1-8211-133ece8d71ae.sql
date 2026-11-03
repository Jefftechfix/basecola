CREATE UNIQUE INDEX IF NOT EXISTS transactions_stripe_funding_reference_idx
  ON public.transactions (user_id, reference)
  WHERE kind = 'funding' AND reference IS NOT NULL;