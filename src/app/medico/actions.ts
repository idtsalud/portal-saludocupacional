"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireMedico } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { MEDICAL_STATUS } from "@/lib/medico";

/** El médico registra en qué está el seguimiento de un aviso. La empresa lo ve en su portal. */
export async function updateMedicalStatus(f: FormData) {
  const { user } = await requireMedico();
  const id = Number(f.get("id"));
  const status = String(f.get("medical_status") ?? "");
  const back = String(f.get("back") ?? "/medico").startsWith("/medico") ? String(f.get("back")) : "/medico";
  if (!id || !(status in MEDICAL_STATUS)) redirect(`${back}${back.includes("?") ? "&" : "?"}error=datos`);
  const note = String(f.get("medical_note") ?? "").trim().slice(0, 500) || null;
  const { error } = await createAdminClient()
    .from("avisos")
    .update({ medical_status: status, medical_note: note, medical_updated_at: new Date().toISOString(), medical_updated_by: user.id })
    .eq("id", id);
  if (error) redirect(`${back}${back.includes("?") ? "&" : "?"}error=fallo`);
  revalidatePath("/medico");
  revalidatePath("/ausencias");
  redirect(`${back}${back.includes("?") ? "&" : "?"}ok=estado#aviso-${id}`);
}
