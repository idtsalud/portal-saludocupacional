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

export const PERMISSIONS: Record<string, string> = {
  admin: "Administra (invita usuarios)",
  todo: "Ve todo",
  pedidos: "Sin ausencias",
  reportes: "Solo reportes",
};

export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
