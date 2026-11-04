CREATE OR REPLACE FUNCTION public.get_platform_flags()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'maintenance', COALESCE((features->>'maintenance')::boolean, false),
    'registration', COALESCE((features->>'registration')::boolean, true),
    'buySell', COALESCE((features->>'otc')::boolean, true))
  FROM public.platform_settings WHERE id = 1
$$;
REVOKE ALL ON FUNCTION public.get_platform_flags() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_platform_flags() TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.enforce_registration_open()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE f jsonb := public.get_platform_flags();
BEGIN
  IF f IS NOT NULL AND ((f->>'registration')::boolean = false OR (f->>'maintenance')::boolean = true) THEN
    RAISE EXCEPTION 'New sign-ups are currently closed';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.enforce_registration_open() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS enforce_registration_open ON auth.users;
CREATE TRIGGER enforce_registration_open BEFORE INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.enforce_registration_open();

CREATE OR REPLACE FUNCTION public.enforce_buy_sell_open()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE f jsonb := public.get_platform_flags();
BEGIN
  IF f IS NOT NULL AND ((f->>'buySell')::boolean = false OR (f->>'maintenance')::boolean = true) THEN
    RAISE EXCEPTION 'Buying and selling are currently paused';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.enforce_buy_sell_open() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS enforce_buy_open ON public.crypto_buys;
CREATE TRIGGER enforce_buy_open BEFORE INSERT ON public.crypto_buys FOR EACH ROW EXECUTE FUNCTION public.enforce_buy_sell_open();
DROP TRIGGER IF EXISTS enforce_sell_open ON public.crypto_sells;
CREATE TRIGGER enforce_sell_open BEFORE INSERT ON public.crypto_sells FOR EACH ROW EXECUTE FUNCTION public.enforce_buy_sell_open();