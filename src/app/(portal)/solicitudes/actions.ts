"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireOrg } from "@/lib/session";
import { SERVICE_KEYS } from "@/lib/services";
import { OPEN_STATUSES } from "@/lib/solicitudes";

const canAsk = (permission: string) => ["admin", "todo"].includes(permission);

/** Botón "Sumar" del inicio: deja una solicitud para que IDT contacte al cliente. */
export async function requestService(f: FormData) {
  const { supabase, org, profile, user, has } = await requireOrg();
  const key = String(f.get("service") ?? "");
  if (!(SERVICE_KEYS as readonly string[]).includes(key)) redirect("/?error=datos");
  if (!canAsk(profile.permission)) redirect("/?error=permiso");
  if (has(key as (typeof SERVICE_KEYS)[number])) redirect("/");

  const { data: open } = await supabase
    .from("solicitudes")
    .select("id")
    .eq("org_id", org.id)
    .eq("service_key", key)
    .in("status", OPEN_STATUSES)
    .limit(1);
  if (!open?.length) {
    const { error } = await supabase.from("solicitudes").insert({
      org_id: org.id,
      created_by: user.id,
      kind: "servicio",
      service_key: key,
      message: String(f.get("message") ?? "").trim().slice(0, 1000),
    });
    if (error) redirect("/?error=fallo");
  }
  revalidatePath("/");
  redirect("/?ok=sumar#servicio");
}

/** Problema en el portal o consulta para IDT. */
export async function sendSolicitud(f: FormData) {
  const { supabase, org, profile, user } = await requireOrg();
  const kind = String(f.get("kind") ?? "");
  const message = String(f.get("message") ?? "").trim().slice(0, 2000);
  if (!["problema", "consulta"].includes(kind) || !message) redirect("/solicitudes?error=datos");
  if (!canAsk(profile.permission)) redirect("/solicitudes?error=permiso");
  const { error } = await supabase.from("solicitudes").insert({ org_id: org.id, created_by: user.id, kind, message });
  if (error) redirect("/solicitudes?error=fallo");
  revalidatePath("/solicitudes");
  redirect("/solicitudes?ok=solicitud");
}
