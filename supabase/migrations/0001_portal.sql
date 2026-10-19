-- Portal SaludOcupacional · esquema inicial
-- Regla central: cada usuario pertenece a una organización y solo puede leer los datos de esa organización.
-- El personal de IDT (is_idt_staff) ve todas las organizaciones para operar el portal.

create extension if not exists "pgcrypto";

-- ───────────────────────── Organizaciones (empresas y comercios)
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in ('empresa','comercio')),
  plan text not null,                       -- "Plan Integral", "Plan Comercio", etc.
  plan_units int not null default 15,       -- UP o prestaciones por mes
  staff_count int,
  referente_medico text,                    -- nombre del médico referente asignado
  has_aviso_medico boolean not null default false,
  has_ruta_saludable boolean not null default false,
  has_academia boolean not null default false,
  has_campanas boolean not null default true,
  sheet_company_key text,                   -- cómo figura la empresa en la planilla de Aviso Médico
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index organizations_sheet_key_idx on public.organizations (lower(trim(sheet_company_key))) where sheet_company_key is not null;

-- ───────────────────────── Perfiles (uno por usuario de Supabase Auth)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid references public.organizations(id) on delete set null,
  full_name text not null default '',
  role_title text not null default '',      -- "RR.HH.", "Dueño", "Higiene y Seguridad"
  permission text not null default 'todo' check (permission in ('admin','todo','pedidos','reportes')),
  is_idt_staff boolean not null default false,
  created_at timestamptz not null default now()
);

-- Funciones auxiliares (security definer: leen profiles sin depender de sus propias políticas)
create or replace function public.current_org() returns uuid
language sql stable security definer set search_path = public as $$
  select org_id from public.profiles where id = auth.uid()
$$;

create or replace function public.is_idt_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_idt_staff from public.profiles where id = auth.uid()), false)
$$;

create or replace function public.current_permission() returns text
language sql stable security definer set search_path = public as $$
  select permission from public.profiles where id = auth.uid()
$$;

-- ───────────────────────── Pedidos de exámenes, turnos y prestaciones
create table public.requests (
  id bigint generated always as identity primary key,
  org_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  type text not null,
  collaborator text not null,
  dni text,
  sede text not null,
  preferred_date date,
  note text,
  status text not null default 'recibido' check (status in ('recibido','coordinado','realizado','resultados','cancelado')),
  status_detail text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index requests_org_idx on public.requests (org_id, created_at desc);

-- ───────────────────────── Accidentes y enfermedades profesionales
create table public.incidents (
  id bigint generated always as identity primary key,
  org_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  collaborator text not null,
  occurred_at timestamptz,
  type text not null,
  art_claim text,
  description text,
  status text not null default 'registrado' check (status in ('registrado','en_seguimiento','cerrado')),
  created_at timestamptz not null default now()
);
create index incidents_org_idx on public.incidents (org_id, created_at desc);

-- ───────────────────────── Documentos (archivos en Storage)
-- org_id nulo = documento general para todos (campañas). requires_service limita a quienes lo contrataron.
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade,
  category text not null check (category in ('certificado','kit','campana','programa','otro')),
  title text not null,
  description text,
  storage_path text not null,
  requires_service text check (requires_service in ('aviso_medico','ruta_saludable','academia','campanas')),
  created_at timestamptz not null default now()
);

-- ───────────────────────── Equipo IDT y novedades (contenido general)
create table public.team_contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  description text,
  whatsapp text,       -- solo dígitos, formato internacional: 5491126320855
  email text,
  sort int not null default 0
);

create table public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  published_at timestamptz not null default now()
);

-- ───────────────────────── Avisos de ausencia (los carga solo la sincronización con Google Sheets)
-- No se guarda diagnóstico: solo lo necesario para que RR.HH. gestione.
create table public.avisos (
  id bigint generated always as identity primary key,
  org_id uuid not null references public.organizations(id) on delete cascade,
  external_id text not null unique,          -- identificador de la fila en la planilla
  received_at timestamptz not null,
  collaborator text not null,
  days int,
  certificate_status text,                   -- "Recibido", "Pendiente"
  status text,                               -- "Activo", "Cerrado", "En seguimiento"
  synced_at timestamptz not null default now()
);
create index avisos_org_idx on public.avisos (org_id, received_at desc);

create table public.sync_state (
  id text primary key,
  last_synced_at timestamptz,
  last_error text,
  rows_read int
);
insert into public.sync_state (id) values ('avisos') on conflict do nothing;

-- ───────────────────────── Seguridad por filas (RLS)
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.requests enable row level security;
alter table public.incidents enable row level security;
alter table public.documents enable row level security;
alter table public.team_contacts enable row level security;
alter table public.news enable row level security;
alter table public.avisos enable row level security;
alter table public.sync_state enable row level security;

-- Organizaciones
create policy org_read on public.organizations for select to authenticated
  using (id = public.current_org() or public.is_idt_staff());
create policy org_staff_write on public.organizations for all to authenticated
  using (public.is_idt_staff()) with check (public.is_idt_staff());

-- Perfiles: cada uno ve a las personas de su organización
create policy profiles_read on public.profiles for select to authenticated
  using (id = auth.uid() or org_id = public.current_org() or public.is_idt_staff());
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid() and org_id is not distinct from public.current_org() and is_idt_staff = public.is_idt_staff() and permission = public.current_permission());
create policy profiles_staff_write on public.profiles for all to authenticated
  using (public.is_idt_staff()) with check (public.is_idt_staff());

-- Pedidos
create policy requests_read on public.requests for select to authenticated
  using (org_id = public.current_org() or public.is_idt_staff());
create policy requests_insert on public.requests for insert to authenticated
  with check (org_id = public.current_org() and public.current_permission() in ('admin','todo','pedidos') and created_by = auth.uid());
create policy requests_staff_update on public.requests for update to authenticated
  using (public.is_idt_staff()) with check (public.is_idt_staff());

-- Accidentes
create policy incidents_read on public.incidents for select to authenticated
  using (org_id = public.current_org() or public.is_idt_staff());
create policy incidents_insert on public.incidents for insert to authenticated
  with check (org_id = public.current_org() and public.current_permission() in ('admin','todo','pedidos') and created_by = auth.uid());
create policy incidents_staff_update on public.incidents for update to authenticated
  using (public.is_idt_staff()) with check (public.is_idt_staff());

-- Documentos: los propios, y los generales si se contrató el servicio que piden
create policy documents_read on public.documents for select to authenticated
  using (
    public.is_idt_staff()
    or org_id = public.current_org()
    or (org_id is null and (
      requires_service is null
      or exists (
        select 1 from public.organizations o where o.id = public.current_org() and (
          (requires_service = 'aviso_medico' and o.has_aviso_medico) or
          (requires_service = 'ruta_saludable' and o.has_ruta_saludable) or
          (requires_service = 'academia' and o.has_academia) or
          (requires_service = 'campanas' and o.has_campanas)
        )
      )
    ))
  );
create policy documents_staff_write on public.documents for all to authenticated
  using (public.is_idt_staff()) with check (public.is_idt_staff());

-- Contenido general
create policy team_read on public.team_contacts for select to authenticated using (true);
create policy team_staff_write on public.team_contacts for all to authenticated
  using (public.is_idt_staff()) with check (public.is_idt_staff());
create policy news_read on public.news for select to authenticated using (true);
create policy news_staff_write on public.news for all to authenticated
  using (public.is_idt_staff()) with check (public.is_idt_staff());

-- Avisos: solo lectura para la propia organización (permiso "pedidos" no ve ausencias)
create policy avisos_read on public.avisos for select to authenticated
  using ((org_id = public.current_org() and public.current_permission() <> 'pedidos') or public.is_idt_staff());

create policy sync_state_staff on public.sync_state for select to authenticated using (public.is_idt_staff());

-- ───────────────────────── Perfil automático al crear un usuario
-- Los datos vienen en user_metadata cuando se invita (org_id, full_name, role_title, permission).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, org_id, full_name, role_title, permission, is_idt_staff)
  values (
    new.id,
    nullif(new.raw_user_meta_data->>'org_id','')::uuid,
    coalesce(new.raw_user_meta_data->>'full_name',''),
    coalesce(new.raw_user_meta_data->>'role_title',''),
    coalesce(nullif(new.raw_user_meta_data->>'permission',''),'todo'),
    coalesce((new.raw_app_meta_data->>'is_idt_staff')::boolean, false)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────────────────── Fecha de actualización de pedidos
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
create trigger requests_touch before update on public.requests
  for each row execute function public.touch_updated_at();

-- ───────────────────────── Storage: bucket privado de documentos
-- Rutas: "<org_id>/archivo.pdf" para documentos de una empresa, "general/archivo.pdf" para todos.
insert into storage.buckets (id, name, public) values ('documentos','documentos', false)
  on conflict (id) do nothing;

create policy docs_storage_read on storage.objects for select to authenticated
  using (
    bucket_id = 'documentos' and (
      public.is_idt_staff()
      or (storage.foldername(name))[1] = public.current_org()::text
      or (storage.foldername(name))[1] = 'general'
    )
  );
create policy docs_storage_staff_write on storage.objects for all to authenticated
  using (bucket_id = 'documentos' and public.is_idt_staff())
  with check (bucket_id = 'documentos' and public.is_idt_staff());
