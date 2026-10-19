// Invita a una persona del equipo IDT con acceso de administración.
// Uso: npm run invitar-staff -- correo@idtsalud.com.ar "Nombre Apellido"
// Lee NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY de .env.local.
import { createClient } from "@supabase/supabase-js";

const [email, fullName = ""] = process.argv.slice(2);
if (!email) {
  console.error('Uso: npm run invitar-staff -- correo@idtsalud.com.ar "Nombre Apellido"');
  process.exit(1);
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
  data: { full_name: fullName, role_title: "Equipo IDT", permission: "admin" },
  redirectTo: `${site}/auth/aceptar?next=/auth/nueva-clave`,
});
if (error) {
  console.error("No se pudo invitar:", error.message);
  process.exit(1);
}
const userId = data.user.id;
await admin.auth.admin.updateUserById(userId, { app_metadata: { is_idt_staff: true } });
const { error: pErr } = await admin.from("profiles").update({ is_idt_staff: true, full_name: fullName }).eq("id", userId);
if (pErr) {
  console.error("Invitación enviada, pero no se pudo marcar como personal IDT:", pErr.message);
  process.exit(1);
}
console.log(`Listo: se envió la invitación a ${email} con acceso de Administración IDT.`);
