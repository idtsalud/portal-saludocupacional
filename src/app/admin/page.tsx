import Link from "next/link";
import { Flash } from "@/components/Flash";
import { SubmitButton } from "@/components/SubmitButton";
import { requireStaff } from "@/lib/session";
import { fmtDateTime } from "@/lib/format";
import { createOrg, runSync } from "./actions";
import { OrgFields } from "./OrgFields";

export default async function AdminHome({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { supabase } = await requireStaff();
  const [{ data: orgs }, { data: sync }] = await Promise.all([
    supabase.from("organizations").select("id, name, kind, plan, staff_count, has_aviso_medico, active").order("name"),
    supabase.from("sync_state").select("last_synced_at, last_error, rows_read").eq("id", "avisos").single(),
  ]);

  return (
    <>
      <div className="head">
        <h1>Organizaciones</h1>
        <p>Empresas y comercios con acceso al portal.</p>
      </div>
      <Flash ok={sp.ok} error={sp.error} />

      <section className="card">
        <div className="tbl">
          <table>
            <thead><tr><th>Nombre</th><th>Tipo</th><th>Plan</th><th>Personas</th><th>Aviso Médico</th></tr></thead>
            <tbody>
              {(orgs ?? []).map((o) => (
                <tr key={o.id}>
                  <td><Link href={`/admin/org/${o.id}`}><b>{o.name}</b></Link></td>
                  <td>{o.kind === "empresa" ? "Empresa" : "Comercio"}</td>
                  <td>{o.plan}</td>
                  <td className="num">{o.staff_count ?? "—"}</td>
                  <td><span className={"chip " + (o.has_aviso_medico ? "ok" : "off")}>{o.has_aviso_medico ? "Sí" : "No"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid g2">
        <section className="card">
          <h2>Nueva organización</h2>
          <form className="f" action={createOrg}>
            <OrgFields />
            <SubmitButton>Crear organización</SubmitButton>
          </form>
        </section>
        <section className="card" style={{ display: "grid", gap: 10, alignContent: "start" }}>
          <h2>Sincronización de Aviso Médico</h2>
          <p className="small">Última: {fmtDateTime(sync?.last_synced_at)} · Filas leídas: {sync?.rows_read ?? "—"}</p>
          {sync?.last_error && <p className="flash err">{sync.last_error}</p>}
          <p className="small muted">Se sincroniza sola cuando una empresa abre Ausencias (cada 10 minutos como máximo) y una vez por día.</p>
          <form action={runSync}><SubmitButton className="btn sec">Sincronizar ahora</SubmitButton></form>
        </section>
      </div>
    </>
  );
}
