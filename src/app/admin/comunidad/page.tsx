import Link from "next/link";
import { requireStaff } from "@/lib/session";
import { fmtDate } from "@/lib/format";
import { AUDIENCES, FORMATS, type Post } from "@/lib/posts";

const TABS = [
  ["borrador", "Borradores para revisar"],
  ["publicado", "Publicados"],
  ["archivado", "Archivados"],
] as const;

export default async function AdminComunidad({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const estado = TABS.some(([k]) => k === sp.estado) ? sp.estado! : "borrador";
  const { supabase } = await requireStaff();
  const [{ data: posts }, ...counts] = await Promise.all([
    supabase.from("posts").select("id, status, audience, category, format, title, summary, created_at, published_at").eq("status", estado).order("created_at", { ascending: false }).limit(200),
    ...TABS.map(([k]) => supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", k)),
  ]);

  return (
    <>
      <div className="head">
        <div>
          <h1>Comunidad</h1>
          <p>Revisá los borradores, corregí lo que haga falta y publicá. Nada se ve en el portal hasta que lo publicás.</p>
        </div>
        <Link className="btn pri" href="/admin/comunidad/nueva">Nueva publicación</Link>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {TABS.map(([k, label], i) => (
          <Link key={k} className={"btn " + (k === estado ? "pri" : "sec")} href={`/admin/comunidad?estado=${k}`}>
            {label} ({counts[i].count ?? 0})
          </Link>
        ))}
      </div>
      <section className="card">
        {posts && posts.length > 0 ? (
          <div className="tbl">
            <table>
              <thead><tr><th>Título</th><th>Para</th><th>Categoría</th><th>{estado === "publicado" ? "Publicado" : "Creado"}</th></tr></thead>
              <tbody>
                {(posts as Post[]).map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link href={`/admin/comunidad/${p.id}`}><b>{p.title}</b></Link>
                      <div className="small muted">{FORMATS[p.format]} · {p.summary.slice(0, 120)}</div>
                    </td>
                    <td className="small">{p.audience.map((a) => AUDIENCES[a]).join(", ")}</td>
                    <td className="small">{p.category}</td>
                    <td className="num small">{fmtDate(estado === "publicado" ? p.published_at : p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">No hay publicaciones en esta lista.</p>
        )}
      </section>
    </>
  );
}
