import { AUDIENCES, CATEGORIES, FORMATS, type Post } from "@/lib/posts";
import { archivePost, publishPost, saveDraft } from "./actions";

export function PostForm({ post }: { post?: Post }) {
  const p = post;
  return (
    <form className="f" action={saveDraft}>
      {p && <input type="hidden" name="id" value={p.id} />}
      <label htmlFor="title">Título<input id="title" name="title" required maxLength={200} defaultValue={p?.title} /></label>
      <div className="two">
        <label htmlFor="category">
          Categoría
          <select id="category" name="category" defaultValue={p?.category ?? CATEGORIES[0]}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label htmlFor="format">
          Formato
          <select id="format" name="format" defaultValue={p?.format ?? "nota"}>
            {Object.entries(FORMATS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
      </div>
      <fieldset style={{ border: 0, padding: 0, margin: 0, display: "flex", flexWrap: "wrap", gap: 16 }}>
        <legend className="small muted" style={{ fontWeight: 600, marginBottom: 6 }}>Para quién</legend>
        {Object.entries(AUDIENCES).map(([k, v]) => (
          <label className="check" key={k}>
            <input type="checkbox" name="audience" value={k} defaultChecked={p ? p.audience.includes(k as never) : k !== "colaborador"} /> {v}
          </label>
        ))}
      </fieldset>
      <label htmlFor="summary">Resumen (1 o 2 frases)<textarea id="summary" name="summary" rows={2} maxLength={400} defaultValue={p?.summary} /></label>
      <label htmlFor="body">
        Cuerpo de la nota
        <textarea id="body" name="body" rows={16} defaultValue={p?.body} placeholder={"Párrafos separados por una línea en blanco.\n## Subtítulo\n- Punto de una lista\n**negrita** y [enlace](https://...)"} />
      </label>
      <div className="two">
        <label htmlFor="image_url">Imagen (enlace https)<input id="image_url" name="image_url" defaultValue={p?.image_url ?? ""} placeholder="Si queda vacío, se usa una portada de la marca" /></label>
        <label htmlFor="media_url">Spotify o YouTube (opcional)<input id="media_url" name="media_url" defaultValue={p?.media_url ?? ""} placeholder="https://open.spotify.com/episode/..." /></label>
      </div>
      <label htmlFor="sources">
        Fuentes (una por línea: Título | enlace)
        <textarea id="sources" name="sources" rows={4} defaultValue={p?.sources.map((s) => `${s.title} | ${s.url}`).join("\n")} />
      </label>
      <label htmlFor="author">Autor<input id="author" name="author" defaultValue={p?.author ?? "Equipo SaludOcupacional"} maxLength={120} /></label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <button className="btn sec" type="submit" formAction={saveDraft}>Guardar borrador</button>
        <button className="btn pri" type="submit" formAction={publishPost}>{p?.status === "publicado" ? "Guardar y mantener publicado" : "Publicar"}</button>
        {p && p.status !== "archivado" && (
          <button className="btn ghost" type="submit" formAction={archivePost} style={{ color: "var(--danger)" }}>Archivar</button>
        )}
      </div>
    </form>
  );
}
