import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type InviteInput = {
  email: string;
  fullName: string;
  roleTitle: string;
  permission: "admin" | "todo" | "pedidos" | "reportes";
  orgId: string;
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
    },
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/auth/nueva-clave`,
  });
  return { error };
}

export const PERMISSIONS: Record<string, string> = {
  admin: "Administra (invita usuarios)",
  todo: "Ve todo y hace pedidos",
  pedidos: "Solo pedidos",
  reportes: "Solo reportes",
};
