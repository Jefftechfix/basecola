ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS my_referral_code text UNIQUE;

CREATE OR REPLACE FUNCTION public.generate_referral_code() RETURNS text LANGUAGE plpgsql SET search_path = public AS $$
DECLARE c text;
BEGIN
  LOOP
    c := 'BC' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE my_referral_code = c);
  END LOOP;
  RETURN c;
END $$;
REVOKE ALL ON FUNCTION public.generate_referral_code() FROM PUBLIC, anon, authenticated;

UPDATE public.profiles SET my_referral_code = public.generate_referral_code() WHERE my_referral_code IS NULL;

CREATE OR REPLACE FUNCTION public.protect_referral_code() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF auth.role() = 'authenticated' THEN
    NEW.my_referral_code := OLD.my_referral_code;
    NEW.referral_code := OLD.referral_code;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER profiles_protect_referral BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.protect_referral_code();

CREATE TABLE public.admin_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  referral_code text NOT NULL,
  reward_usd numeric(20,2) NOT NULL DEFAULT 10,
  status text NOT NULL DEFAULT 'pending',
  admin_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_referrals TO authenticated;
GRANT ALL ON public.admin_referrals TO service_role;
ALTER TABLE public.admin_referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Referrers view own referrals" ON public.admin_referrals FOR SELECT TO authenticated USING (auth.uid() = referrer_id);
CREATE INDEX ON public.admin_referrals (referrer_id, created_at DESC);
CREATE TRIGGER admin_referrals_updated_at BEFORE UPDATE ON public.admin_referrals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Link existing users who signed up with a code
INSERT INTO public.admin_referrals (referrer_id, referred_id, referral_code)
SELECT r.id, p.id, upper(trim(p.referral_code)) FROM public.profiles p
JOIN public.profiles r ON r.my_referral_code = upper(trim(p.referral_code)) AND r.id <> p.id
WHERE p.referral_code IS NOT NULL AND trim(p.referral_code) <> ''
ON CONFLICT (referred_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE code text := nullif(upper(trim(NEW.raw_user_meta_data->>'referral_code')), ''); ref uuid;
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, country, referral_code, my_referral_code)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email, NEW.raw_user_meta_data->>'phone',
          NEW.raw_user_meta_data->>'country', code, public.generate_referral_code());
  IF code IS NOT NULL THEN
    SELECT id INTO ref FROM public.profiles WHERE my_referral_code = code AND id <> NEW.id;
    IF ref IS NOT NULL THEN
      INSERT INTO public.admin_referrals (referrer_id, referred_id, referral_code) VALUES (ref, NEW.id, code) ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;