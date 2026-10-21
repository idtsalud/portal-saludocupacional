-- Rol médico de IDT: ve los avisos de todas las empresas y registra su seguimiento.
-- El estado del médico se guarda aparte del estado de la planilla, así la sincronización no lo pisa.

alter table public.profiles add column if not exists is_medico boolean not null default false;

create or replace function public.is_medico() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_medico from public.profiles where id = auth.uid()), false)
$$;

-- Nadie puede darse el rol médico a sí mismo.
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and org_id is not distinct from public.current_org()
    and is_idt_staff = public.is_idt_staff()
    and permission = public.current_permission()
    and user_type = public.current_user_type()
    and is_medico = public.is_medico()
  );

-- Seguimiento médico de cada aviso
alter table public.avisos add column if not exists medical_status text;
alter table public.avisos add column if not exists medical_note text;
alter table public.avisos add column if not exists medical_updated_at timestamptz;
alter table public.avisos add column if not exists medical_updated_by uuid references auth.users(id) on delete set null;

-- Lectura para el médico: avisos, motivos y nombres de las empresas
drop policy if exists avisos_medico_read on public.avisos;
create policy avisos_medico_read on public.avisos for select to authenticated using (public.is_medico());
drop policy if exists aviso_motivos_medico_read on public.aviso_motivos;
create policy aviso_motivos_medico_read on public.aviso_motivos for select to authenticated using (public.is_medico());
drop policy if exists org_medico_read on public.organizations;
create policy org_medico_read on public.organizations for select to authenticated using (public.is_medico());
-- La escritura del seguimiento la hace el servidor después de verificar el rol (no hay política de escritura).
