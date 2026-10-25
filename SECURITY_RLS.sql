-- MA7ALAK DZ: minimum client-side RLS baseline
-- Run in Supabase SQL Editor only after checking the table names/columns.
-- This intentionally removes existing policies on these tables before adding strict owner policies.
-- Admin actions must be implemented as audited SECURITY DEFINER RPCs with a fixed search_path.

begin;

alter table public.shop_state enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.app_config enable row level security;

-- Remove existing policies on the four client-accessed tables so an old permissive policy
-- cannot accidentally OR together with the new owner-only rules.
do $$
declare p record;
begin
  for p in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('shop_state','subscriptions','payments','app_config')
  loop
    execute format('drop policy if exists %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

-- Each signed-in user may only read/write their own shop state.
create policy shop_state_select_own on public.shop_state
  for select to authenticated using (auth.uid() = user_id);
create policy shop_state_insert_own on public.shop_state
  for insert to authenticated with check (auth.uid() = user_id);
create policy shop_state_update_own on public.shop_state
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy shop_state_delete_own on public.shop_state
  for delete to authenticated using (auth.uid() = user_id);

-- Subscription status is readable only by its owner. Do not allow client writes.
create policy subscriptions_select_own on public.subscriptions
  for select to authenticated using (auth.uid() = user_id);

-- Users can view their own payment requests and create requests for themselves.
-- Approvals/rejections must only happen through server-side admin RPCs.
create policy payments_select_own on public.payments
  for select to authenticated using (auth.uid() = user_id);
create policy payments_insert_own on public.payments
  for insert to authenticated with check (auth.uid() = user_id);

-- The app reads only the public payment configuration row; never expose other config keys.
create policy app_config_select_public_pay on public.app_config
  for select to authenticated using (k = 'pay');

-- Helpful lookup/indexes; safe if already present.
create index if not exists shop_state_user_id_idx on public.shop_state(user_id);
create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists payments_user_id_created_at_idx on public.payments(user_id, created_at desc);

commit;

-- IMPORTANT MANUAL CHECKS:
-- 1) Confirm is_admin(), admin_pending(), admin_stats(), admin_approve(p_id), and admin_reject(p_id)
--    are SECURITY DEFINER functions, verify authorization inside each function, and set
--    SET search_path = '' (then schema-qualify all objects) or a safe fixed search_path.
-- 2) Ensure authenticated users cannot INSERT/UPDATE/DELETE subscriptions or approve payments directly.
-- 3) Keep the Supabase service_role key out of index.html and all client files.
-- 4) This app's current phone-to-email mapping is NOT phone verification and cannot securely
--    recover accounts by SMS. For production, migrate to Supabase Phone OTP or verified email auth.
