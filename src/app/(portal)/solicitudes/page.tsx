import { Flash } from "@/components/Flash";
import { SubmitButton } from "@/components/SubmitButton";
import { requireOrg } from "@/lib/session";
import { fmtDate } from "@/lib/format";
import { SOLICITUD_KIND, SOLICITUD_STATUS } from "@/lib/solicitudes";
import { sendSolicitud } from "./actions";

export default async function Solicitudes({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { supabase, org, profile } = await requireOrg();
  const [{ data: rows }, { data: catalog }] = await Promise.all([
    supabase.from("solicitudes").select("id, kind, service_key, message, status, staff_note, created_at").eq("org_id", org.id).order("created_at", { ascending: false }).limit(100),
    supabase.from("services").select("key, name"),
  ]);
  const serviceName = (k: string | null) => (catalog ?? []).find((s) => s.key === k)?.name ?? "";
  const canAsk = ["admin", "todo"].includes(profile.permission);

  return (
    <>
      <div className="head">
        <div>
          <h1>Solicitudes a IDT</h1>
          <p>Para sumar servicios a tu plan, avisarnos si algo del portal no funciona o hacernos una consulta.</p>
        </div>
      </div>
      <Flash ok={sp.ok} error={sp.error} />

      <div className="split">
        <section className="card">
          <h2>Tus solicitudes</h2>
          {rows && rows.length > 0 ? (
            <div className="list" style={{ marginTop: 12 }}>
              {rows.map((r) => {
                const st = SOLICITUD_STATUS[r.status] ?? SOLICITUD_STATUS.nueva;
                return (
                  <div className="li" key={r.id}>
                    <div className="grow">
                      <b>{r.kind === "servicio" ? `Sumar ${serviceName(r.service_key)}` : SOLICITUD_KIND[r.kind]}</b>
                      <span>{fmtDate(r.created_at)}{r.message ? ` · ${r.message}` : ""}</span>
                      {r.staff_note && <span style={{ display: "block", color: "var(--ink)" }}>Respuesta de IDT: {r.staff_note}</span>}
                    </div>
                    <span className={"chip " + st.tone}>{st.label}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="muted" style={{ marginTop: 8 }}>Todavía no hiciste ninguna solicitud.</p>
          )}
        </section>

        <section className="card">
          <h2>Nueva solicitud</h2>
          {canAsk ? (
            <form className="f" action={sendSolicitud} style={{ marginTop: 12 }}>
              <label htmlFor="kind">
                Motivo
                <select id="kind" name="kind" defaultValue="problema">
                  <option value="problema">Algo del portal no funciona</option>
                  <option value="consulta">Consulta sobre mi servicio</option>
                </select>
              </label>
              <label htmlFor="message">
                Contanos qué pasó
                <textarea id="message" name="message" rows={5} required maxLength={2000} placeholder="Ej.: no puedo descargar el certificado desde Documentos." />
              </label>
              <p className="small muted">Para sumar un servicio, tocá Sumar en el inicio, en Tu servicio.</p>
              <SubmitButton>Enviar a IDT</SubmitButton>
            </form>
          ) : (
            <p className="muted" style={{ marginTop: 8 }}>Pedíselo a quien administra el portal en tu empresa.</p>
          )}
        </section>
      </div>
    </>
  );
}
