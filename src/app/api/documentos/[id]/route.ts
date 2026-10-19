import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Descarga: verifica con la sesión del usuario que puede ver el documento y redirige a un enlace temporal. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: doc } = await supabase.from("documents").select("storage_path").eq("id", id).single();
  if (!doc) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const { data, error } = await supabase.storage.from("documentos").createSignedUrl(doc.storage_path, 60, { download: true });
  if (error || !data) return NextResponse.json({ error: "No disponible" }, { status: 404 });
  return NextResponse.redirect(data.signedUrl);
}
