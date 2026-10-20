import { SEDES } from "@/lib/sedes";

export default function Sedes() {
  return (
    <>
      <div className="head">
        <div>
          <h1>Sedes</h1>
          <p>Dos sedes propias en el corredor Campana–Zárate.</p>
        </div>
      </div>
      <div className="grid g2">
        {SEDES.map((s) => (
          <section className="card" key={s.name}>
            <h2>Sede {s.name}</h2>
            <p style={{ margin: "6px 0" }}>{s.address}</p>
            <p className="small muted">{s.hours}</p>
            <p className="small" style={{ margin: "10px 0" }}>{s.detail}</p>
            <a className="btn sec" href={s.map} target="_blank" rel="noopener noreferrer">Cómo llegar</a>
          </section>
        ))}
      </div>
    </>
  );
}
