CREATE TABLE public.platform_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  general jsonb NOT NULL DEFAULT '{}'::jsonb,
  branding jsonb NOT NULL DEFAULT '{}'::jsonb,
  support jsonb NOT NULL DEFAULT '{}'::jsonb,
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  policies jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.platform_settings TO service_role;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_platform_settings_updated_at BEFORE UPDATE ON public.platform_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.admin_settings_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  section text NOT NULL,
  previous_value jsonb,
  next_value jsonb NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.admin_settings_audit TO service_role;
ALTER TABLE public.admin_settings_audit ENABLE ROW LEVEL SECURITY;
CREATE INDEX admin_settings_audit_created_idx ON public.admin_settings_audit (created_at DESC);

INSERT INTO public.platform_settings (id, general, branding, support, features, policies) VALUES (1,
 '{"name":"Basecola","siteUrl":"https://crypto-basecamp-beacon.lovable.app","adminEmail":"admin@basecola.com","language":"English (EN)","timezone":"(GMT+01:00) West Africa (Lagos)","live":true}',
 '{"primary":"#7A00FF","secondary":"#A855F7","accent":"#2563EB","theme":"Light (Default)","dark":true}',
 '{"supportEmail":"support@basecola.com","phone":"","whatsapp":"","helpUrl":""}',
 '{"supportEmail":true,"supportPhone":true,"whatsapp":true,"liveChat":true,"helpCenter":true,"registration":true,"otc":true,"kyc":true,"deposits":true,"twoFactor":true,"emailNotes":true,"referral":true,"invest":true,"sms":false,"maintenance":false,"admin2fa":true,"loginAlert":true,"inApp":true}',
 '{"privacy":"","terms":"","aml":"","kyc":"","refund":""}');

CREATE OR REPLACE FUNCTION public.admin_update_platform_settings(_admin_id uuid, _section text, _value jsonb, _note text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE prev jsonb; merged jsonb;
BEGIN
  IF NOT public.has_role(_admin_id, 'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF _section NOT IN ('general','branding','support','features','policies') THEN RAISE EXCEPTION 'Unknown settings section'; END IF;
  IF jsonb_typeof(_value) <> 'object' THEN RAISE EXCEPTION 'Settings must be an object'; END IF;
  EXECUTE format('SELECT %I FROM public.platform_settings WHERE id = 1 FOR UPDATE', _section) INTO prev;
  merged := COALESCE(prev, '{}'::jsonb) || _value;
  EXECUTE format('UPDATE public.platform_settings SET %I = $1, updated_by = $2 WHERE id = 1', _section) USING merged, _admin_id;
  INSERT INTO public.admin_settings_audit (admin_id, section, previous_value, next_value, note) VALUES (_admin_id, _section, prev, merged, NULLIF(left(_note, 500), ''));
  RETURN merged;
END $$;
REVOKE ALL ON FUNCTION public.admin_update_platform_settings(uuid, text, jsonb, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_platform_settings(uuid, text, jsonb, text) TO service_role;