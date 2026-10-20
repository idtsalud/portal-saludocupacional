import Link from "next/link";
import { notFound } from "next/navigation";
import { Flash } from "@/components/Flash";
import { PostView } from "@/components/Posts";
import { requireStaff } from "@/lib/session";
import { POST_FIELDS, type Post } from "@/lib/posts";
import { PostForm } from "../PostForm";

export default async function EditarPublicacion({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const { supabase } = await requireStaff();
  const { data } = await supabase.from("posts").select(POST_FIELDS).eq("id", id).maybeSingle();
  if (!data) notFound();
  const post = data as Post;

  return (
    <>
      <div className="head">
        <div>
          <Link href={`/admin/comunidad?estado=${post.status}`} className="small">← Volver a la lista</Link>
          <h1 style={{ marginTop: 6 }}>{post.title}</h1>
          <p><span className={"status " + post.status}>{post.status}</span></p>
        </div>
      </div>
      <Flash ok={sp.ok} error={sp.error} />
      <div className="split">
        <section className="card"><PostForm post={post} /></section>
        <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
          <p className="small muted">Así se ve en el portal:</p>
          <PostView post={post} back={`/admin/comunidad?estado=${post.status}`} />
        </div>
      </div>
    </>
  );
}
