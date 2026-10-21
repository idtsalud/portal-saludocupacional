type Org = {
  name?: string;
  kind?: string;
  plan?: string;
  plan_units?: number;
  staff_count?: number | null;
  referente_medico?: string | null;
  sheet_company_key?: string | null;
  avisos_desde?: string | null;
  show_motivo?: boolean;
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
      <div className="two">
        <label htmlFor="sheet_company_key">
          Nombre en la planilla de Aviso Médico
          <input id="sheet_company_key" name="sheet_company_key" defaultValue={org.sheet_company_key ?? undefined} placeholder="Exactamente como figura en la columna Empresa" />
        </label>
        <label htmlFor="avisos_desde">
          Tomar avisos desde
          <input id="avisos_desde" name="avisos_desde" type="date" defaultValue={org.avisos_desde ? org.avisos_desde.slice(0, 10) : undefined} />
        </label>
      </div>
      <p className="small muted">Los avisos de la planilla anteriores a esa fecha (por ejemplo, pruebas) no se muestran. Vacío: se toman todos.</p>
      <label className="check" style={{ alignItems: "flex-start" }}>
        <input type="checkbox" name="show_motivo" defaultChecked={!!org.show_motivo} style={{ marginTop: 4 }} />
        <span>
          <b>La empresa ve el motivo de cada aviso</b>
          <br />
          <span className="small muted" style={{ fontWeight: 400 }}>Es un dato de salud: conviene que los colaboradores sepan que su empresa lo ve.</span>
        </span>
      </label>
    </>
  );
}
