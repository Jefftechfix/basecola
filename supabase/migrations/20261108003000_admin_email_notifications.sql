CREATE TABLE public.admin_email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subject TEXT NOT NULL CHECK (char_length(subject) BETWEEN 1 AND 200),
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 10000),
  audience TEXT NOT NULL DEFAULT 'all_active' CHECK (audience = 'all_active'),
  status TEXT NOT NULL DEFAULT 'sending' CHECK (status IN ('sending', 'sent', 'partial', 'failed')),
  recipient_count INTEGER NOT NULL DEFAULT 0 CHECK (recipient_count >= 0),
  sent_count INTEGER NOT NULL DEFAULT 0 CHECK (sent_count >= 0),
  failed_count INTEGER NOT NULL DEFAULT 0 CHECK (failed_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  CHECK (sent_count + failed_count <= recipient_count)
);

CREATE TABLE public.admin_email_notification_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES public.admin_email_notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (notification_id, user_id),
  CHECK (
    (status = 'sent' AND sent_at IS NOT NULL AND error_message IS NULL)
    OR (status = 'failed' AND sent_at IS NULL)
  )
);

CREATE INDEX admin_email_notifications_created_at_idx
  ON public.admin_email_notifications (created_at DESC);
CREATE INDEX admin_email_notification_deliveries_notification_idx
  ON public.admin_email_notification_deliveries (notification_id, status);

ALTER TABLE public.admin_email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_email_notification_deliveries ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.admin_email_notifications, public.admin_email_notification_deliveries TO service_role;
