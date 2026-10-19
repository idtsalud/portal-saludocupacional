import { logout } from "@/app/login/actions";

export default function SinAcceso() {
  return (
    <div className="narrow">
      <section className="card" style={{ display: "grid", gap: 12 }}>
        <h1>Tu usuario todavía no tiene una empresa asignada</h1>
        <p className="muted">
          Escribile a tu referente de IDT para que te asigne a tu empresa. Apenas lo haga, vas a poder entrar.
        </p>
        <form action={logout}>
          <button className="btn sec" type="submit">Salir</button>
        </form>
      </section>
    </div>
  );
}
