-- Solicitudes de los clientes a IDT: sumar un servicio, avisar un problema en el portal o hacer una consulta.
-- Reemplaza el uso de "requests" (pedidos de turnos) en Administración: los turnos van por WhatsApp.

create table if not exists public.solicitudes (
  id bigint generated always as identity primary key,
  org_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  kind text not null check (kind in ('servicio','problema','consulta')),
  service_key text references public.services(key) on delete set null,
  message text not null default '',
  status text not null default 'nueva' check (status in ('nueva','en_curso','resuelta','descartada')),
  staff_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists solicitudes_org_idx on public.solicitudes (org_id, created_at desc);
create index if not exists solicitudes_status_idx on public.solicitudes (status, created_at desc);

drop trigger if exists solicitudes_touch on public.solicitudes;
create trigger solicitudes_touch before update on public.solicitudes
  for each row execute function public.touch_updated_at();

alter table public.solicitudes enable row level security;

drop policy if exists solicitudes_read on public.solicitudes;
create policy solicitudes_read on public.solicitudes for select to authenticated
  using (public.is_idt_staff() or (org_id = public.current_org() and public.current_user_type() = 'cliente'));

drop policy if exists solicitudes_insert on public.solicitudes;
create policy solicitudes_insert on public.solicitudes for insert to authenticated
  with check (
    org_id = public.current_org()
    and public.current_user_type() = 'cliente'
    and public.current_permission() in ('admin','todo')
    and created_by = auth.uid()
    and status = 'nueva'
    and staff_note is null
  );

drop policy if exists solicitudes_staff_update on public.solicitudes;
create policy solicitudes_staff_update on public.solicitudes for update to authenticated
  using (public.is_idt_staff()) with check (public.is_idt_staff());
