import { Flash } from "@/components/Flash";
import { Icon } from "@/components/Icon";
import { SubmitButton } from "@/components/SubmitButton";
import { canRequest, requireOrg } from "@/lib/session";
import { fmtDate, STATUS } from "@/lib/format";
import { createRequest } from "./actions";

export default async function Gestiones({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { supabase, org, profile } = await requireOrg();
  const { data: requests } = await supabase
    .from("requests")
    .select("id, type, collaborator, sede, created_at, preferred_date, status, status_detail")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <>
      <div className="head">
        <h1>Gestiones</h1>
        <p>Pedí exámenes, turnos y prestaciones. Cada pedido llega a Coordinación de exámenes y ves su estado acá.</p>
      </div>
      <Flash ok={sp.ok} error={sp.error} />

      <div className="grid g2">
        <section className="card">
          <h2>Nuevo pedido</h2>
          {canRequest(profile) ? (
            <form className="f" action={createRequest}>
              <label htmlFor="type">
                Qué necesitás
                <select id="type" name="type">
                  <option>Preocupacional</option>
                  <option>Examen periódico</option>
                  <option>Consulta médica</option>
                  <option>Interconsulta con especialista</option>
                  <option>Estudio (radiografía, ecografía, audiometría)</option>
                  <option>Examen de egreso</option>
                </select>
              </label>
              <div className="two">
                <label htmlFor="collaborator">
                  Colaborador o grupo
                  <input id="collaborator" name="collaborator" placeholder="Nombre y apellido" required maxLength={160} />
                </label>
                <label htmlFor="dni">
                  DNI
                  <input id="dni" name="dni" inputMode="numeric" placeholder="Opcional" />
                </label>
              </div>
              <div className="two">
                <label htmlFor="sede">
                  Sede
                  <select id="sede" name="sede">
                    <option>Zárate</option>
                    <option>Campana</option>
                    <option>Telemedicina</option>
                  </select>
                </label>
                <label htmlFor="preferred_date">
                  Fecha preferida
                  <input id="preferred_date" name="preferred_date" type="date" />
                </label>
              </div>
              <label htmlFor="note">
                Comentario
                <textarea id="note" name="note" placeholder="Puesto, turno, urgencia" maxLength={1000} />
              </label>
              <SubmitButton>Enviar pedido</SubmitButton>
            </form>
          ) : (
            <p className="muted">Tu usuario puede ver reportes pero no hacer pedidos. Pedile permiso a quien administra el portal en tu empresa.</p>
          )}
        </section>
        <section className="card">
          <h2>Cómo sigue un pedido</h2>
          <ol className="steps">
            <li><b>Recibido.</b> Coordinación de exámenes lo ve en el día.</li>
            <li><b>Turno coordinado.</b> Te avisamos día, hora y sede.</li>
            <li><b>Realizado.</b> El colaborador ya fue atendido.</li>
            <li><b>Resultados disponibles.</b> Quedan en la historia clínica laboral.</li>
          </ol>
          <p className="note" style={{ marginTop: 14 }}>
            <Icon name="info" />
            <span>Cualquier persona de tu empresa con usuario ve en qué está cada pedido.</span>
          </p>
        </section>
      </div>

      <section className="card">
        <h2>Tus pedidos</h2>
        {requests && requests.length > 0 ? (
          <div className="tbl">
            <table>
              <thead>
                <tr><th>N.º</th><th>Pedido</th><th>Colaborador</th><th>Sede</th><th>Pedido el</th><th>Estado</th></tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td className="num">{r.id}</td>
                    <td>
                      <b>{r.type}</b>
                      {(r.status_detail || r.preferred_date) && (
                        <div className="small muted">{r.status_detail ?? `Fecha preferida ${fmtDate(r.preferred_date)}`}</div>
                      )}
                    </td>
                    <td>{r.collaborator}</td>
                    <td>{r.sede}</td>
                    <td className="num">{fmtDate(r.created_at)}</td>
                    <td><span className={"chip " + (STATUS[r.status]?.tone ?? "off")}>{STATUS[r.status]?.label ?? r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">Todavía no hay pedidos.</p>
        )}
      </section>
    </>
  );
}
