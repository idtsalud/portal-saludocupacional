-- Datos iniciales: equipo IDT, novedades y dos organizaciones de demostración.
-- Las organizaciones demo se pueden borrar cuando se carguen las reales.

insert into public.team_contacts (name, role, description, whatsapp, sort) values
  ('Jessica', 'Coordinadora de exámenes médicos', 'Turnos, preocupacionales, periódicos y resultados', '5491126320855', 1),
  ('Laura', 'Referente de cuentas corporativas', 'Tu cuenta, tu plan y lo que necesites sumar', '5491126320855', 2),
  ('Matías', 'Referente comercial', 'Planes, presupuestos y servicios nuevos', '5491126320855', 3),
  ('Dr. Fernando Suri', 'Director médico', 'Criterios médicos y casos complejos', null, 4),
  ('Dr. Francisco Bianchi', 'Dirección médica', 'Seguimiento médico de licencias y accidentes', null, 5);

insert into public.news (title, body) values
  ('Bienvenidos al nuevo portal', 'Desde acá pueden pedir exámenes, seguir cada pedido, descargar documentos y hablar con su equipo IDT.'),
  ('Academia IDT', 'Capacitaciones en el aula de Campana, in company u online, con certificado firmado por el médico del trabajo.');

insert into public.organizations (name, kind, plan, plan_units, staff_count, has_aviso_medico, has_ruta_saludable, has_academia, has_campanas, sheet_company_key)
values
  ('Empresa de demostración', 'empresa', 'Plan Integral', 30, 85, true, true, true, true, 'DEMO EMPRESA'),
  ('Comercio de demostración', 'comercio', 'Plan Comercio', 15, 8, false, false, false, false, null);
