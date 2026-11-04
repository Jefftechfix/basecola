CREATE TABLE public.wallet_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  network TEXT NOT NULL CHECK (network IN ('bitcoin-testnet', 'ethereum-sepolia', 'solana-devnet', 'xrpl-testnet')),
  address TEXT,
  destination_tag BIGINT CHECK (destination_tag BETWEEN 0 AND 4294967295),
  custody_reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, network),
  UNIQUE (network, address),
  CHECK (status <> 'active' OR address IS NOT NULL)
);

CREATE TABLE public.custody_provisioning_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  network TEXT NOT NULL CHECK (network IN ('bitcoin-testnet', 'ethereum-sepolia', 'solana-devnet', 'xrpl-testnet')),
  provisioning_version TEXT NOT NULL DEFAULT 'v1',
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'retry', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_until TIMESTAMPTZ,
  last_error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, network, provisioning_version)
);

CREATE INDEX custody_provisioning_jobs_claim_idx
  ON public.custody_provisioning_jobs (available_at, created_at)
  WHERE status IN ('queued', 'retry');

CREATE INDEX wallet_accounts_user_idx ON public.wallet_accounts (user_id, network);

ALTER TABLE public.wallet_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custody_provisioning_jobs ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.wallet_accounts, public.custody_provisioning_jobs TO authenticated;
GRANT ALL ON public.wallet_accounts, public.custody_provisioning_jobs TO service_role;

CREATE POLICY "Users view own wallet accounts"
  ON public.wallet_accounts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users view own custody provisioning status"
  ON public.custody_provisioning_jobs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER wallet_accounts_updated_at
  BEFORE UPDATE ON public.wallet_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER custody_provisioning_jobs_updated_at
  BEFORE UPDATE ON public.custody_provisioning_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

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
    'bitcoin-testnet',
    'ethereum-sepolia',
    'solana-devnet',
    'xrpl-testnet'
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