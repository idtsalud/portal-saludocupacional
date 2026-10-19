import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Flash } from "@/components/Flash";
import { SubmitButton } from "@/components/SubmitButton";
import { canRequest, requireOrg } from "@/lib/session";
import { fmtDateTime } from "@/lib/format";

const TYPES = ["Accidente de trabajo", "Accidente in itinere", "Enfermedad profesional"];

async function createIncident(formData: FormData) {
  "use server";
  const { supabase, org, profile, user } = await requireOrg();
  if (!canRequest(profile)) redirect("/accidentes?error=permiso");
  const collaborator = String(formData.get("collaborator") ?? "").trim().slice(0, 160);
  const type = String(formData.get("type") ?? "");
  if (!collaborator || !TYPES.includes(type)) redirect("/accidentes?error=datos");
  const occurred = String(formData.get("occurred_at") ?? "");
  const { error } = await supabase.from("incidents").insert({
    org_id: org.id,
    created_by: user.id,
    collaborator,
    type,
    occurred_at: occurred ? new Date(occurred + "-03:00").toISOString() : null,
    art_claim: String(formData.get("art_claim") ?? "").trim().slice(0, 60) || null,
    description: String(formData.get("description") ?? "").trim().slice(0, 2000) || null,
  });
  if (error) redirect("/accidentes?error=fallo");
  revalidatePath("/accidentes");
  redirect("/accidentes?ok=caso");
}

export default async function Accidentes({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { supabase, org, profile } = await requireOrg();
  const { data: incidents } = await supabase
    .from("incidents")
    .select("id, collaborator, type, occurred_at, status")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <>
      <div className="head">
        <h1>Accidentes y enfermedades profesionales</h1>
        <p>Qué hacer y a quién llamar, siempre a mano.</p>
      </div>
      <Flash ok={sp.ok} error={sp.error} />
      <div className="emer">
        <h2>Si alguien se lastimó trabajando</h2>
        <div className="nums">
          <div className="n"><small>Teléfono IDT</small><b>11 2120-4550</b></div>
          <div className="n"><small>WhatsApp</small><b>11 2632-0855</b></div>
          <div className="n"><small>Sede Zárate</small><b>R. Noya 670</b></div>
        </div>
        <ol className="steps">
          <li>Si es una emergencia, llamá primero al servicio de emergencias.</li>
          <li>Avisá a tu ART y pedí el número de siniestro.</li>
          <li>Llamanos o escribinos: coordinamos la atención en la sede.</li>
          <li>Registrá el caso abajo para que el médico referente haga el seguimiento.</li>
        </ol>
      </div>
      <div className="grid g2">
        <section className="card">
          <h2>Registrar un caso</h2>
          {canRequest(profile) ? (
            <form className="f" action={createIncident}>
              <div className="two">
                <label htmlFor="collaborator">Colaborador<input id="collaborator" name="collaborator" required maxLength={160} /></label>
                <label htmlFor="occurred_at">Fecha y hora<input id="occurred_at" name="occurred_at" type="datetime-local" /></label>
              </div>
              <div className="two">
                <label htmlFor="type">
                  Tipo
                  <select id="type" name="type">{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
                </label>
                <label htmlFor="art_claim">N.º de siniestro ART<input id="art_claim" name="art_claim" placeholder="Si ya lo tenés" /></label>
              </div>
              <label htmlFor="description">Qué pasó<textarea id="description" name="description" maxLength={2000} /></label>
              <SubmitButton>Registrar caso</SubmitButton>
            </form>
          ) : (
            <p className="muted">Tu usuario no puede registrar casos. Pedíselo a quien administra el portal en tu empresa.</p>
          )}
        </section>
        <section className="card">
          <h2>Casos registrados</h2>
          {incidents && incidents.length > 0 ? (
            <div className="list">
              {incidents.map((i) => (
                <div className="li" key={i.id}>
                  <div className="grow"><b>{i.collaborator}</b><span>{i.type} · {fmtDateTime(i.occurred_at)}</span></div>
                  <span className={"chip " + (i.status === "cerrado" ? "ok" : "warn")}>
                    {i.status === "registrado" ? "Registrado" : i.status === "en_seguimiento" ? "En seguimiento" : "Cerrado"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">No hay casos registrados.</p>
          )}
        </section>
      </div>
    </>
  );
}
