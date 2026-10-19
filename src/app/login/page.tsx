import { Icon, Logo } from "@/components/Icon";
import { SubmitButton } from "@/components/SubmitButton";
import { forgotPassword, login } from "./actions";

const ERRORS: Record<string, string> = {
  credenciales: "El correo o la contraseña no coinciden. Revisalos o pedí una contraseña nueva.",
  datos: "Completá el correo y la contraseña.",
  enlace: "El enlace venció o ya se usó. Pedí uno nuevo.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const forgot = sp.olvide === "1";

  return (
    <div className="login">
      <section className="brandp">
        <Logo />
        <h1>
          Todo tu servicio de salud ocupacional, <em>en un solo lugar.</em>
        </h1>
        <p>Pedí exámenes, seguí cada pedido, descargá tus documentos y hablá directo con tu equipo IDT. Cada empresa ve solo lo suyo.</p>
        <ul>
          {[
            "Pedidos de exámenes y turnos con estado visible",
            "Certificado de servicio, campañas y kit de Aviso Médico",
            "Acceso a la historia clínica laboral",
            "Tu médico referente y tu equipo IDT, con nombre",
          ].map((t) => (
            <li key={t}>
              <Icon name="check" />
              {t}
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>{forgot ? "Recuperar contraseña" : "Ingresar al portal"}</h2>
        <p className="muted small" style={{ margin: "4px 0 16px" }}>
          {forgot ? "Te enviamos un correo con un enlace para crear una contraseña nueva." : "Usuario personal para cada persona de la empresa."}
        </p>
        {sp.error && <p className="flash err" style={{ marginBottom: 12 }}>{ERRORS[sp.error] ?? "No pudimos completar el ingreso."}</p>}
        {sp.enviado && <p className="flash ok" style={{ marginBottom: 12 }}>Si el correo está registrado, en unos minutos te llega el enlace.</p>}

        {forgot ? (
          <form className="f" action={forgotPassword}>
            <label htmlFor="email">
              Correo
              <input id="email" name="email" type="email" autoComplete="email" required />
            </label>
            <SubmitButton>Enviar enlace</SubmitButton>
            <a className="btn ghost" href="/login">Volver al ingreso</a>
          </form>
        ) : (
          <form className="f" action={login}>
            <label htmlFor="email">
              Correo
              <input id="email" name="email" type="email" autoComplete="email" required />
            </label>
            <label htmlFor="password">
              Contraseña
              <input id="password" name="password" type="password" autoComplete="current-password" required />
            </label>
            <SubmitButton>Ingresar</SubmitButton>
            <a className="btn ghost" href="/login?olvide=1">Olvidé mi contraseña</a>
          </form>
        )}
      </section>
    </div>
  );
}
