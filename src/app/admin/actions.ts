"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/session";
import { inviteUser, PERMISSIONS } from "@/lib/invite";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLAN_FIELDS, type Plan } from "@/lib/plans";
import { SERVICE_KEYS } from "@/lib/services";
import { SOLICITUD_STATUS } from "@/lib/solicitudes";

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
    avisos_desde: /^\d{4}-\d{2}-\d{2}$/.test(str(f, "avisos_desde")) ? `${str(f, "avisos_desde")}T00:00:00-03:00` : null,
    show_motivo: f.get("show_motivo") === "on",
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
  const adminEmail = str(f, "admin_email").toLowerCase();
  const adminName = str(f, "admin_name", 120);
  if (!name || (adminEmail && (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(adminEmail) || !adminName))) redirect("/admin?error=datos#nuevo");
  const { data, error } = await supabase
    .from("organizations")
    .insert({ name, kind: preset.kind, plan: preset.name, plan_key: preset.key, plan_units: preset.units, staff_count: Number.isFinite(staff) ? staff : null, sheet_company_key: f.get("aviso_medico") === "on" ? name : null, show_motivo: true })
    .select("id")
    .single();
  if (error || !data) redirect("/admin?error=fallo");
  const services = f.get("aviso_medico") === "on" ? [...new Set([...preset.services, "aviso_medico"])] : preset.services;
  if (await setServices(supabase, data.id, services)) redirect(`/admin/org/${data.id}?error=fallo`);
  if (adminEmail) {
    const { error: e2 } = await inviteUser({ email: adminEmail, fullName: adminName, roleTitle: str(f, "admin_role", 80), permission: "admin", orgId: data.id });
    if (e2) redirect(`/admin/org/${data.id}?error=invitar`);
  }
  revalidatePath("/admin");
  redirect(`/admin/org/${data.id}?ok=${adminEmail ? "cliente_invitado" : "cliente"}`);
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
  // Avisos ya cargados que quedan antes de la fecha de inicio: se borran del portal.
  if (fields.avisos_desde) await createAdminClient().from("avisos").delete().eq("org_id", id).lt("received_at", fields.avisos_desde);
  revalidatePath(`/admin/org/${id}`);
  redirect(`/admin/org/${id}?ok=org`);
}

export async function inviteToOrg(f: FormData) {
  await requireStaff();
  const orgId = str(f, "org_id");
  const email = str(f, "email").toLowerCase();
  const fullName = str(f, "full_name", 120);
  const permission = str(f, "permission");
  const colaborador = permission === "colaborador";
  if (!orgId || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !fullName || !(colaborador || permission in PERMISSIONS)) redirect(`/admin/org/${orgId}?error=datos`);
  const { error } = await inviteUser({
    email,
    fullName,
    roleTitle: str(f, "role_title", 80),
    permission: colaborador ? "todo" : (permission as "admin"),
    orgId,
    userType: colaborador ? "colaborador" : "cliente",
  });
  if (error) redirect(`/admin/org/${orgId}?error=invitar`);
  revalidatePath(`/admin/org/${orgId}`);
  redirect(`/admin/org/${orgId}?ok=invitado`);
}

export async function updateSolicitud(f: FormData) {
  const { supabase } = await requireStaff();
  const id = Number(str(f, "id"));
  const status = str(f, "status");
  if (!id || !(status in SOLICITUD_STATUS)) redirect("/admin/solicitudes?error=datos");
  const { error } = await supabase.from("solicitudes").update({ status, staff_note: str(f, "staff_note", 500) || null }).eq("id", id);
  if (error) redirect("/admin/solicitudes?error=fallo");
  revalidatePath("/admin/solicitudes");
  redirect("/admin/solicitudes?ok=estado");
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

/** Vistas del portal que puede abrir el personal de IDT, sobre las organizaciones de demostración. */
const STAFF_VIEWS: Record<string, { org: string; userType: "cliente" | "colaborador"; home: string }> = {
  empresa: { org: "Empresa de demostración", userType: "cliente", home: "/" },
  comercio: { org: "Comercio de demostración", userType: "cliente", home: "/" },
  colaborador_empresa: { org: "Empresa de demostración", userType: "colaborador", home: "/colaborador" },
  colaborador_comercio: { org: "Comercio de demostración", userType: "colaborador", home: "/colaborador" },
};

/** Cambia la vista del portal del personal de IDT (empresa, comercio o colaborador) sin cerrar la sesión. */
export async function setStaffView(f: FormData) {
  const { profile } = await requireStaff();
  const view = STAFF_VIEWS[str(f, "view")];
  if (!view) redirect("/admin?error=datos");
  const admin = createAdminClient();
  const { data: org } = await admin.from("organizations").select("id").eq("name", view.org).maybeSingle();
  if (!org) redirect("/admin?error=fallo");
  const { error } = await admin.from("profiles").update({ org_id: org.id, user_type: view.userType, permission: "admin" }).eq("id", profile.id).eq("is_idt_staff", true);
  if (error) redirect("/admin?error=fallo");
  revalidatePath("/", "layout");
  redirect(view.home);
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

const num = (v: string) => {
  const t = v.replace(/[^\d,.-]/g, "");
  if (!t) return null;
  // "154.688" o "154.688,50" (formato argentino) o "154688.5"
  const n = /,\d{1,2}$/.test(t) ? Number(t.replace(/\./g, "").replace(",", ".")) : /\.\d{3}(\.|$)/.test(t) ? Number(t.replace(/\./g, "")) : Number(t.replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

/** Guarda la ficha administrativa (solo IDT) de un cliente. */
export async function updateOrgAdmin(f: FormData) {
  const { supabase } = await requireStaff();
  const orgId = str(f, "org_id");
  const status = str(f, "status");
  if (!orgId || !["activo", "bonificado", "baja"].includes(status)) redirect(`/admin/org/${orgId}?error=datos#ficha`);
  const due = str(f, "next_due");
  const { error } = await supabase.from("org_admin").upsert({
    org_id: orgId,
    status,
    cuit: str(f, "cuit", 20) || null,
    monthly_price: num(str(f, "monthly_price", 30)),
    discount_pct: num(str(f, "discount_pct", 10)),
    billing_mode: str(f, "billing_mode", 200) || null,
    purchase_order: str(f, "purchase_order", 200) || null,
    invoicing_entity: str(f, "invoicing_entity", 120) || null,
    vigencia: str(f, "vigencia", 200) || null,
    next_due: /^\d{4}-\d{2}-\d{2}$/.test(due) ? due : null,
    referentes: str(f, "referentes", 400) || null,
    emails: str(f, "emails", 600) || null,
    service_detail: str(f, "service_detail", 400) || null,
    consult_limit: str(f, "consult_limit", 80) || null,
    notes: str(f, "notes", 2000) || null,
  });
  if (error) redirect(`/admin/org/${orgId}?error=fallo#ficha`);
  revalidatePath(`/admin/org/${orgId}`);
  revalidatePath("/admin");
  redirect(`/admin/org/${orgId}?ok=guardado#ficha`);
}

/** Sube el logo del cliente a la carpeta pública de logos. */
export async function uploadLogo(f: FormData) {
  await requireStaff();
  const orgId = str(f, "org_id");
  const file = f.get("logo");
  if (!orgId || !(file instanceof File) || file.size === 0 || file.size > 2 * 1024 * 1024 || !/^image\//.test(file.type)) redirect(`/admin/org/${orgId}?error=datos#ficha`);
  const ext = (file.name.split(".").pop() ?? "png").toLowerCase().replace(/[^a-z]/g, "") || "png";
  const path = `${orgId}/logo-${Date.now()}.${ext}`;
  const admin = createAdminClient();
  const { error } = await admin.storage.from("logos").upload(path, file, { contentType: file.type, upsert: true });
  if (error) redirect(`/admin/org/${orgId}?error=fallo#ficha`);
  const url = admin.storage.from("logos").getPublicUrl(path).data.publicUrl;
  await admin.from("organizations").update({ logo_url: url }).eq("id", orgId);
  revalidatePath(`/admin/org/${orgId}`);
  revalidatePath("/", "layout");
  redirect(`/admin/org/${orgId}?ok=guardado#ficha`);
}
