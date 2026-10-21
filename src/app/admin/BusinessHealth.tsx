import Link from "next/link";

export type Slice = { label: string; value: number };
export type HealthData = {
  revenue: number;
  active: { total: number; empresas: number; comercios: number };
  bonificados: number;
  bajas: number;
  noCuit: number;
  dueSoon: { id: string; name: string; due: string }[];
  byPlan: Slice[];
  byKind: Slice[];
  revenueByPlan: Slice[];
  topClients: { id: string; name: string; value: number }[];
};

const COLORS = ["#1f5eff", "#18b6a4", "#f2a516", "#8b5cf6", "#e5536b", "#64748b", "#0ea5e9"];
export const money = (n: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
const fmtDue = (d: string) => `${d.slice(8)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;

function Stat({ label, value, detail, tone }: { label: string; value: string | number; detail?: string; tone?: "warn" | "muted" }) {
  return (
    <div className={"card stat" + (tone ? ` ${tone}` : "")}>
      <span className="stat-label">{label}</span>
      <b className="stat-value">{value}</b>
      {detail && <span className="stat-detail">{detail}</span>}
    </div>
  );
}

/** Torta (dona) con su referencia: cada porción con color, cantidad y porcentaje. */
function Donut({ title, slices, format = (n: number) => String(n), center }: { title: string; slices: Slice[]; format?: (n: number) => string; center: string }) {
  const data = slices.filter((s) => s.value > 0);
  const total = data.reduce((s, x) => s + x.value, 0);
  let acc = 0;
  const stops = data.map((s, i) => {
    const from = (acc / total) * 100;
    acc += s.value;
    return `${COLORS[i % COLORS.length]} ${from}% ${(acc / total) * 100}%`;
  });
  return (
    <section className="card donut-card">
      <h3>{title}</h3>
      {total > 0 ? (
        <div className="donut-wrap">
          <div className="donut" style={{ background: `conic-gradient(${stops.join(", ")})` }} role="img" aria-label={`${title}: ${data.map((s) => `${s.label} ${format(s.value)}`).join(", ")}`}>
            <span>{center}</span>
          </div>
          <ul className="legend">
            {data.map((s, i) => (
              <li key={s.label}>
                <i style={{ background: COLORS[i % COLORS.length] }} />
                <span className="legend-label">{s.label}</span>
                <b>{format(s.value)}</b>
                <small>{Math.round((s.value / total) * 100)}%</small>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="muted small">Sin datos todavía.</p>
      )}
    </section>
  );
}

export function BusinessHealth({ d }: { d: HealthData }) {
  const maxTop = Math.max(1, ...d.topClients.map((c) => c.value));
  return (
    <section className="health-wrap" aria-label="Salud del negocio">
      <h2>Salud del negocio</h2>
      <div className="stat-grid">
        <Stat label="Facturación mensual" value={money(d.revenue)} detail="Clientes activos, sin IVA" />
        <Stat label="Clientes activos" value={d.active.total} detail={`${d.active.empresas} empresas · ${d.active.comercios} comercios`} />
        <Stat label="Bonificados" value={d.bonificados} detail="No facturan" tone="muted" />
        <Stat label="De baja" value={d.bajas} detail="Quedan como historial" tone="muted" />
        <Stat label="Vencimientos" value={d.dueSoon.length} detail="En los próximos 45 días" tone={d.dueSoon.length ? "warn" : undefined} />
        <Stat label="Sin CUIT" value={d.noCuit} detail="Activos y bonificados" tone={d.noCuit ? "warn" : undefined} />
      </div>

      <div className="donut-grid">
        <Donut title="Clientes por plan" slices={d.byPlan} center={`${d.active.total}`} />
        <Donut title="Empresas y comercios" slices={d.byKind} center={`${d.active.total}`} />
        <Donut title="Facturación por plan" slices={d.revenueByPlan} format={money} center="$" />
      </div>

      <div className="split">
        <section className="card">
          <h3>Clientes que más facturan</h3>
          <div className="bars">
            {d.topClients.map((c) => (
              <Link key={c.id} href={`/admin/org/${c.id}`} className="bar-row">
                <span className="bar-name">{c.name}</span>
                <span className="bar-track"><span style={{ width: `${(c.value / maxTop) * 100}%` }} /></span>
                <b>{money(c.value)}</b>
              </Link>
            ))}
          </div>
        </section>
        <section className="card">
          <h3>Próximos vencimientos</h3>
          {d.dueSoon.length ? (
            <div className="list">
              {d.dueSoon.map((c) => (
                <div className="li" key={c.id}>
                  <div className="grow"><Link href={`/admin/org/${c.id}#ficha`}><b>{c.name}</b></Link></div>
                  <span className="chip warn">{fmtDue(c.due)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted small">No hay vencimientos en los próximos 45 días. Las fechas se cargan en la ficha administrativa de cada cliente.</p>
          )}
        </section>
      </div>
    </section>
  );
}
