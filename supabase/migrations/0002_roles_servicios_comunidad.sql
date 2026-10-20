-- Portal SaludOcupacional · 0002
-- 1) Tipo de usuario: cliente (empresa/comercio) o colaborador.
-- 2) Catálogo de servicios y servicios habilitados por organización.
-- 3) Reglas para que un colaborador vea solo lo suyo.
-- 4) Comunidad: publicaciones con borrador y aprobación.

-- ───────────────────────── 1. Tipo de usuario
alter table public.profiles
  add column if not exists user_type text not null default 'cliente' check (user_type in ('cliente','colaborador'));

create or replace function public.current_user_type() returns text
language sql stable security definer set search_path = public as $$
  select coalesce((select user_type from public.profiles where id = auth.uid()), 'cliente')
$$;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, org_id, full_name, role_title, permission, is_idt_staff, user_type)
  values (
    new.id,
    nullif(new.raw_user_meta_data->>'org_id','')::uuid,
    coalesce(new.raw_user_meta_data->>'full_name',''),
    coalesce(new.raw_user_meta_data->>'role_title',''),
    coalesce(nullif(new.raw_user_meta_data->>'permission',''),'todo'),
    coalesce((new.raw_app_meta_data->>'is_idt_staff')::boolean, false),
    case when new.raw_user_meta_data->>'user_type' = 'colaborador' then 'colaborador' else 'cliente' end
  );
  return new;
end;
$$;

-- Un usuario no puede cambiarse solo el tipo
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and org_id is not distinct from public.current_org()
    and is_idt_staff = public.is_idt_staff()
    and permission = public.current_permission()
    and user_type = public.current_user_type()
  );

-- ───────────────────────── 2. Catálogo de servicios
create table if not exists public.services (
  key text primary key,
  name text not null,
  description text not null default '',
  audience text not null check (audience in ('cliente','colaborador','ambos')),
  sort int not null default 0,
  active boolean not null default true
);

insert into public.services (key, name, description, audience, sort) values
  ('medico_referente',     'Médico del trabajo referente',          'Un médico del trabajo de IDT que acompaña a la organización todos los meses.', 'ambos', 10),
  ('atencion_sedes',       'Consultas en sedes Campana y Zárate',   'Consultas, controles y estudios en las sedes propias de IDT.', 'ambos', 20),
  ('telemedicina',         'Telemedicina',                          'Consultas médicas a distancia.', 'ambos', 30),
  ('precio_preferencial',  'Precio preferencial en estudios',       'Valor preferencial en todos los estudios médicos de IDT.', 'cliente', 40),
  ('licencias_accidentes', 'Seguimiento de licencias y accidentes', 'Seguimiento médico de licencias, accidentes y enfermedades profesionales.', 'cliente', 50),
  ('aviso_medico',         'Aviso Médico por WhatsApp',             'El colaborador avisa su ausencia por WhatsApp y el asistente con IA la registra.', 'ambos', 60),
  ('nume',                 'NUME · bienestar 24/7',                 'Telemedicina 24/7, salud mental, nutrición, meditaciones y bienestar financiero.', 'colaborador', 70),
  ('academia',             'Academia IDT',                          'Capacitaciones con evaluación y certificado firmado por el médico del trabajo.', 'ambos', 80),
  ('campanas',             'Campañas de salud',                     'Piezas mensuales de prevención para compartir con el equipo.', 'ambos', 90),
  ('ruta_saludable',       'Ruta Saludable',                        'Acompañamiento remoto para conductores profesionales.', 'ambos', 100),
  ('medicheck',            'Medicheck',                             'Chequeo médico integral en una sola visita.', 'ambos', 110),
  ('capacitaciones',       'Capacitaciones in company',             'Capacitaciones presenciales en la empresa.', 'cliente', 120)
on conflict (key) do update set name = excluded.name, description = excluded.description, audience = excluded.audience, sort = excluded.sort;

create table if not exists public.org_services (
  org_id uuid not null references public.organizations(id) on delete cascade,
  service_key text not null references public.services(key) on delete cascade,
  enabled_at timestamptz not null default now(),
  primary key (org_id, service_key)
);

-- Cargar lo que ya estaba marcado en cada organización + los servicios base
insert into public.org_services (org_id, service_key)
select o.id, s.key
from public.organizations o
cross join lateral (values
  ('medico_referente', true),
  ('atencion_sedes', true),
  ('telemedicina', true),
  ('precio_preferencial', true),
  ('licencias_accidentes', true),
  ('aviso_medico', o.has_aviso_medico),
  ('ruta_saludable', o.has_ruta_saludable),
  ('academia', o.has_academia),
  ('campanas', o.has_campanas)
) as s(key, on_)
where s.on_
on conflict do nothing;

-- Mantener sincronizadas las marcas viejas (las usan reglas de documentos y la sincronización de avisos)
create or replace function public.sync_org_flags() returns trigger
language plpgsql security definer set search_path = public as $$
declare oid uuid := coalesce(new.org_id, old.org_id);
begin
  update public.organizations o set
    has_aviso_medico   = exists (select 1 from public.org_services where org_id = oid and service_key = 'aviso_medico'),
    has_ruta_saludable = exists (select 1 from public.org_services where org_id = oid and service_key = 'ruta_saludable'),
    has_academia       = exists (select 1 from public.org_services where org_id = oid and service_key = 'academia'),
    has_campanas       = exists (select 1 from public.org_services where org_id = oid and service_key = 'campanas')
  where o.id = oid;
  return null;
end;
$$;
drop trigger if exists org_services_sync on public.org_services;
create trigger org_services_sync after insert or delete on public.org_services
  for each row execute function public.sync_org_flags();

alter table public.services enable row level security;
alter table public.org_services enable row level security;
create policy services_read on public.services for select to authenticated using (true);
create policy services_staff_write on public.services for all to authenticated
  using (public.is_idt_staff()) with check (public.is_idt_staff());
create policy org_services_read on public.org_services for select to authenticated
  using (org_id = public.current_org() or public.is_idt_staff());
create policy org_services_staff_write on public.org_services for all to authenticated
  using (public.is_idt_staff()) with check (public.is_idt_staff());

-- ───────────────────────── 3. Lo que NO ve un colaborador
-- Personas: un colaborador se ve solo a sí mismo
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or public.is_idt_staff()
    or (org_id = public.current_org() and public.current_user_type() = 'cliente')
  );

-- Ausencias: solo el cliente (y nunca con permiso "pedidos")
drop policy if exists avisos_read on public.avisos;
create policy avisos_read on public.avisos for select to authenticated
  using (
    public.is_idt_staff()
    or (org_id = public.current_org() and public.current_user_type() = 'cliente' and public.current_permission() <> 'pedidos')
  );

-- Pedidos y accidentes: solo el cliente
drop policy if exists requests_read on public.requests;
create policy requests_read on public.requests for select to authenticated
  using (public.is_idt_staff() or (org_id = public.current_org() and public.current_user_type() = 'cliente'));
drop policy if exists incidents_read on public.incidents;
create policy incidents_read on public.incidents for select to authenticated
  using (public.is_idt_staff() or (org_id = public.current_org() and public.current_user_type() = 'cliente'));

-- Documentos: el colaborador ve solo los generales de servicios contratados (no el certificado de la empresa)
drop policy if exists documents_read on public.documents;
create policy documents_read on public.documents for select to authenticated
  using (
    public.is_idt_staff()
    or (org_id = public.current_org() and public.current_user_type() = 'cliente')
    or (org_id is null and (
      requires_service is null
      or exists (select 1 from public.org_services os where os.org_id = public.current_org() and os.service_key = requires_service)
    ))
  );

drop policy if exists docs_storage_read on storage.objects;
create policy docs_storage_read on storage.objects for select to authenticated
  using (
    bucket_id = 'documentos' and (
      public.is_idt_staff()
      or ((storage.foldername(name))[1] = public.current_org()::text and public.current_user_type() = 'cliente')
      or (storage.foldername(name))[1] = 'general'
    )
  );

-- ───────────────────────── 4. Comunidad
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'borrador' check (status in ('borrador','publicado','archivado')),
  audience text[] not null default '{empresa,comercio}',       -- empresa, comercio, colaborador
  category text not null default 'Salud ocupacional',          -- Salud ocupacional, Seguridad e higiene, RR.HH., Medicina laboral, Campaña de salud, Normativa, Podcast
  format text not null default 'nota' check (format in ('nota','tip','noticia','podcast','video','capacitacion')),
  title text not null,
  summary text not null default '',
  body text not null default '',                               -- Markdown
  image_url text,
  media_url text,                                              -- Spotify, YouTube u otro enlace
  sources jsonb not null default '[]'::jsonb,                  -- [{ "title": "...", "url": "..." }]
  author text not null default 'Equipo SaludOcupacional',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (audience <@ array['empresa','comercio','colaborador']::text[] and cardinality(audience) > 0)
);
create index if not exists posts_status_idx on public.posts (status, published_at desc);
drop trigger if exists posts_touch on public.posts;
create trigger posts_touch before update on public.posts
  for each row execute function public.touch_updated_at();

-- A qué público pertenece quien está mirando
create or replace function public.current_audience() returns text
language sql stable security definer set search_path = public as $$
  select case
    when p.user_type = 'colaborador' then 'colaborador'
    else coalesce(o.kind, 'empresa')
  end
  from public.profiles p left join public.organizations o on o.id = p.org_id
  where p.id = auth.uid()
$$;

alter table public.posts enable row level security;
create policy posts_read on public.posts for select to authenticated
  using (public.is_idt_staff() or (status = 'publicado' and public.current_audience() = any(audience)));
create policy posts_staff_write on public.posts for all to authenticated
  using (public.is_idt_staff()) with check (public.is_idt_staff());
