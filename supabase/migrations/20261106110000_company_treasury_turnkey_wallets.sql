ALTER TABLE public.treasury_wallet_accounts
  ADD COLUMN IF NOT EXISTS turnkey_wallet_id TEXT,
  ADD COLUMN IF NOT EXISTS turnkey_created_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS treasury_wallet_accounts_turnkey_wallet_id_idx
  ON public.treasury_wallet_accounts (turnkey_wallet_id)
  WHERE turnkey_wallet_id IS NOT NULL;

REVOKE ALL ON public.treasury_wallet_accounts FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.treasury_wallet_accounts TO service_role;

CREATE OR REPLACE FUNCTION public.protect_company_treasury_identity()
RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.turnkey_wallet_id IS NOT NULL THEN
      RAISE EXCEPTION 'Synchronized company treasury wallets cannot be deleted.';
    END IF;
    RETURN OLD;
  END IF;

  IF OLD.turnkey_wallet_id IS NOT NULL
    AND (
      NEW.turnkey_wallet_id IS DISTINCT FROM OLD.turnkey_wallet_id
      OR NEW.network IS DISTINCT FROM OLD.network
      OR NEW.address IS DISTINCT FROM OLD.address
    ) THEN
    RAISE EXCEPTION 'Synchronized company treasury wallet identity is immutable.';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.protect_company_treasury_identity()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.protect_company_treasury_identity()
  TO service_role;

DROP TRIGGER IF EXISTS protect_company_treasury_identity ON public.treasury_wallet_accounts;

CREATE TRIGGER protect_company_treasury_identity
  BEFORE UPDATE OR DELETE ON public.treasury_wallet_accounts
  FOR EACH ROW EXECUTE FUNCTION public.protect_company_treasury_identity();

CREATE OR REPLACE FUNCTION public.sync_company_treasury_wallets(_wallets JSONB)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  wallet JSONB;
  wallet_id TEXT;
  wallet_name TEXT;
  wallet_network TEXT;
  wallet_address TEXT;
  wallet_created_at TIMESTAMPTZ;
  existing_id UUID;
  existing_turnkey_id TEXT;
  existing_network TEXT;
  existing_address TEXT;
  synced_count INTEGER := 0;
BEGIN
  IF jsonb_typeof(_wallets) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Exactly four existing Turnkey treasury wallets are required.';
  END IF;

  IF jsonb_array_length(_wallets) <> 4 THEN
    RAISE EXCEPTION 'Exactly four existing Turnkey treasury wallets are required.';
  END IF;

  IF (
    SELECT count(DISTINCT value->>'walletId')
    FROM jsonb_array_elements(_wallets)
  ) <> 4 THEN
    RAISE EXCEPTION 'Turnkey treasury wallet IDs must be unique.';
  END IF;

  IF (
    SELECT count(DISTINCT value->>'network')
    FROM jsonb_array_elements(_wallets)
  ) <> 4 THEN
    RAISE EXCEPTION 'Exactly one treasury wallet per supported network is required.';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('sync_company_treasury_wallets'));

  FOR wallet IN SELECT value FROM jsonb_array_elements(_wallets)
  LOOP
    wallet_id := nullif(trim(wallet->>'walletId'), '');
    wallet_name := nullif(trim(wallet->>'walletName'), '');
    wallet_network := nullif(trim(wallet->>'network'), '');
    wallet_address := nullif(trim(wallet->>'address'), '');
    wallet_created_at := nullif(wallet->>'createdAt', '')::TIMESTAMPTZ;

    IF wallet_id IS NULL OR wallet_name IS NULL OR wallet_address IS NULL
      OR wallet_created_at IS NULL OR wallet_network IS NULL OR wallet_network NOT IN (
        'bitcoin-mainnet', 'ethereum-mainnet', 'solana-mainnet', 'xrpl-mainnet'
      ) THEN
      RAISE EXCEPTION 'A Turnkey treasury wallet has invalid identity or network data.';
    END IF;

    SELECT id, network, address
      INTO existing_id, existing_network, existing_address
      FROM public.treasury_wallet_accounts
      WHERE turnkey_wallet_id = wallet_id
      FOR UPDATE;

    IF existing_id IS NOT NULL THEN
      IF existing_network <> wallet_network OR existing_address <> wallet_address THEN
        RAISE EXCEPTION 'A registered Turnkey treasury wallet address or network changed.';
      END IF;

      UPDATE public.treasury_wallet_accounts
        SET label = wallet_name,
            turnkey_created_at = wallet_created_at,
            wallet_type = 'treasury'
        WHERE id = existing_id;
    ELSE
      SELECT id, turnkey_wallet_id
        INTO existing_id, existing_turnkey_id
        FROM public.treasury_wallet_accounts
        WHERE network = wallet_network AND address = wallet_address
        FOR UPDATE;

      IF existing_id IS NOT NULL AND existing_turnkey_id IS NOT NULL
        AND existing_turnkey_id <> wallet_id THEN
        RAISE EXCEPTION 'A treasury address is already associated with another Turnkey wallet.';
      END IF;

      IF existing_id IS NOT NULL THEN
        UPDATE public.treasury_wallet_accounts
          SET label = wallet_name,
              turnkey_wallet_id = wallet_id,
              turnkey_created_at = wallet_created_at,
              wallet_type = 'treasury'
          WHERE id = existing_id;
      ELSE
        INSERT INTO public.treasury_wallet_accounts (
          label, turnkey_wallet_id, turnkey_created_at, network, address, wallet_type, status
        ) VALUES (
          wallet_name, wallet_id, wallet_created_at, wallet_network, wallet_address, 'treasury', 'active'
        );
      END IF;
    END IF;

    synced_count := synced_count + 1;
  END LOOP;

  RETURN synced_count;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_company_treasury_wallets(JSONB)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_company_treasury_wallets(JSONB)
  TO service_role;
