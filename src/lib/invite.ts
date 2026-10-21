import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type InviteInput = {
  email: string;
  fullName: string;
  roleTitle: string;
  permission: "admin" | "todo" | "pedidos" | "reportes";
  orgId: string;
  userType?: "cliente" | "colaborador";
};

/** Invita por correo. El perfil se crea solo con estos datos (trigger handle_new_user). */
export async function inviteUser(input: InviteInput) {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.inviteUserByEmail(input.email, {
    data: {
      org_id: input.orgId,
      full_name: input.fullName,
      role_title: input.roleTitle,
      permission: input.permission,
      user_type: input.userType ?? "cliente",
    },
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/aceptar?next=/auth/nueva-clave`,
  });
  return { error };
}

/** Borra la cuenta de un colaborador (cuando deja de trabajar en la organización). */
export async function deleteUser(userId: string) {
  const admin = createAdminClient();
  return admin.auth.admin.deleteUser(userId);
}

/** Qué puede hacer cada usuario del cliente en el portal. */
export const PERMISSION_INFO: Record<string, { label: string; help: string }> = {
  admin: { label: "Administrador", help: "Ve todo, hace solicitudes a IDT y suma o quita usuarios del portal. Ideal para el dueño o RR.HH." },
  todo: { label: "Gestión completa", help: "Ve todo, incluidas las ausencias del personal, y hace solicitudes a IDT. No puede sumar usuarios." },
  pedidos: { label: "Gestión sin ausencias", help: "Gestiona turnos y estudios, pero no ve las ausencias ni datos de salud del personal. Ideal para un encargado." },
  reportes: { label: "Solo consulta", help: "Solo mira: ausencias, documentos y servicios. No hace pedidos ni solicitudes." },
};

/** El colaborador (o empleado, en un comercio) solo ve su espacio de salud. */
export const collaboratorRole = (comercio: boolean) => ({
  label: comercio ? "Empleado" : "Colaborador",
  help: "Solo ve su espacio de salud: aviso médico, turnos, telemedicina y beneficios. No ve datos del negocio ni de sus compañeros.",
});

/** Etiqueta del rol de una persona, sea colaborador o parte del equipo que administra. */
export const roleLabel = (p: { user_type: string; permission: string }, comercio: boolean) =>
  p.user_type === "colaborador" ? collaboratorRole(comercio).label : PERMISSION_INFO[p.permission]?.label ?? p.permission;

export const PERMISSIONS: Record<string, string> =Object.fromEntries(Object.entries(PERMISSION_INFO).map(([k, v]) => [k, v.label]));

export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
