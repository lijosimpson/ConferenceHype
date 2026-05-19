create extension if not exists pgcrypto;

create type source_type as enum (
  'official',
  'media',
  'company',
  'verified_social',
  'general_social',
  'manual'
);

create type content_type as enum (
  'agenda_preview',
  'abstract_buzz',
  'media_roundup',
  'social_signal',
  'industry_floor',
  'market_watch',
  'patient_lens',
  'hype_clip'
);

create type segment_status as enum (
  'draft',
  'pending_review',
  'approved',
  'rejected',
  'rendered'
);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null unique,
  type source_type not null,
  rank int not null default 5,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.ingested_items (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.sources(id) on delete set null,
  title text not null,
  url text not null,
  excerpt text not null default '',
  author text,
  source_type source_type not null,
  source_rank int not null default 5,
  dedupe_hash text not null unique,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.segments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null default '',
  script text not null,
  content_type content_type not null,
  persona_id text not null,
  persona_name text not null,
  hype_level text not null default 'standard',
  language text not null default 'English',
  status segment_status not null default 'pending_review',
  citations jsonb not null default '[]',
  social_buzz_items jsonb not null default '[]',
  risk_flags text[] not null default '{}',
  confidence_score int not null default 0,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  segment_id uuid references public.segments(id) on delete cascade,
  kind text not null,
  storage_path text,
  status text not null default 'queued',
  duration_seconds int,
  created_at timestamptz not null default now()
);

create table public.stream_state (
  id int primary key default 1 check (id = 1),
  mode text not null default 'preview',
  emergency_active boolean not null default false,
  emergency_message text not null default 'ASCO Hype automation is paused while the operator desk reviews the queue.',
  current_segment_id uuid references public.segments(id),
  updated_at timestamptz not null default now()
);

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  segment_id uuid references public.segments(id) on delete set null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists ingested_items_source_id_idx
  on public.ingested_items (source_id);

create index if not exists segments_approved_by_idx
  on public.segments (approved_by);

create index if not exists media_assets_segment_id_idx
  on public.media_assets (segment_id);

create index if not exists stream_state_current_segment_id_idx
  on public.stream_state (current_segment_id);

create index if not exists analytics_events_segment_id_idx
  on public.analytics_events (segment_id);

insert into public.stream_state (id) values (1) on conflict (id) do nothing;

alter table public.sources enable row level security;
alter table public.ingested_items enable row level security;
alter table public.segments enable row level security;
alter table public.media_assets enable row level security;
alter table public.stream_state enable row level security;
alter table public.analytics_events enable row level security;

create policy "public can read approved segments"
  on public.segments for select
  to anon
  using (status in ('approved', 'rendered'));

create policy "authenticated admins can manage segments"
  on public.segments for all
  to authenticated
  using ((select auth.role()) = 'authenticated')
  with check ((select auth.role()) = 'authenticated');

create policy "authenticated admins can manage sources"
  on public.sources for all
  to authenticated
  using ((select auth.role()) = 'authenticated')
  with check ((select auth.role()) = 'authenticated');

create policy "authenticated admins can manage stream state"
  on public.stream_state for all
  to authenticated
  using ((select auth.role()) = 'authenticated')
  with check ((select auth.role()) = 'authenticated');

create policy "authenticated admins can manage ingested items"
  on public.ingested_items for all
  to authenticated
  using ((select auth.role()) = 'authenticated')
  with check ((select auth.role()) = 'authenticated');

create policy "authenticated admins can manage media assets"
  on public.media_assets for all
  to authenticated
  using ((select auth.role()) = 'authenticated')
  with check ((select auth.role()) = 'authenticated');

create policy "public can insert analytics"
  on public.analytics_events for insert
  to anon, authenticated
  with check (
    char_length(event_name) between 1 and 80
    and jsonb_typeof(metadata) = 'object'
    and pg_column_size(metadata) <= 4096
  );

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'rls_auto_enable'
  ) then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;
