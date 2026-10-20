import { Icon } from "@/components/Icon";
import { requireOrg } from "@/lib/session";
import { CONTACTO, waComercial } from "@/lib/contacto";

export default async function Accidentes() {
  const { org } = await requireOrg();
  const aviso = waComercial(
    `Hola, soy de ${org.name}. Quiero avisar un accidente de trabajo.\nNombre y DNI del colaborador:\nFecha y hora:\nQué pasó:\nDónde lo atendieron:\nN.º de siniestro de la ART (si ya lo tenés):`,
  );

  return (
    <>
      <div className="head">
        <div>
          <h1>Qué hacer ante un accidente</h1>
          <p>El protocolo para cuando un colaborador se lastima trabajando o en el camino al trabajo, en cualquier día y horario.</p>
        </div>
      </div>

      <section className="emer">
        <h2>Si hay riesgo de vida, primero llamá a emergencias</h2>
        <div className="nums">
          <div className="n"><small>Emergencias médicas (SAME)</small><b>107</b></div>
          <div className="n"><small>Emergencias</small><b>911</b></div>
        </div>
        <p className="small">Después seguí los pasos de abajo según el día y el horario.</p>
      </section>

      <div className="grid g2">
        <section className="card">
          <span className="tabs-label"><Icon name="sun" /> En horario de sede</span>
          <h2 style={{ marginBottom: 6 }}>Lunes a viernes y sábados a la mañana</h2>
          <p className="muted" style={{ marginBottom: 18 }}>
            Zárate: lunes a viernes de 7 a 19 y sábados de 8 a 12. Campana: lunes a viernes de 7:30 a 16:30.
          </p>
          <ol className="steps">
            <li><div><b>Dale primeros auxilios</b><span>Y que no siga trabajando hasta que lo vea un médico.</span></div></li>
            <li><div><b>Avisá a tu ART</b><span>Hacé la denuncia del accidente y pedí el número de siniestro.</span></div></li>
            <li><div><b>Escribinos o llamanos</b><span>Coordinamos la atención en la sede ese mismo día.</span></div></li>
            <li><div><b>Mandalo con su DNI</b><span>Y con el número de siniestro si ya lo tenés.</span></div></li>
          </ol>
        </section>

        <section className="card">
          <span className="tabs-label"><Icon name="moon" /> Fuera de horario</span>
          <h2 style={{ marginBottom: 6 }}>Sábados a la tarde, domingos, feriados y de noche</h2>
          <p className="muted" style={{ marginBottom: 18 }}>Las sedes están cerradas, pero la ART atiende las 24 horas.</p>
          <ol className="steps red">
            <li><div><b>Llamá a la línea 24 horas de tu ART</b><span>Está en el afiche obligatorio de la ART y en su credencial. Te indican a qué guardia o prestador llevarlo.</span></div></li>
            <li><div><b>Si no te atienden o es urgente</b><span>Llevalo a la guardia más cercana y avisá que es un accidente de trabajo cubierto por la ART.</span></div></li>
            <li><div><b>Guardá todos los papeles</b><span>Constancia de atención, estudios, recetas y certificado con los días de reposo.</span></div></li>
            <li><div><b>Dejanos el aviso por WhatsApp</b><span>Aunque estemos cerrados. El primer día hábil el médico referente toma el caso y coordina el control.</span></div></li>
          </ol>
        </section>
      </div>

      <div className="split">
        <section className="card">
          <h2>Datos para tener a mano</h2>
          <ul className="checklist">
            {[
              "Nombre, DNI y CUIL del colaborador",
              "Fecha, hora y lugar exacto del accidente",
              "Cómo pasó y qué parte del cuerpo se lastimó",
              "Nombre de la ART y número de contrato o póliza",
              "Número de siniestro, cuando la ART te lo dé",
              "Si fue en el camino entre la casa y el trabajo (in itinere): el recorrido y el horario",
            ].map((t) => (
              <li key={t}><Icon name="check" /><span>{t}</span></li>
            ))}
          </ul>
        </section>
        <section className="card" style={{ display: "grid", gap: 16, alignContent: "start" }}>
          <h2>Avisale a IDT</h2>
          <p className="muted">El mensaje sale con los datos que necesitamos para hacer el seguimiento.</p>
          <a className="btn wa" href={aviso} target="_blank" rel="noopener noreferrer"><Icon name="whatsapp" />Avisar el accidente por WhatsApp</a>
          <div className="nums">
            <div className="n"><small>WhatsApp</small><b>{CONTACTO.whatsappComercialTexto}</b></div>
            <div className="n"><small>Teléfono (horario de sede)</small><b>{CONTACTO.telefonoIdt}</b></div>
          </div>
        </section>
      </div>
    </>
  );
}
