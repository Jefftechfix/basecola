ALTER TABLE public.admin_email_notifications
  DROP CONSTRAINT admin_email_notifications_audience_check,
  ADD CONSTRAINT admin_email_notifications_audience_check
    CHECK (audience IN ('all_active', 'selected_users'));
