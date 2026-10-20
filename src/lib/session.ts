import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ServiceKey } from "@/lib/services";

export type Organization = {
  id: string;
  name: string;
  kind: "empresa" | "comercio";
  plan: string;
  plan_units: number;
  staff_count: number | null;
  referente_medico: string | null;
  has_aviso_medico: boolean;
  has_ruta_saludable: boolean;
  has_academia: boolean;
  has_campanas: boolean;
};

export type Profile = {
  id: string;
  org_id: string | null;
  full_name: string;
  role_title: string;
  permission: "admin" | "todo" | "pedidos" | "reportes";
  is_idt_staff: boolean;
  user_type: "cliente" | "colaborador";
};

/** Usuario, perfil y organización de la sesión actual. Redirige al login si no hay sesión. */
export const getSession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, org_id, full_name, role_title, permission, is_idt_staff, user_type")
    .eq("id", user.id)
    .single<Profile>();

  let org: Organization | null = null;
  const services = new Set<string>();
  if (profile?.org_id) {
    const [{ data }, { data: svc }] = await Promise.all([
      supabase
        .from("organizations")
        .select("id, name, kind, plan, plan_units, staff_count, referente_medico, has_aviso_medico, has_ruta_saludable, has_academia, has_campanas")
        .eq("id", profile.org_id)
        .single<Organization>(),
      supabase.from("org_services").select("service_key").eq("org_id", profile.org_id),
    ]);
    org = data;
    (svc ?? []).forEach((s) => services.add(s.service_key as string));
  }

  /** ¿La organización tiene habilitado este servicio? */
  const has = (key: ServiceKey) => services.has(key);

  return { supabase, user, profile, org, services, has };
});

/** Para pantallas de una organización: exige que el usuario tenga una asignada. */
export async function requireOrg() {
  const s = await getSession();
  if (!s.org || !s.profile) {
    if (s.profile?.is_idt_staff) redirect("/admin");
    redirect("/sin-acceso");
  }
  return { ...s, org: s.org, profile: s.profile };
}

export async function requireStaff() {
  const s = await getSession();
  if (!s.profile?.is_idt_staff) redirect("/");
  return { ...s, profile: s.profile };
}

export const canRequest = (p: Profile) => ["admin", "todo", "pedidos"].includes(p.permission);
export const canSeeAbsences = (p: Profile) => p.user_type === "cliente" && p.permission !== "pedidos";
