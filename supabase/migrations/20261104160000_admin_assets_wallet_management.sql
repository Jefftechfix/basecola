CREATE TABLE public.platform_asset_networks (
  asset TEXT NOT NULL,
  network TEXT NOT NULL,
  display_name TEXT NOT NULL,
  minimum_deposit NUMERIC(38,18) NOT NULL DEFAULT 0 CHECK (minimum_deposit >= 0),
  required_confirmations INTEGER NOT NULL DEFAULT 1 CHECK (required_confirmations > 0),
  enabled BOOLEAN NOT NULL DEFAULT true,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (asset, network)
);

CREATE TABLE public.admin_asset_config_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset TEXT NOT NULL,
  network TEXT NOT NULL,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  previous_minimum_deposit NUMERIC(38,18),
  next_minimum_deposit NUMERIC(38,18) NOT NULL,
  previous_required_confirmations INTEGER,
  next_required_confirmations INTEGER NOT NULL,
  previous_enabled BOOLEAN,
  next_enabled BOOLEAN NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.treasury_operation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type TEXT NOT NULL CHECK (operation_type IN ('transfer', 'top_up', 'withdraw', 'rebalance')),
  asset TEXT NOT NULL,
  network TEXT NOT NULL,
  amount NUMERIC(38,18) NOT NULL CHECK (amount > 0),
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  destination_address TEXT,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'cancelled')),
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  cancelled_at TIMESTAMPTZ
);

CREATE INDEX treasury_operation_requests_recent_idx ON public.treasury_operation_requests (requested_at DESC);
CREATE INDEX treasury_operation_requests_status_idx ON public.treasury_operation_requests (status, requested_at DESC);

ALTER TABLE public.platform_asset_networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_asset_config_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treasury_operation_requests ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.platform_asset_networks, public.admin_asset_config_audit, public.treasury_operation_requests TO service_role;

CREATE TRIGGER platform_asset_networks_updated_at
  BEFORE UPDATE ON public.platform_asset_networks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.platform_asset_networks (asset, network, display_name, minimum_deposit, required_confirmations)
VALUES
  ('BTC', 'bitcoin-testnet', 'Bitcoin Testnet', 0, 2),
  ('ETH', 'ethereum-sepolia', 'Ethereum Sepolia', 0, 2),
  ('USDT', 'ethereum-sepolia', 'Tether ERC-20 Sepolia', 0, 12),
  ('SOL', 'solana-devnet', 'Solana Devnet', 0, 1),
  ('XRP', 'xrpl-testnet', 'XRP Ledger Testnet', 0, 1)
ON CONFLICT (asset, network) DO NOTHING;

ALTER TABLE public.deposit_observations
  ADD COLUMN below_minimum BOOLEAN NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.apply_deposit_asset_policy() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  policy public.platform_asset_networks;
BEGIN
  SELECT * INTO policy FROM public.platform_asset_networks
  WHERE asset = upper(trim(NEW.asset)) AND network = NEW.network;
  IF NOT FOUND THEN RAISE EXCEPTION 'Asset/network configuration not found.'; END IF;
  NEW.asset := policy.asset;
  NEW.required_confirmations := policy.required_confirmations;
  NEW.below_minimum := NEW.crypto_amount < policy.minimum_deposit;
  IF NEW.status <> 'failed' THEN
    NEW.status := CASE WHEN NEW.confirmations >= policy.required_confirmations THEN 'confirmed' ELSE 'pending' END;
    NEW.confirmed_at := CASE
      WHEN NEW.status = 'confirmed' THEN coalesce(NEW.confirmed_at, now())
      ELSE NULL
    END;
  ELSE
    NEW.confirmed_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER deposit_observations_apply_asset_policy
  BEFORE INSERT OR UPDATE
  ON public.deposit_observations
  FOR EACH ROW EXECUTE FUNCTION public.apply_deposit_asset_policy();

REVOKE EXECUTE ON FUNCTION public.apply_deposit_asset_policy() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_update_asset_network(
  _asset TEXT,
  _network TEXT,
  _admin_id UUID,
  _minimum_deposit NUMERIC,
  _required_confirmations INTEGER,
  _enabled BOOLEAN,
  _note TEXT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE current_row public.platform_asset_networks;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _admin_id AND role = 'admin') THEN
    RAISE EXCEPTION 'Admin access required.';
  END IF;
  IF _minimum_deposit IS NULL OR _minimum_deposit < 0 OR _required_confirmations IS NULL
    OR _required_confirmations < 1 OR _required_confirmations > 100000
    OR _enabled IS NULL OR nullif(trim(_note), '') IS NULL THEN
    RAISE EXCEPTION 'Invalid asset network settings.';
  END IF;
  SELECT * INTO current_row FROM public.platform_asset_networks
  WHERE asset = _asset AND network = _network FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Asset/network configuration not found.'; END IF;

  UPDATE public.platform_asset_networks SET
    minimum_deposit = _minimum_deposit,
    required_confirmations = _required_confirmations,
    enabled = _enabled,
    updated_by = _admin_id
  WHERE asset = _asset AND network = _network;

  INSERT INTO public.admin_asset_config_audit (
    asset, network, admin_id, previous_minimum_deposit, next_minimum_deposit,
    previous_required_confirmations, next_required_confirmations,
    previous_enabled, next_enabled, note
  ) VALUES (
    _asset, _network, _admin_id, current_row.minimum_deposit, _minimum_deposit,
    current_row.required_confirmations, _required_confirmations,
    current_row.enabled, _enabled, left(trim(_note), 500)
  );

  RETURN jsonb_build_object('asset', _asset, 'network', _network, 'updated', true);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_asset_network(TEXT, TEXT, UUID, NUMERIC, INTEGER, BOOLEAN, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_asset_network(TEXT, TEXT, UUID, NUMERIC, INTEGER, BOOLEAN, TEXT) TO service_role;