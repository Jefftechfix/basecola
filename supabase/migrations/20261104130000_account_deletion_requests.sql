CREATE TABLE public.account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'completed')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_note TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX account_deletion_one_open_request_per_user
  ON public.account_deletion_requests (user_id)
  WHERE status IN ('pending', 'reviewing', 'approved');

CREATE INDEX account_deletion_requests_status_date_idx
  ON public.account_deletion_requests (status, requested_at DESC);

ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.account_deletion_requests TO authenticated;
GRANT ALL ON public.account_deletion_requests TO service_role;

CREATE POLICY "Users view own deletion requests"
  ON public.account_deletion_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users request own account deletion"
  ON public.account_deletion_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending' AND reviewed_at IS NULL AND reviewed_by IS NULL AND admin_note IS NULL);

CREATE TRIGGER account_deletion_requests_updated_at
  BEFORE UPDATE ON public.account_deletion_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();