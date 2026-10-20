import { notFound } from "next/navigation";
import { PostView } from "@/components/Posts";
import { requireColaborador } from "@/lib/session";
import { POST_FIELDS, type Post } from "@/lib/posts";

export default async function NotaColaborador({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireColaborador();
  const { data } = await supabase.from("posts").select(POST_FIELDS).eq("id", id).eq("status", "publicado").contains("audience", ["colaborador"]).maybeSingle();
  if (!data) notFound();
  return <PostView post={data as Post} back="/colaborador/comunidad" />;
}
