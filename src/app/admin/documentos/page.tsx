import { Flash } from "@/components/Flash";
import { SubmitButton } from "@/components/SubmitButton";
import { requireStaff } from "@/lib/session";
import { fmtDate } from "@/lib/format";
import { uploadDocument } from "../actions";

export default async function AdminDocumentos({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { supabase } = await requireStaff();
  const [{ data: orgs }, { data: docs }] = await Promise.all([
    supabase.from("organizations").select("id, name").order("name"),
    supabase.from("documents").select("id, title, category, requires_service, created_at, organizations(name)").order("created_at", { ascending: false }).limit(200),
  ]);

  return (
    <>
      <div className="head">
        <h1>Documentos</h1>
        <p>Certificados por empresa, y campañas, kits y programas para todos.</p>
      </div>
      <Flash ok={sp.ok} error={sp.error} />
      <div className="grid g2">
        <section className="card">
          <h2>Subir documento</h2>
          <form className="f" action={uploadDocument}>
            <label htmlFor="org_id">
              Para quién
              <select id="org_id" name="org_id" defaultValue="">
                <option value="">Todos los clientes (general)</option>
                {(orgs ?? []).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </label>
            <div className="two">
              <label htmlFor="category">
                Tipo
                <select id="category" name="category">
                  <option value="certificado">Certificado de servicio</option>
                  <option value="campana">Campaña de salud</option>
                  <option value="kit">Kit</option>
                  <option value="programa">Programa</option>
                  <option value="otro">Otro</option>
                </select>
              </label>
              <label htmlFor="requires_service">
                Solo si contrató
                <select id="requires_service" name="requires_service" defaultValue="">
                  <option value="">Sin requisito</option>
                  <option value="aviso_medico">Aviso Médico</option>
                  <option value="ruta_saludable">Ruta Saludable</option>
                  <option value="academia">Academia</option>
                  <option value="campanas">Campañas</option>
                </select>
              </label>
            </div>
            <label htmlFor="title">Título<input id="title" name="title" required maxLength={160} /></label>
            <label htmlFor="description">Descripción<input id="description" name="description" maxLength={300} /></label>
            <label htmlFor="file">Archivo (hasta 4 MB; PDF o imagen)<input id="file" name="file" type="file" required /></label>
            <SubmitButton>Subir</SubmitButton>
          </form>
        </section>
        <section className="card">
          <h2>Cargados</h2>
          <div className="list">
            {(docs ?? []).map((d) => (
              <div className="li" key={d.id}>
                <div className="grow">
                  <b>{d.title}</b>
                  <span>
                    {(d.organizations as unknown as { name: string } | null)?.name ?? "General"} · {d.category}
                    {d.requires_service ? ` · requiere ${d.requires_service}` : ""} · {fmtDate(d.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
