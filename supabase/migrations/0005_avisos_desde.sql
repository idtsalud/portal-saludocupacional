-- Fecha desde la que se toman los avisos de la planilla para cada cliente.
-- Los anteriores (por ejemplo, pruebas cargadas antes de que el cliente empiece) se ignoran.
alter table public.organizations add column if not exists avisos_desde timestamptz;

-- Refinería Bahía Blanca y Tecmaco: las filas actuales de la planilla son pruebas.
update public.organizations set avisos_desde = '2026-10-21T00:00:00-03:00'
  where name in ('Refinería Bahía Blanca', 'Tecmaco') and avisos_desde is null;
delete from public.avisos a using public.organizations o
  where a.org_id = o.id and o.avisos_desde is not null and a.received_at < o.avisos_desde;
