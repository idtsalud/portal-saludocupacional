import { Icon } from "@/components/Icon";
import { SubmitButton } from "@/components/SubmitButton";
import { requireStaff } from "@/lib/session";
import { setStaffView } from "../actions";

const VIEWS = [
  { key: "empresa", icon: "users", title: "Empresa", detail: "Lo que ve RR.HH. de una empresa cliente.", org: "Empresa de demostración", type: "cliente" },
  { key: "comercio", icon: "home", title: "Comercio", detail: "Lo que ve el dueño de un comercio.", org: "Comercio de demostración", type: "cliente" },
  { key: "colaborador_empresa", icon: "heart", title: "Colaborador de empresa", detail: "Lo que ve un empleado de una empresa.", org: "Empresa de demostración", type: "colaborador" },
  { key: "colaborador_comercio", icon: "heart", title: "Empleado de comercio", detail: "Lo que ve un empleado de un comercio.", org: "Comercio de demostración", type: "colaborador" },
];

export default async function VerComo() {
  const { profile, org } = await requireStaff();
  const current = VIEWS.find((v) => v.org === org?.name && v.type === profile.user_type)?.key;

  return (
    <>
      <div className="head">
        <div>
          <h1>Ver el portal como…</h1>
          <p>Elegí cómo querés ver el portal. Usa los clientes de demostración y no cierra tu sesión: volvés acá desde Administración IDT.</p>
        </div>
      </div>
      <div className="grid g4">
        {VIEWS.map((v) => (
          <form key={v.key} action={setStaffView} className={"qa" + (v.key === current ? " current" : "")} style={{ cursor: "default" }}>
            <input type="hidden" name="view" value={v.key} />
            <span className="ic"><Icon name={v.icon} /></span>
            <b>{v.title}</b>
            <span>{v.detail}</span>
            <SubmitButton className="btn sec">{v.key === current ? "Volver a esta vista" : "Ver así"}</SubmitButton>
          </form>
        ))}
      </div>
    </>
  );
}
