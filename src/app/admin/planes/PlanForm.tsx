import { SubmitButton } from "@/components/SubmitButton";
import type { Plan } from "@/lib/plans";
import { savePlan } from "../actions";

type Service = { key: string; name: string; description: string };

export function PlanForm({ plan, catalog, clients }: { plan?: Plan; catalog: Service[]; clients: number }) {
  const on = new Set(plan?.services ?? []);
  return (
    <form className="f" action={savePlan}>
      {plan ? <input type="hidden" name="key" value={plan.key} /> : <input type="hidden" name="is_new" value="1" />}
      <div className="two">
        <label htmlFor="name">Nombre<input id="name" name="name" required maxLength={80} defaultValue={plan?.name} placeholder="Plan Comercio" /></label>
        <label htmlFor="kind">
          Para
          <select id="kind" name="kind" defaultValue={plan?.kind ?? "comercio"}>
            <option value="comercio">Comercios</option>
            <option value="empresa">Empresas</option>
          </select>
        </label>
      </div>
      <div className="two">
        <label htmlFor="units">UP por mes<input id="units" name="units" type="number" min={0} required defaultValue={plan?.units ?? 15} /></label>
        <label htmlFor="price">Precio mensual sin IVA (vacío = a medida)<input id="price" name="price" inputMode="numeric" defaultValue={plan?.price ?? ""} placeholder="99900" /></label>
      </div>
      <label htmlFor="description">Descripción corta<textarea id="description" name="description" rows={2} maxLength={400} defaultValue={plan?.description} /></label>
      <fieldset style={{ border: 0, padding: 0, margin: 0, display: "grid", gap: 10 }}>
        <legend className="small muted" style={{ fontWeight: 600, marginBottom: 8 }}>Servicios que incluye</legend>
        {catalog.map((s) => (
          <label className="check" key={s.key} style={{ alignItems: "flex-start" }}>
            <input type="checkbox" name="svc" value={s.key} defaultChecked={on.has(s.key)} style={{ marginTop: 4 }} />
            <span><b>{s.name}</b><br /><span className="small muted" style={{ fontWeight: 400 }}>{s.description}</span></span>
          </label>
        ))}
      </fieldset>
      <div className="two">
        <label htmlFor="sort">Orden en la lista<input id="sort" name="sort" type="number" defaultValue={plan?.sort ?? 100} /></label>
        <label className="check" style={{ alignSelf: "end" }}><input type="checkbox" name="active" defaultChecked={plan?.active ?? true} /> Activo (se puede asignar a clientes)</label>
      </div>
      {plan && clients > 0 && (
        <label className="check"><input type="checkbox" name="apply_clients" /> Aplicar estos cambios a los {clients} cliente{clients === 1 ? "" : "s"} que tienen este plan</label>
      )}
      <SubmitButton>{plan ? "Guardar plan" : "Crear plan"}</SubmitButton>
    </form>
  );
}
