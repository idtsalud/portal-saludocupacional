import { PostList } from "@/components/Posts";
import { requireColaborador } from "@/lib/session";
import { POST_FIELDS, type Post } from "@/lib/posts";

export default async function ComunidadColaborador() {
  const { supabase } = await requireColaborador();
  const { data } = await supabase
    .from("posts")
    .select(POST_FIELDS)
    .eq("status", "publicado")
    .contains("audience", ["colaborador"])
    .order("published_at", { ascending: false })
    .limit(60);

  return (
    <>
      <div className="head">
        <div>
          <h1>Comunidad</h1>
          <p>Notas y consejos para cuidar tu salud, en el trabajo y fuera de él.</p>
        </div>
      </div>
      <PostList posts={(data ?? []) as Post[]} base="/colaborador/comunidad" empty="Todavía no hay publicaciones. Muy pronto vas a encontrar acá notas para vos." />
    </>
  );
}
