CREATE OR REPLACE FUNCTION public.change_login_pin(_current_pin text, _new_pin text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE r public.user_pins;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Please log in again.'; END IF;
  IF _new_pin !~ '^\d{4}$' THEN RAISE EXCEPTION 'PIN must be 4 digits.'; END IF;
  SELECT * INTO r FROM public.user_pins WHERE user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'No PIN set yet.'; END IF;
  IF r.locked_until IS NOT NULL AND r.locked_until > now() THEN RAISE EXCEPTION 'Too many attempts. Try again in a few minutes.'; END IF;
  IF r.pin_hash <> extensions.crypt(coalesce(_current_pin,''), r.pin_hash) THEN
    UPDATE public.user_pins SET failed_attempts = failed_attempts + 1,
      locked_until = CASE WHEN failed_attempts + 1 >= 5 THEN now() + interval '15 minutes' ELSE NULL END
      WHERE user_id = auth.uid();
    RAISE EXCEPTION 'Current PIN is incorrect.';
  END IF;
  UPDATE public.user_pins SET pin_hash = extensions.crypt(_new_pin, extensions.gen_salt('bf')), failed_attempts = 0, locked_until = NULL, updated_at = now() WHERE user_id = auth.uid();
END $$;
REVOKE ALL ON FUNCTION public.change_login_pin(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.change_login_pin(text, text) TO authenticated;