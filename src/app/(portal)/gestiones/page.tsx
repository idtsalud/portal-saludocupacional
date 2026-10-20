import Link from "next/link";
import { Benefit } from "@/components/Benefit";
import { Icon } from "@/components/Icon";
import { requireOrg } from "@/lib/session";
import { CONTACTO, waComercial } from "@/lib/contacto";

type Need = {
  icon: string;
  title: string;
  intro: string;
  steps: [string, string][];
  cta: string;
  message: (org: string) => string;
};

const NEEDS: Need[] = [
  {
    icon: "clip",
    title: "Turno médico o consulta",
    intro: "Para un control, una consulta por una licencia o atención por telemedicina.",
    steps: [
      ["Escribinos por WhatsApp", "Con nombre, DNI del colaborador y el motivo."],
      ["Te damos el turno", "En Campana, en Zárate o por telemedicina, lo que convenga."],
      ["Queda registrado", "El médico referente sigue el caso si hace falta."],
    ],
    cta: "Pedir turno por WhatsApp",
    message: (org) => `Hola, soy de ${org}. Necesito un turno médico para un colaborador.\nNombre:\nDNI:\nMotivo:`,
  },
  {
    icon: "users",
    title: "Preocupacional, periódico o egreso",
    intro: "Para un ingreso, los exámenes periódicos del equipo o un examen de egreso.",
    steps: [
      ["Pedí la cotización", "Contanos el puesto y cuántas personas son."],
      ["Te la enviamos", "Con el precio preferencial de SaludOcupacional."],
      ["Coordinamos los turnos", "Y los resultados quedan en la historia clínica laboral."],
    ],
    cta: "Pedir cotización por WhatsApp",
    message: (org) => `Hola, soy de ${org}. Quiero cotizar exámenes con el precio preferencial de SaludOcupacional.\nTipo (preocupacional / periódico / egreso):\nPuesto:\nCantidad de personas:`,
  },
  {
    icon: "microscope",
    title: "Estudios médicos",
    intro: "Radiografías, ecografías, audiometrías, kinesiología y especialistas.",
    steps: [
      ["Escribinos con el pedido", "Si hay orden médica, mandá una foto."],
      ["Te damos turno", "En nuestras sedes, con precio preferencial."],
      ["Recibís los resultados", "En la historia clínica laboral."],
    ],
    cta: "Pedir estudio por WhatsApp",
    message: (org) => `Hola, soy de ${org}. Necesito turno para un estudio.\nEstudio:\nNombre y DNI del colaborador:`,
  },
];

export default async function TurnosYEstudios() {
  const { org } = await requireOrg();

  return (
    <>
      <div className="head">
        <div>
          <h1>Turnos y estudios</h1>
          <p>Todo se pide por WhatsApp a Comercial de IDT: es lo más rápido. Tocá el botón y el mensaje sale con los datos que necesitamos.</p>
        </div>
      </div>

      <Benefit orgName={org.name} />

      <div className="grid g3">
        {NEEDS.map((n) => (
          <section className="card howto" key={n.title}>
            <div className="top-row">
              <span className="ic"><Icon name={n.icon} /></span>
              <div>
                <h2>{n.title}</h2>
                <p>{n.intro}</p>
              </div>
            </div>
            <ol className="steps">
              {n.steps.map(([b, s]) => (
                <li key={b}><div><b>{b}</b><span>{s}</span></div></li>
              ))}
            </ol>
            <div className="actions">
              <a className="btn wa" href={waComercial(n.message(org.name))} target="_blank" rel="noopener noreferrer">
                <Icon name="whatsapp" />
                {n.cta}
              </a>
            </div>
          </section>
        ))}
      </div>

      <div className="split">
        <section className="emer" style={{ background: "var(--surface)" }}>
          <div className="top-row" style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <span className="ic alert"><Icon name="alert" /></span>
            <div>
              <h2>¿Es un accidente o una urgencia?</h2>
              <p className="muted">No esperes un turno: seguí el protocolo de accidentes, también para fines de semana y feriados.</p>
            </div>
          </div>
          <div><Link className="btn pri" href="/accidentes">Ver qué hacer ante un accidente</Link></div>
        </section>
        <section className="card">
          <h2>Contacto de Comercial IDT</h2>
          <div className="nums">
            <div className="n"><small>WhatsApp</small><b>{CONTACTO.whatsappComercialTexto}</b></div>
            <div className="n"><small>Teléfono</small><b>{CONTACTO.telefonoIdt}</b></div>
          </div>
          <p className="small muted" style={{ marginTop: 12 }}>Correo: {CONTACTO.email}</p>
        </section>
      </div>
    </>
  );
}
