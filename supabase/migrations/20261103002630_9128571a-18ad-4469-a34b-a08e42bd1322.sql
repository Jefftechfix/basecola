CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE public.user_pins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pin_hash text NOT NULL,
  failed_attempts int NOT NULL DEFAULT 0,
  locked_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.user_pins TO service_role;
ALTER TABLE public.user_pins ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_user_pins_updated_at BEFORE UPDATE ON public.user_pins FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.has_login_pin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_pins WHERE user_id = auth.uid())
$$;

CREATE OR REPLACE FUNCTION public.set_login_pin(_pin text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF _pin !~ '^\d{4}$' THEN RAISE EXCEPTION 'PIN must be 4 digits'; END IF;
  INSERT INTO public.user_pins(user_id, pin_hash) VALUES (auth.uid(), extensions.crypt(_pin, extensions.gen_salt('bf')))
  ON CONFLICT (user_id) DO UPDATE SET pin_hash = EXCLUDED.pin_hash, failed_attempts = 0, locked_until = NULL;
END $$;

CREATE OR REPLACE FUNCTION public.verify_login_pin(_pin text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE r public.user_pins;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT * INTO r FROM public.user_pins WHERE user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'No PIN set'; END IF;
  IF r.locked_until IS NOT NULL AND r.locked_until > now() THEN RAISE EXCEPTION 'Too many attempts. Try again in a few minutes.'; END IF;
  IF r.pin_hash = extensions.crypt(_pin, r.pin_hash) THEN
    UPDATE public.user_pins SET failed_attempts = 0, locked_until = NULL WHERE user_id = auth.uid();
    RETURN true;
  END IF;
  UPDATE public.user_pins SET failed_attempts = failed_attempts + 1,
    locked_until = CASE WHEN failed_attempts + 1 >= 5 THEN now() + interval '15 minutes' ELSE NULL END
    WHERE user_id = auth.uid();
  RETURN false;
END $$;

REVOKE ALL ON FUNCTION public.has_login_pin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_login_pin(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.verify_login_pin(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_login_pin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_login_pin(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_login_pin(text) TO authenticated;

CREATE TABLE public.account_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  country text NOT NULL,
  address text NOT NULL,
  ssn_last4 text,
  id_document_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewer_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.account_verifications TO authenticated;
GRANT ALL ON public.account_verifications TO service_role;
ALTER TABLE public.account_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own verifications select" ON public.account_verifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own verifications insert" ON public.account_verifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'pending' AND reviewer_note IS NULL);
CREATE INDEX account_verifications_user_idx ON public.account_verifications(user_id, created_at DESC);
CREATE TRIGGER update_account_verifications_updated_at BEFORE UPDATE ON public.account_verifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();