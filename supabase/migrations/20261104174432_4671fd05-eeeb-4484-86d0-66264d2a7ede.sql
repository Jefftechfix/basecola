CREATE OR REPLACE FUNCTION public.normalize_phone(_phone text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT nullif(regexp_replace(coalesce(_phone, ''), '[^0-9]', '', 'g'), '')
$$;

CREATE OR REPLACE FUNCTION public.check_signup_available(_email text, _phone text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'email_taken', EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower(trim(_email))),
    'phone_taken', public.normalize_phone(_phone) IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.profiles WHERE public.normalize_phone(phone) = public.normalize_phone(_phone))
  )
$$;
REVOKE ALL ON FUNCTION public.check_signup_available(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_signup_available(text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.block_duplicate_signup_phone()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p text := public.normalize_phone(NEW.raw_user_meta_data->>'phone');
BEGIN
  IF p IS NOT NULL AND EXISTS (SELECT 1 FROM public.profiles WHERE public.normalize_phone(phone) = p) THEN
    RAISE EXCEPTION 'PHONE_ALREADY_REGISTERED';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.block_duplicate_signup_phone() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS block_duplicate_signup_phone ON auth.users;
CREATE TRIGGER block_duplicate_signup_phone BEFORE INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.block_duplicate_signup_phone();