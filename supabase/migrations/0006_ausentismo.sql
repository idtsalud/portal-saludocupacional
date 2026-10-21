-- Dashboard de ausentismo: trazabilidad completa de cada aviso que llega de la planilla de Aviso Médico.

alter table public.avisos add column if not exists notified_employer boolean;  -- avisó a su supervisor / empresa
alter table public.avisos add column if not exists consulted_doctor boolean;   -- consultó con el médico
alter table public.avisos add column if not exists rest_from date;             -- reposo desde
alter table public.avisos add column if not exists rest_to date;               -- reposo hasta

-- El motivo es un dato de salud: se guarda aparte y la empresa lo ve solo si IDT lo habilita para ese cliente.
alter table public.organizations add column if not exists show_motivo boolean not null default false;

create table if not exists public.aviso_motivos (
  aviso_id bigint primary key references public.avisos(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  motivo text not null
);
create index if not exists aviso_motivos_org_idx on public.aviso_motivos (org_id);

alter table public.aviso_motivos enable row level security;

drop policy if exists aviso_motivos_read on public.aviso_motivos;
create policy aviso_motivos_read on public.aviso_motivos for select to authenticated
  using (
    public.is_idt_staff()
    or (
      org_id = public.current_org()
      and public.current_user_type() = 'cliente'
      and public.current_permission() <> 'pedidos'
      and exists (select 1 from public.organizations o where o.id = aviso_motivos.org_id and o.show_motivo)
    )
  );
-- Solo escribe la sincronización (clave de servicio): no hay políticas de escritura.
