"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { canRequest, requireOrg } from "@/lib/session";

const TYPES = ["Preocupacional", "Examen periódico", "Consulta médica", "Interconsulta con especialista", "Estudio (radiografía, ecografía, audiometría)", "Examen de egreso"];
const SEDES = ["Zárate", "Campana", "Telemedicina"];

export async function createRequest(formData: FormData) {
  const { supabase, org, profile, user } = await requireOrg();
  if (!canRequest(profile)) redirect("/gestiones?error=permiso");

  const type = String(formData.get("type") ?? "");
  const collaborator = String(formData.get("collaborator") ?? "").trim().slice(0, 160);
  const sede = String(formData.get("sede") ?? "");
  if (!TYPES.includes(type) || !SEDES.includes(sede) || !collaborator) redirect("/gestiones?error=datos");

  const preferred = String(formData.get("preferred_date") ?? "");
  const { error } = await supabase.from("requests").insert({
    org_id: org.id,
    created_by: user.id,
    type,
    collaborator,
    dni: String(formData.get("dni") ?? "").replace(/\D/g, "").slice(0, 11) || null,
    sede,
    preferred_date: /^\d{4}-\d{2}-\d{2}$/.test(preferred) ? preferred : null,
    note: String(formData.get("note") ?? "").trim().slice(0, 1000) || null,
  });
  if (error) redirect("/gestiones?error=fallo");

  revalidatePath("/gestiones");
  revalidatePath("/");
  redirect("/gestiones?ok=pedido");
}
