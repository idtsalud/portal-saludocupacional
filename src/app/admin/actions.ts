"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/session";
import { inviteUser, PERMISSIONS } from "@/lib/invite";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { PLAN_FIELDS, type Plan } from "@/lib/plans";
import { SERVICE_KEYS } from "@/lib/services";

const str = (f: FormData, k: string, max = 200) => String(f.get(k) ?? "").trim().slice(0, max);

function orgFields(f: FormData) {
  const kind = str(f, "kind");
  const units = parseInt(str(f, "plan_units"), 10);
  const staff = parseInt(str(f, "staff_count"), 10);
  return {
    name: str(f, "name", 160),
    kind: kind === "comercio" ? "comercio" : "empresa",
    plan: str(f, "plan", 80),
    plan_units: Number.isFinite(units) ? units : 15,
    staff_count: Number.isFinite(staff) ? staff : null,
    referente_medico: str(f, "referente_medico", 120) || null,
    sheet_company_key: str(f, "sheet_company_key", 160) || null,
  };
}

/** Reemplaza los servicios habilitados de una organización. */
async function setServices(supabase: Awaited<ReturnType<typeof requireStaff>>["supabase"], orgId: string, keys: string[]) {
  const { data: current } = await supabase.from("org_services").select("service_key").eq("org_id", orgId);
  const now = new Set((current ?? []).map((r) => r.service_key as string));
  const want = new Set(keys);
  const toAdd = [...want].filter((k) => !now.has(k)).map((k) => ({ org_id: orgId, service_key: k }));
  const toRemove = [...now].filter((k) => !want.has(k));
  if (toAdd.length) {
    const { error } = await supabase.from("org_services").insert(toAdd);
    if (error) return error;
  }
  if (toRemove.length) {
    const { error } = await supabase.from("org_services").delete().eq("org_id", orgId).in("service_key", toRemove);
    if (error) return error;
  }
  return null;
}

type Supa = Awaited<ReturnType<typeof requireStaff>>["supabase"];
async function planByKey(supabase: Supa, key: string) {
  const { data } = await supabase.from("plans").select(PLAN_FIELDS).eq("key", key).maybeSingle();
  return data as Plan | null;
}

export async function createOrg(f: FormData) {
  const { supabase } = await requireStaff();
  const preset = await planByKey(supabase, str(f, "preset"));
  if (!preset) redirect("/admin?error=datos");
  const staff = parseInt(str(f, "staff_count"), 10);
  const name = str(f, "name", 160);
  if (!name) redirect("/admin?error=datos");
  const { data, error } = await supabase
    .from("organizations")
    .insert({ name, kind: preset.kind, plan: preset.name, plan_key: preset.key, plan_units: preset.units, staff_count: Number.isFinite(staff) ? staff : null })
    .select("id")
    .single();
  if (error || !data) redirect("/admin?error=fallo");
  if (await setServices(supabase, data.id, preset.services)) redirect(`/admin/org/${data.id}?error=fallo`);
  revalidatePath("/admin");
  redirect(`/admin/org/${data.id}?ok=org`);
}

export async function updateOrgServices(f: FormData) {
  const { supabase } = await requireStaff();
  const id = str(f, "id");
  if (!id) redirect("/admin?error=datos");
  const keys = f.getAll("svc").map(String);
  if (await setServices(supabase, id, keys)) redirect(`/admin/org/${id}?error=fallo`);
  revalidatePath(`/admin/org/${id}`);
  redirect(`/admin/org/${id}?ok=servicios`);
}

export async function applyPreset(f: FormData) {
  const { supabase } = await requireStaff();
  const id = str(f, "id");
  const preset = await planByKey(supabase, str(f, "preset"));
  if (!id || !preset) redirect(`/admin/org/${id}?error=datos`);
  const { error } = await supabase.from("organizations").update({ kind: preset.kind, plan: preset.name, plan_key: preset.key, plan_units: preset.units }).eq("id", id);
  if (error || (await setServices(supabase, id, preset.services))) redirect(`/admin/org/${id}?error=fallo`);
  revalidatePath(`/admin/org/${id}`);
  redirect(`/admin/org/${id}?ok=servicios`);
}

export async function updateOrg(f: FormData) {
  const { supabase } = await requireStaff();
  const id = str(f, "id");
  const fields = orgFields(f);
  if (!id || !fields.name || !fields.plan) redirect(`/admin/org/${id}?error=datos`);
  const { error } = await supabase.from("organizations").update(fields).eq("id", id);
  if (error) redirect(`/admin/org/${id}?error=fallo`);
  revalidatePath(`/admin/org/${id}`);
  redirect(`/admin/org/${id}?ok=org`);
}

export async function inviteToOrg(f: FormData) {
  await requireStaff();
  const orgId = str(f, "org_id");
  const email = str(f, "email").toLowerCase();
  const fullName = str(f, "full_name", 120);
  const permission = str(f, "permission");
  if (!orgId || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !fullName || !(permission in PERMISSIONS)) redirect(`/admin/org/${orgId}?error=datos`);
  const { error } = await inviteUser({ email, fullName, roleTitle: str(f, "role_title", 80), permission: permission as "admin", orgId });
  if (error) redirect(`/admin/org/${orgId}?error=invitar`);
  revalidatePath(`/admin/org/${orgId}`);
  redirect(`/admin/org/${orgId}?ok=invitado`);
}

export async function updateRequestStatus(f: FormData) {
  const { supabase } = await requireStaff();
  const id = Number(str(f, "id"));
  const status = str(f, "status");
  if (!id || !["recibido", "coordinado", "realizado", "resultados", "cancelado"].includes(status)) redirect("/admin/pedidos?error=datos");
  const { error } = await supabase.from("requests").update({ status, status_detail: str(f, "status_detail", 200) || null }).eq("id", id);
  if (error) redirect("/admin/pedidos?error=fallo");
  revalidatePath("/admin/pedidos");
  redirect("/admin/pedidos?ok=estado");
}

const SERVICES = ["aviso_medico", "ruta_saludable", "academia", "campanas"];
const CATEGORIES = ["certificado", "kit", "campana", "programa", "otro"];

export async function uploadDocument(f: FormData) {
  await requireStaff();
  const file = f.get("file");
  const orgId = str(f, "org_id");
  const category = str(f, "category");
  const title = str(f, "title", 160);
  if (!(file instanceof File) || file.size === 0 || !title || !CATEGORIES.includes(category)) redirect("/admin/documentos?error=datos");
  if (file.size > 4 * 1024 * 1024) redirect("/admin/documentos?error=datos");

  const folder = orgId || "general";
  const safeName = file.name.normalize("NFD").replace(/[^\w.-]+/g, "_").slice(-80);
  const path = `${folder}/${Date.now()}-${safeName}`;
  const admin = createAdminClient();
  const { error: upErr } = await admin.storage.from("documentos").upload(path, file, { contentType: file.type || "application/octet-stream" });
  if (upErr) redirect("/admin/documentos?error=fallo");

  const req = str(f, "requires_service");
  const { error } = await admin.from("documents").insert({
    org_id: orgId || null,
    category,
    title,
    description: str(f, "description", 300) || null,
    storage_path: path,
    requires_service: SERVICES.includes(req) ? req : null,
  });
  if (error) redirect("/admin/documentos?error=fallo");
  revalidatePath("/admin/documentos");
  redirect("/admin/documentos?ok=doc");
}

const TEST_EMAIL = /^prueba-[a-z0-9-]+@saludocupacional\.com\.ar$/;

/** Abre el portal como un usuario de prueba (solo correos prueba-…@saludocupacional.com.ar). Cierra la sesión actual. */
export async function loginAsTestUser(f: FormData) {
  await requireStaff();
  const email = str(f, "email").toLowerCase();
  if (!TEST_EMAIL.test(email)) redirect("/admin?error=permiso");
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (error || !data.properties?.hashed_token) redirect("/admin?error=fallo");
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  const { error: e2 } = await supabase.auth.verifyOtp({ type: "magiclink", token_hash: data.properties.hashed_token });
  if (e2) redirect("/login?error=enlace");
  redirect("/");
}

/** Crea o edita un plan. Con "aplicar a clientes", también actualiza a todos los clientes que lo tienen. */
export async function savePlan(f: FormData) {
  const { supabase } = await requireStaff();
  const isNew = str(f, "is_new") === "1";
  const key = isNew
    ? str(f, "name", 60).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")
    : str(f, "key");
  const kind = str(f, "kind") === "comercio" ? "comercio" : "empresa";
  const name = str(f, "name", 80);
  const units = parseInt(str(f, "units"), 10);
  const priceRaw = str(f, "price").replace(/[^\d]/g, "");
  const services = f.getAll("svc").map(String).filter((s) => (SERVICE_KEYS as readonly string[]).includes(s));
  const back = isNew ? "/admin/planes/nuevo" : `/admin/planes/${key}`;
  if (!key || !name || !Number.isFinite(units) || units < 0) redirect(`${back}?error=datos`);

  const row = {
    kind,
    name,
    units,
    price: priceRaw ? Number(priceRaw) : null,
    description: str(f, "description", 400),
    services,
    sort: parseInt(str(f, "sort"), 10) || 0,
    active: f.get("active") === "on",
  };
  const { error } = isNew
    ? await supabase.from("plans").insert({ key, ...row })
    : await supabase.from("plans").update(row).eq("key", key);
  if (error) redirect(`${back}?error=fallo`);

  if (f.get("apply_clients") === "on") {
    const { data: orgs } = await supabase.from("organizations").select("id").eq("plan_key", key);
    for (const o of orgs ?? []) {
      await supabase.from("organizations").update({ kind, plan: name, plan_units: units }).eq("id", o.id);
      if (await setServices(supabase, o.id, services)) redirect(`/admin/planes/${key}?error=fallo`);
    }
  }
  revalidatePath("/admin/planes");
  redirect(`/admin/planes/${key}?ok=plan`);
}
