import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente con la clave service_role: saltea la seguridad por filas.
 * Usar solo en el servidor y solo después de verificar permisos del usuario.
 */
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
