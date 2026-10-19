# Portal SaludOcupacional

Portal de clientes con usuario y contraseña: cada empresa o comercio ve solo su información.

**Stack:** Next.js 15 (TypeScript) · Supabase (PostgreSQL, Auth, Storage, seguridad por filas) · Vercel · Google Sheets API para Aviso Médico.

## Qué hace

| Pantalla | Para quién | Qué permite |
| --- | --- | --- |
| Inicio | Empresa / comercio | Pedidos en curso, servicios contratados, campaña del mes, novedades, ausencias si tiene Aviso Médico |
| Gestiones | Empresa / comercio | Pedir exámenes, turnos y prestaciones; ver el estado de cada pedido |
| Accidentes y EP | Empresa / comercio | Teléfonos, pasos a seguir y registro del caso |
| Documentos | Empresa / comercio | Su certificado de servicio, kits y campañas (solo lo propio y lo contratado) |
| Historia clínica | Empresa / comercio | Acceso a la intranet de IDT |
| Academia, Equipo, Sedes | Empresa / comercio | Información y contacto directo |
| Usuarios | Administrador de la empresa | Invitar personas con permisos |
| Ausencias | Solo con Aviso Médico | Avisos sincronizados desde Google Sheets, sin diagnóstico |
| Administración IDT (`/admin`) | Personal de IDT | Alta de organizaciones, invitaciones, estado de pedidos, documentos, sincronización |

Permisos de usuario: **Administra** (todo + invita), **Ve todo**, **Solo pedidos** (no ve ausencias), **Solo reportes** (no hace pedidos).

## Puesta en marcha

### 1. Base de datos (Supabase → SQL Editor)
1. Pegar y ejecutar `supabase/migrations/0001_portal.sql`.
2. Pegar y ejecutar `supabase/seed.sql` (equipo IDT, novedades y dos organizaciones de demostración).

### 2. Autenticación (Supabase → Authentication)
- **URL Configuration → Site URL:** la dirección del portal (`http://localhost:3000` para probar, después `https://app.saludocupacional.com.ar`).
- **Redirect URLs:** agregar `http://localhost:3000/**` y `https://app.saludocupacional.com.ar/**`.
- **Sign In / Providers → Email:** desactivar "Allow new users to sign up". Solo se entra por invitación.
- **Email Templates → Invite user**, reemplazar el enlace por:
  `<a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=invite">Crear mi contraseña</a>`
- **Email Templates → Reset Password**, reemplazar el enlace por:
  `<a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=recovery">Crear una contraseña nueva</a>`
- **SMTP propio (obligatorio para clientes reales):** el correo incluido en Supabase solo envía a miembros del equipo de Supabase y pocos por hora. Configurar en **Authentication → Emails → SMTP Settings** un proveedor (Google Workspace, Resend, Brevo) con remitente `portal@saludocupacional.com.ar`.

### 3. Variables de entorno
Copiar `.env.example` como `.env.local` y completar con Supabase → **Project Settings → API Keys** (URL, clave pública y clave secreta).

### 4. Probar en esta PC
```
npm install
npm run dev
```
Abrir http://localhost:3000. Para crear el primer usuario de IDT:
```
npm run invitar-staff -- tu-correo@idtsalud.com.ar "Nombre Apellido"
```
Llega un correo para crear la contraseña. Con ese usuario se entra a `/admin`, se crean las organizaciones y se invita a cada cliente.

### 5. Publicar (GitHub + Vercel + Cloudflare)
1. Subir este proyecto a un repositorio privado de GitHub.
2. En Vercel: **Add New → Project**, importar el repositorio. Cargar las mismas variables de `.env.local` (con `NEXT_PUBLIC_SITE_URL=https://app.saludocupacional.com.ar`).
3. En Vercel → **Settings → Domains**, agregar `app.saludocupacional.com.ar`. Vercel indica un registro CNAME.
4. En Cloudflare → DNS, crear ese CNAME `app` apuntando a `cname.vercel-dns.com`, con el proxy **apagado** (nube gris).

### 6. Aviso Médico (Google Sheets)
1. En Google Cloud: crear un proyecto, habilitar **Google Sheets API**, crear una **cuenta de servicio** y descargar su clave JSON.
2. Compartir la planilla de avisos con el correo de la cuenta de servicio, **solo lectura**.
3. Cargar en Vercel `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `AVISOS_SHEET_ID`, `AVISOS_SHEET_RANGE` y `CRON_SECRET`.
4. Revisar en `src/lib/avisos-config.ts` que los encabezados coincidan con los de la planilla.
5. En `/admin`, en cada organización con Aviso Médico, completar **Nombre en la planilla** exactamente como figura en la columna Empresa.

La sincronización corre sola al abrir Ausencias (cada 10 minutos como máximo), una vez por día por la tarea programada de Vercel, y a pedido desde `/admin`. Solo se guardan colaborador, fecha, días, certificado y estado: nunca el diagnóstico.

## Seguridad
- Cada tabla tiene seguridad por filas (RLS): una empresa no puede leer datos de otra aunque manipule la aplicación.
- Los documentos están en un bucket privado; se descargan con enlaces temporales de 60 segundos.
- La clave secreta de Supabase y la de Google solo existen en el servidor.
- Pendiente legal: validar con un abogado el tratamiento de datos de salud (Ley 25.326) y el alojamiento en EE. UU.
