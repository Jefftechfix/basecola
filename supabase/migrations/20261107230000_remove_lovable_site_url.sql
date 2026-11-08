UPDATE public.platform_settings
SET general = general - 'siteUrl'
WHERE general->>'siteUrl' = 'https://crypto-basecamp-beacon.lovable.app';
