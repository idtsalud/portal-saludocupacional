import { Flash } from "@/components/Flash";
import { requireStaff } from "@/lib/session";
import { fmtDate, STATUS } from "@/lib/format";
import { updateRequestStatus } from "../actions";

export default async function AdminPedidos({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { supabase } = await requireStaff();
  const { data: rows } = await supabase
    .from("requests")
    .select("id, type, collaborator, dni, sede, preferred_date, note, status, status_detail, created_at, organizations(name)")
    .order("created_at", { ascending: false })
    .limit(300);

  return (
    <>
      <div className="head">
        <h1>Pedidos</h1>
        <p>Todos los pedidos de todas las organizaciones. Al cambiar el estado, la empresa lo ve en su portal.</p>
      </div>
      <Flash ok={sp.ok} error={sp.error} />
      <section className="card">
        <div className="tbl">
          <table>
            <thead><tr><th>N.º</th><th>Organización</th><th>Pedido</th><th>Pedido el</th><th>Estado</th></tr></thead>
            <tbody>
              {(rows ?? []).map((r) => {
                const orgName = (r.organizations as unknown as { name: string } | null)?.name ?? "—";
                return (
                  <tr key={r.id}>
                    <td className="num">{r.id}</td>
                    <td>{orgName}</td>
                    <td>
                      <b>{r.type}</b>
                      <div className="small muted">
                        {r.collaborator}{r.dni ? ` · DNI ${r.dni}` : ""} · {r.sede}
                        {r.preferred_date ? ` · prefiere ${fmtDate(r.preferred_date)}` : ""}
                      </div>
                      {r.note && <div className="small">{r.note}</div>}
                    </td>
                    <td className="num">{fmtDate(r.created_at)}</td>
                    <td style={{ minWidth: 240 }}>
                      <form className="f" action={updateRequestStatus} style={{ gap: 6 }}>
                        <input type="hidden" name="id" value={r.id} />
                        <select name="status" defaultValue={r.status} aria-label="Estado">
                          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                        <input name="status_detail" defaultValue={r.status_detail ?? ""} placeholder="Ej.: jueves 23/10, 8:00, sede Zárate" aria-label="Detalle" />
                        <button className="btn sec" type="submit">Guardar</button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
