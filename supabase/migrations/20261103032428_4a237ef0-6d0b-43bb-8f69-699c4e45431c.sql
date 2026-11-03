create table public.admin_user_management (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  account_status text not null default 'active',
  admin_note text,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant all on public.admin_user_management to service_role;
alter table public.admin_user_management enable row level security;
create trigger admin_user_management_updated before update on public.admin_user_management for each row execute function public.update_updated_at_column();

create table public.admin_verification_reviews (
  id uuid primary key default gen_random_uuid(),
  verification_id uuid not null references public.account_verifications(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reviewer_id uuid not null,
  decision text not null,
  note text,
  email_status text not null default 'not_sent',
  created_at timestamptz not null default now()
);
grant all on public.admin_verification_reviews to service_role;
alter table public.admin_verification_reviews enable row level security;
create index admin_verification_reviews_verification_idx on public.admin_verification_reviews(verification_id, created_at desc);