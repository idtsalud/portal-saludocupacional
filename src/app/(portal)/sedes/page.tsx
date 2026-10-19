const SEDES = [
  { name: "Zárate", address: "R. Noya 670", hours: "Lunes a lunes, 7:30 a 20", detail: "Consultas, controles y estudios.", map: "https://maps.google.com/?q=R.+Noya+670,+Zárate,+Buenos+Aires" },
  { name: "Campana", address: "Av. Ameghino 325", hours: "Lunes a viernes, 7:30 a 16:30", detail: "Consultas, radiología, kinesiología y aula de la Academia IDT.", map: "https://maps.google.com/?q=Av.+Ameghino+325,+Campana,+Buenos+Aires" },
];

export default function Sedes() {
  return (
    <>
      <div className="head">
        <h1>Sedes</h1>
        <p>Dos sedes propias en el corredor Campana–Zárate.</p>
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
