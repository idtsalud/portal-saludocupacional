"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/session";
import { CATEGORIES, FORMATS } from "@/lib/posts";

const str = (f: FormData, k: string, max = 200) => String(f.get(k) ?? "").trim().slice(0, max);

/** Fuentes: una por línea, "Título | https://..." */
function parseSources(text: string) {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const url = (l.match(/https?:\/\/\S+/) ?? [""])[0];
      const title = l.replace(url, "").replace(/[|\-–:]+\s*$/, "").trim() || url;
      return { title: title.slice(0, 200), url };
    })
    .filter((s) => s.url);
}

const okUrl = (u: string) => (/^https:\/\/\S+$/.test(u) ? u : null);

export async function saveDraft(f: FormData) {
  return savePost(f, "borrador");
}
export async function publishPost(f: FormData) {
  return savePost(f, "publicar");
}
export async function archivePost(f: FormData) {
  return savePost(f, "archivar");
}

async function savePost(f: FormData, accion: "borrador" | "publicar" | "archivar") {
  const { supabase } = await requireStaff();
  const id = str(f, "id");
  const audience = f.getAll("audience").map(String).filter((a) => ["empresa", "comercio", "colaborador"].includes(a));
  const category = str(f, "category");
  const format = str(f, "format");
  const title = str(f, "title", 200);
  if (!title || audience.length === 0 || !CATEGORIES.includes(category) || !(format in FORMATS)) {
    redirect(id ? `/admin/comunidad/${id}?error=datos` : "/admin/comunidad/nueva?error=datos");
  }

  const fields: Record<string, unknown> = {
    title,
    audience,
    category,
    format,
    summary: str(f, "summary", 400),
    body: String(f.get("body") ?? "").slice(0, 20000),
    image_url: okUrl(str(f, "image_url", 1000)),
    media_url: okUrl(str(f, "media_url", 1000)),
    sources: parseSources(String(f.get("sources") ?? "")),
    author: str(f, "author", 120) || "Equipo SaludOcupacional",
  };
  if (accion === "publicar") {
    fields.status = "publicado";
    fields.published_at = new Date().toISOString();
  } else if (accion === "archivar") {
    fields.status = "archivado";
  } else if (accion === "borrador") {
    fields.status = "borrador";
  }

  let postId = id;
  if (id) {
    const { error } = await supabase.from("posts").update(fields).eq("id", id);
    if (error) redirect(`/admin/comunidad/${id}?error=fallo`);
  } else {
    const { data, error } = await supabase.from("posts").insert(fields).select("id").single();
    if (error || !data) redirect("/admin/comunidad/nueva?error=fallo");
    postId = data.id;
  }
  revalidatePath("/admin/comunidad");
  revalidatePath("/comunidad");
  revalidatePath("/colaborador/comunidad");
  redirect(`/admin/comunidad/${postId}?ok=${accion === "publicar" ? "publicado" : "guardado"}`);
}
