import { notFound } from "next/navigation";
import { PostView } from "@/components/Posts";
import { requireOrg } from "@/lib/session";
import { POST_FIELDS, type Post } from "@/lib/posts";

export default async function Nota({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, org } = await requireOrg();
  const { data } = await supabase.from("posts").select(POST_FIELDS).eq("id", id).eq("status", "publicado").contains("audience", [org.kind]).maybeSingle();
  if (!data) notFound();
  return <PostView post={data as Post} back="/comunidad" />;
}
