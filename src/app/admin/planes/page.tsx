import Link from "next/link";
import { requireStaff } from "@/lib/session";
import { fmtPrice, getPlans } from "@/lib/plans";

export default async function Planes() {
  const { supabase } = await requireStaff();
  const [plans, { data: catalog }, { data: orgs }] = await Promise.all([
    getPlans(supabase),
    supabase.from("services").select("key, name").order("sort"),
    supabase.from("organizations").select("plan_key"),
  ]);
  const name = new Map((catalog ?? []).map((s) => [s.key as string, s.name as string]));
  const count = (key: string) => (orgs ?? []).filter((o) => o.plan_key === key).length;

  return (
    <>
      <div className="head">
        <div>
          <h1>Planes</h1>
          <p>Qué incluye cada plan, cuántas UP tiene y su precio. Al crear un cliente o aplicarle un plan, toma lo que esté definido acá.</p>
        </div>
        <Link className="btn pri" href="/admin/planes/nuevo">Nuevo plan</Link>
      </div>
      {(["comercio", "empresa"] as const).map((kind) => (
        <section key={kind} style={{ display: "grid", gap: 16 }}>
          <h2>{kind === "comercio" ? "Comercios" : "Empresas"}</h2>
          <div className="grid g3">
            {plans.filter((p) => p.kind === kind).map((p) => (
              <Link key={p.key} href={`/admin/planes/${p.key}`} className="card" style={{ textDecoration: "none", color: "inherit", display: "grid", gap: 10, alignContent: "start" }}>
                <div className="row-h" style={{ marginBottom: 0 }}>
                  <h3>{p.name}</h3>
                  {!p.active && <span className="chip off">Inactivo</span>}
                </div>
                <div>
                  <b style={{ fontSize: 22 }}>{fmtPrice(p.price)}</b>
                  <span className="small muted"> por mes · {p.units} UP</span>
                </div>
                {p.description && <p className="small muted">{p.description}</p>}
                <ul className="checklist small">
                  {p.services.map((s) => <li key={s}>✓ <span>{name.get(s) ?? s}</span></li>)}
                </ul>
                <span className="small muted">{count(p.key)} cliente{count(p.key) === 1 ? "" : "s"} con este plan</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
