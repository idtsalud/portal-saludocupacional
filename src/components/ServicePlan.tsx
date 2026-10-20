import { Icon } from "@/components/Icon";
import { requestService } from "@/app/(portal)/solicitudes/actions";

export type CatalogService = { key: string; name: string; description: string | null };

/** Servicios que se usan descontando unidades del plan. */
const WITH_UNITS = ["atencion_sedes", "telemedicina"];

/** "Tu servicio": lo incluido, lo que se usa con UP y lo que se puede sumar. */
export function ServicePlan({
  plan,
  units,
  unitsLabel,
  referente,
  catalog,
  enabled,
  requested,
  canAsk,
}: {
  plan: string;
  units: number;
  unitsLabel: string;
  referente: string | null;
  catalog: CatalogService[];
  enabled: (key: string) => boolean;
  requested: Set<string>;
  canAsk: boolean;
}) {
  const included = catalog.filter((s) => enabled(s.key) && !WITH_UNITS.includes(s.key));
  const withUnits = catalog.filter((s) => enabled(s.key) && WITH_UNITS.includes(s.key));
  const extra = catalog.filter((s) => !enabled(s.key));

  return (
    <section className="card plan-card" id="servicio">
      <div className="row-h">
        <h2>Tu servicio</h2>
        <span className="chip info">{plan}</span>
      </div>
      <div className="plan-units">
        <b>{units}</b>
        <span>{unitsLabel} por mes · se renuevan el 1 de cada mes{referente ? ` · Médico referente: ${referente}` : ""}</span>
      </div>

      {included.length > 0 && (
        <div className="plan-group">
          <h3>Incluido en tu plan</h3>
          <ul className="checklist">
            {included.map((s) => <li key={s.key}><Icon name="check" /><span>{s.name}</span></li>)}
          </ul>
        </div>
      )}

      {withUnits.length > 0 && (
        <div className="plan-group">
          <h3>Se usan con tus {unitsLabel}</h3>
          <p className="small muted">Cada consulta o estudio descuenta {unitsLabel} del mes.</p>
          <ul className="checklist">
            {withUnits.map((s) => <li key={s.key}><Icon name="pulse" /><span>{s.name}</span></li>)}
          </ul>
        </div>
      )}

      {extra.length > 0 && (
        <div className="plan-group">
          <h3>Sumá más servicios</h3>
          <div className="list">
            {extra.map((s) => (
              <div className="li" key={s.key}>
                <div className="grow"><b>{s.name}</b>{s.description && <span>{s.description}</span>}</div>
                {requested.has(s.key) ? (
                  <span className="chip warn">Pedido enviado</span>
                ) : canAsk ? (
                  <form action={requestService}>
                    <input type="hidden" name="service" value={s.key} />
                    <button className="btn sec" type="submit">Sumar</button>
                  </form>
                ) : (
                  <span className="chip off">Disponible</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
