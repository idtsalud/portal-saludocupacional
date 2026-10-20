-- Portal SaludOcupacional · 0003
-- 1) Planes administrables desde el portal (servicios, UP y precio).
-- 2) Avisos: dato de reposo indicado (SI/NO) que viene de la planilla de Aviso Médico.

create table if not exists public.plans (
  key text primary key,
  kind text not null check (kind in ('empresa','comercio')),
  name text not null,
  units int not null default 15,
  price numeric(12,2),                 -- precio mensual sin IVA; nulo = a medida
  description text not null default '',
  services text[] not null default '{}',
  sort int not null default 0,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.plans (key, kind, name, units, price, description, services, sort) values
  ('comercio', 'comercio', 'Plan Comercio', 15, 99900,
   'Médico laboral, sedes y seguimiento de licencias para el día a día del comercio.',
   array['medico_referente','atencion_sedes','telemedicina','precio_preferencial','licencias_accidentes','campanas'], 10),
  ('comercio_plus', 'comercio', 'Plan Comercio Plus', 15, 159900,
   'Todo lo del Plan Comercio, más Aviso Médico por WhatsApp para los empleados y Academia IDT.',
   array['medico_referente','atencion_sedes','telemedicina','precio_preferencial','licencias_accidentes','campanas','aviso_medico','academia'], 20),
  ('esencial', 'empresa', 'Plan Esencial', 15, 330000,
   'Servicio de Medicina del Trabajo de referencia para empresas de hasta 30 personas.',
   array['medico_referente','atencion_sedes','telemedicina','precio_preferencial','licencias_accidentes'], 30),
  ('integral', 'empresa', 'Plan Integral', 30, 540000,
   'Más capacidad de atención, campañas de prevención y Ruta Saludable.',
   array['medico_referente','atencion_sedes','telemedicina','precio_preferencial','licencias_accidentes','campanas','ruta_saludable'], 40),
  ('corporativo', 'empresa', 'Plan Corporativo', 60, null,
   'A medida para más de 100 personas: Aviso Médico con IA, Academia, Medicheck y capacitaciones.',
   array['medico_referente','atencion_sedes','telemedicina','precio_preferencial','licencias_accidentes','campanas','ruta_saludable','aviso_medico','academia','medicheck','capacitaciones'], 50)
on conflict (key) do nothing;

drop trigger if exists plans_touch on public.plans;
create trigger plans_touch before update on public.plans
  for each row execute function public.touch_updated_at();

alter table public.organizations add column if not exists plan_key text references public.plans(key) on delete set null;
update public.organizations o set plan_key = p.key from public.plans p where o.plan_key is null and o.plan = p.name;

alter table public.plans enable row level security;
drop policy if exists plans_read on public.plans;
create policy plans_read on public.plans for select to authenticated using (true);
drop policy if exists plans_staff_write on public.plans;
create policy plans_staff_write on public.plans for all to authenticated
  using (public.is_idt_staff()) with check (public.is_idt_staff());

alter table public.avisos add column if not exists rest_indicated boolean;
