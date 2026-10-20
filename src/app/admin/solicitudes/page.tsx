import Link from "next/link";
import { Flash } from "@/components/Flash";
import { requireStaff } from "@/lib/session";
import { fmtDate } from "@/lib/format";
import { OPEN_STATUSES, SOLICITUD_KIND, SOLICITUD_STATUS } from "@/lib/solicitudes";
import { updateSolicitud } from "../actions";

export default async function AdminSolicitudes({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { supabase } = await requireStaff();
  const verTodas = sp.ver === "todas";
  let q = supabase
    .from("solicitudes")
    .select("id, org_id, kind, service_key, message, status, staff_note, created_at, organizations(name, plan), services(name)")
    .order("created_at", { ascending: false })
    .limit(300);
  if (!verTodas) q = q.in("status", OPEN_STATUSES);
  const { data: rows } = await q;

  return (
    <>
      <div className="head">
        <div>
          <h1>Solicitudes</h1>
          <p>Lo que piden los clientes desde su portal: sumar servicios, problemas con la plataforma y consultas.</p>
        </div>
        <Link className="btn sec" href={verTodas ? "/admin/solicitudes" : "/admin/solicitudes?ver=todas"}>
          {verTodas ? "Ver solo las pendientes" : "Ver también las resueltas"}
        </Link>
      </div>
      <Flash ok={sp.ok} error={sp.error} />
      <section className="card">
        {rows && rows.length > 0 ? (
          <div className="tbl">
            <table>
              <thead><tr><th>Cliente</th><th>Solicitud</th><th>Fecha</th><th>Estado y respuesta</th></tr></thead>
              <tbody>
                {rows.map((r) => {
                  const o = r.organizations as unknown as { name: string; plan: string } | null;
                  const svc = (r.services as unknown as { name: string } | null)?.name;
                  return (
                    <tr key={r.id}>
                      <td><Link href={`/admin/org/${r.org_id}`}><b>{o?.name ?? "—"}</b></Link><div className="small muted">{o?.plan}</div></td>
                      <td>
                        <b>{r.kind === "servicio" ? `Quiere sumar ${svc ?? "un servicio"}` : SOLICITUD_KIND[r.kind]}</b>
                        {r.message && <div className="small">{r.message}</div>}
                      </td>
                      <td className="num">{fmtDate(r.created_at)}</td>
                      <td style={{ minWidth: 260 }}>
                        <form className="f" action={updateSolicitud} style={{ gap: 6 }}>
                          <input type="hidden" name="id" value={r.id} />
                          <select name="status" defaultValue={r.status} aria-label="Estado">
                            {Object.entries(SOLICITUD_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                          </select>
                          <input name="staff_note" defaultValue={r.staff_note ?? ""} placeholder="Respuesta que ve el cliente (opcional)" aria-label="Respuesta" />
                          <button className="btn sec" type="submit">Guardar</button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">{verTodas ? "Todavía no hay solicitudes." : "No hay solicitudes pendientes."}</p>
        )}
      </section>
    </>
  );
}
