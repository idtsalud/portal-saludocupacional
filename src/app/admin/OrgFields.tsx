type Org = {
  name?: string;
  kind?: string;
  plan?: string;
  plan_units?: number;
  staff_count?: number | null;
  referente_medico?: string | null;
  sheet_company_key?: string | null;
  has_aviso_medico?: boolean;
  has_ruta_saludable?: boolean;
  has_academia?: boolean;
  has_campanas?: boolean;
};

export function OrgFields({ org = {} }: { org?: Org }) {
  return (
    <>
      <div className="two">
        <label htmlFor="name">Nombre<input id="name" name="name" required defaultValue={org.name} maxLength={160} /></label>
        <label htmlFor="kind">
          Tipo
          <select id="kind" name="kind" defaultValue={org.kind ?? "empresa"}>
            <option value="empresa">Empresa</option>
            <option value="comercio">Comercio</option>
          </select>
        </label>
      </div>
      <div className="two">
        <label htmlFor="plan">Plan<input id="plan" name="plan" required defaultValue={org.plan} placeholder="Plan Integral, Plan Comercio…" /></label>
        <label htmlFor="plan_units">Unidades por mes<input id="plan_units" name="plan_units" type="number" min={0} defaultValue={org.plan_units ?? 15} /></label>
      </div>
      <div className="two">
        <label htmlFor="staff_count">Cantidad de personas<input id="staff_count" name="staff_count" type="number" min={0} defaultValue={org.staff_count ?? undefined} /></label>
        <label htmlFor="referente_medico">Médico referente<input id="referente_medico" name="referente_medico" defaultValue={org.referente_medico ?? undefined} /></label>
      </div>
      <label htmlFor="sheet_company_key">
        Nombre en la planilla de Aviso Médico
        <input id="sheet_company_key" name="sheet_company_key" defaultValue={org.sheet_company_key ?? undefined} placeholder="Exactamente como figura en la columna Empresa" />
      </label>
      <label className="check"><input type="checkbox" name="has_aviso_medico" defaultChecked={org.has_aviso_medico} /> Aviso Médico</label>
      <label className="check"><input type="checkbox" name="has_ruta_saludable" defaultChecked={org.has_ruta_saludable} /> Ruta Saludable</label>
      <label className="check"><input type="checkbox" name="has_academia" defaultChecked={org.has_academia} /> Academia IDT</label>
      <label className="check"><input type="checkbox" name="has_campanas" defaultChecked={org.has_campanas ?? true} /> Campañas de salud</label>
    </>
  );
}
