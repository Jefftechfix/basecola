CREATE TABLE public.user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role = 'admin'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own role" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.lock_wallet_record_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status IS DISTINCT FROM 'pending' AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'New wallet records stay pending until an admin updates them'
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only an admin can change this record status'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.lock_wallet_record_status() FROM PUBLIC;

CREATE TRIGGER wallet_fundings_lock_status
  BEFORE INSERT OR UPDATE ON public.wallet_fundings
  FOR EACH ROW EXECUTE FUNCTION public.lock_wallet_record_status();
CREATE TRIGGER crypto_receives_lock_status
  BEFORE INSERT OR UPDATE ON public.crypto_receives
  FOR EACH ROW EXECUTE FUNCTION public.lock_wallet_record_status();
CREATE TRIGGER crypto_sends_lock_status
  BEFORE INSERT OR UPDATE ON public.crypto_sends
  FOR EACH ROW EXECUTE FUNCTION public.lock_wallet_record_status();

CREATE POLICY "Admins select fundings" ON public.wallet_fundings FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins update fundings" ON public.wallet_fundings FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins select receives" ON public.crypto_receives FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins update receives" ON public.crypto_receives FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins select sends" ON public.crypto_sends FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins update sends" ON public.crypto_sends FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
