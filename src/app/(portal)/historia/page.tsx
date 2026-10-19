import { Icon } from "@/components/Icon";

const INTRANET = process.env.NEXT_PUBLIC_INTRANET_URL ?? "http://idtsalud.ddns.net:8030/Inicio.aspx";

export default function Historia() {
  return (
    <>
      <div className="head">
        <h1>Historia clínica laboral</h1>
        <p>Los exámenes y resultados de tus colaboradores siguen en la intranet de IDT, la misma que usás hoy.</p>
      </div>
      <section className="card" style={{ display: "grid", gap: 14 }}>
        <div className="person">
          <span className="ic"><Icon name="heart" /></span>
          <div>
            <h2>Intranet de clientes IDT</h2>
            <p className="muted small">Historia clínica laboral, resultados de exámenes y facturas. Se ingresa con el usuario de la intranet.</p>
          </div>
        </div>
        <div>
          <a className="btn pri" href={INTRANET} target="_blank" rel="noopener noreferrer"><Icon name="ext" />Abrir la intranet</a>
        </div>
      </section>
    </>
  );
}
