import { PostList } from "@/components/Posts";
import { requireOrg } from "@/lib/session";
import { POST_FIELDS, type Post } from "@/lib/posts";

export default async function Comunidad() {
  const { supabase, org } = await requireOrg();
  const { data } = await supabase
    .from("posts")
    .select(POST_FIELDS)
    .eq("status", "publicado")
    .contains("audience", [org.kind])
    .order("published_at", { ascending: false })
    .limit(60);

  return (
    <>
      <div className="head">
        <div>
          <h1>Comunidad</h1>
          <p>
            {org.kind === "comercio"
              ? "Notas, tips y podcasts para que tu comercio cuide a su gente y esté en regla."
              : "Notas, novedades normativas, campañas y podcasts sobre salud ocupacional, seguridad e higiene y RR.HH."}
          </p>
        </div>
      </div>
      <PostList posts={(data ?? []) as Post[]} base="/comunidad" empty="Todavía no hay publicaciones. Muy pronto vas a encontrar acá notas y tips." />
    </>
  );
}
