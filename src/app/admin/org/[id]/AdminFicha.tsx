import { SubmitButton } from "@/components/SubmitButton";
import { updateOrgAdmin, uploadLogo } from "../../actions";

export type OrgAdmin = {
  status: string;
  cuit: string | null;
  monthly_price: number | null;
  discount_pct: number | null;
  billing_mode: string | null;
  purchase_order: string | null;
  invoicing_entity: string | null;
  vigencia: string | null;
  next_due: string | null;
  referentes: string | null;
  emails: string | null;
  service_detail: string | null;
  consult_limit: string | null;
  notes: string | null;
};

/** Datos internos del cliente: solo los ve el personal de IDT. */
export function AdminFicha({ orgId, admin, logoUrl }: { orgId: string; admin: OrgAdmin | null; logoUrl: string | null }) {
  const a = admin ?? ({} as Partial<OrgAdmin>);
  return (
    <section className="card" id="ficha">
      <div className="row-h">
        <h2>Ficha administrativa</h2>
        <span className="chip off">Solo IDT</span>
      </div>
      <form className="f" action={updateOrgAdmin}>
        <input type="hidden" name="org_id" value={orgId} />
        <div className="two">
          <label htmlFor="status">
            Estado
            <select id="status" name="status" defaultValue={a.status ?? "activo"}>
              <option value="activo">Activo</option>
              <option value="bonificado">Bonificado</option>
              <option value="baja">Baja</option>
            </select>
          </label>
          <label htmlFor="cuit">CUIT<input id="cuit" name="cuit" defaultValue={a.cuit ?? ""} placeholder="30-12345678-9" maxLength={20} /></label>
        </div>
        <div className="two">
          <label htmlFor="monthly_price">Valor mensual sin IVA<input id="monthly_price" name="monthly_price" inputMode="decimal" defaultValue={a.monthly_price ?? ""} placeholder="Ej.: 154688" /></label>
          <label htmlFor="discount_pct">% de descuento<input id="discount_pct" name="discount_pct" inputMode="decimal" defaultValue={a.discount_pct ?? ""} /></label>
        </div>
        <div className="two">
          <label htmlFor="billing_mode">Facturación<input id="billing_mode" name="billing_mode" defaultValue={a.billing_mode ?? ""} placeholder="Factura adelantada, vencida, con OC…" /></label>
          <label htmlFor="purchase_order">Orden de compra<input id="purchase_order" name="purchase_order" defaultValue={a.purchase_order ?? ""} placeholder="N.º y vigencia de la OC" /></label>
        </div>
        <div className="two">
          <label htmlFor="invoicing_entity">Quién factura<input id="invoicing_entity" name="invoicing_entity" defaultValue={a.invoicing_entity ?? ""} placeholder="ITO Zárate, FOB…" /></label>
          <label htmlFor="next_due">Próximo vencimiento<input id="next_due" name="next_due" type="date" defaultValue={a.next_due ?? ""} /></label>
        </div>
        <div className="two">
          <label htmlFor="vigencia">Vigencia y actualización<input id="vigencia" name="vigencia" defaultValue={a.vigencia ?? ""} placeholder="Ej.: enero a marzo · actualización trimestral" /></label>
          <label htmlFor="consult_limit">Límite de consultas<input id="consult_limit" name="consult_limit" defaultValue={a.consult_limit ?? ""} placeholder="Hasta 10, sin límite…" /></label>
        </div>
        <label htmlFor="service_detail">Servicio contratado<input id="service_detail" name="service_detail" defaultValue={a.service_detail ?? ""} /></label>
        <div className="two">
          <label htmlFor="referentes">Referentes<input id="referentes" name="referentes" defaultValue={a.referentes ?? ""} /></label>
          <label htmlFor="emails">Correos de contacto<input id="emails" name="emails" defaultValue={a.emails ?? ""} /></label>
        </div>
        <label htmlFor="notes">Notas internas<textarea id="notes" name="notes" rows={3} defaultValue={a.notes ?? ""} /></label>
        <SubmitButton className="btn sec">Guardar ficha</SubmitButton>
      </form>

      <form className="f logo-form" action={uploadLogo} style={{ marginTop: 22 }}>
        <input type="hidden" name="org_id" value={orgId} />
        <div className="logo-row">
          <div className="logo-box">{logoUrl ? <img src={logoUrl} alt="Logo del cliente" /> : <span className="small muted">Sin logo</span>}</div>
          <label htmlFor="logo" style={{ flex: 1 }}>
            Logo (lo ve el cliente arriba en su portal)
            <input id="logo" name="logo" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" required />
          </label>
        </div>
        <SubmitButton className="btn sec">Subir logo</SubmitButton>
      </form>
    </section>
  );
}
