-- Ficha administrativa de cada cliente (solo personal de IDT) y logo visible en su portal.

alter table public.organizations add column if not exists logo_url text;

create table if not exists public.org_admin (
  org_id uuid primary key references public.organizations(id) on delete cascade,
  status text not null default 'activo' check (status in ('activo','bonificado','baja')),
  cuit text,
  monthly_price numeric(14,2),          -- valor mensual actual, sin IVA
  discount_pct numeric(5,2),
  billing_mode text,                    -- factura adelantada, factura vencida, orden de compra…
  purchase_order text,                  -- número y vigencia de la OC
  invoicing_entity text,                -- quién factura (ITO Zárate, FOB…)
  vigencia text,                        -- período o vigencia del servicio
  next_due date,                        -- próximo vencimiento (contrato, OC o actualización)
  referentes text,
  emails text,
  service_detail text,                  -- servicio contratado según la planilla
  consult_limit text,                   -- límite de consultas: "hasta 10", "sin límite"…
  notes text,
  updated_at timestamptz not null default now()
);

drop trigger if exists org_admin_touch on public.org_admin;
create trigger org_admin_touch before update on public.org_admin
  for each row execute function public.touch_updated_at();

alter table public.org_admin enable row level security;
drop policy if exists org_admin_staff on public.org_admin;
create policy org_admin_staff on public.org_admin for all to authenticated
  using (public.is_idt_staff()) with check (public.is_idt_staff());

-- Logos: carpeta pública (los ve cada cliente arriba en su portal).
insert into storage.buckets (id, name, public) values ('logos', 'logos', true) on conflict (id) do nothing;
drop policy if exists logos_staff_write on storage.objects;
create policy logos_staff_write on storage.objects for all to authenticated
  using (bucket_id = 'logos' and public.is_idt_staff()) with check (bucket_id = 'logos' and public.is_idt_staff());
