import { redirect } from "next/navigation";
import { Logo } from "@/components/Icon";
import { SubmitButton } from "@/components/SubmitButton";
import { createClient } from "@/lib/supabase/server";

async function setPassword(formData: FormData) {
  "use server";
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 10) redirect("/auth/nueva-clave?error=corta");
  if (password !== confirm) redirect("/auth/nueva-clave?error=distintas");

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect("/auth/nueva-clave?error=fallo");
  redirect("/?ok=clave");
}

const ERRORS: Record<string, string> = {
  corta: "La contraseña tiene que tener al menos 10 caracteres.",
  distintas: "Las dos contraseñas no coinciden.",
  fallo: "No pudimos guardar la contraseña. Probá de nuevo o pedí un enlace nuevo.",
};

export default async function NuevaClave({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?error=enlace");

  return (
    <div className="narrow">
      <section className="card" style={{ display: "grid", gap: 16 }}>
        <div style={{ background: "var(--side)", borderRadius: 10, padding: 12 }}>
          <Logo />
        </div>
        <div>
          <h1>Creá tu contraseña</h1>
          <p className="muted" style={{ marginTop: 4 }}>
            Para {user.email}. Usá al menos 10 caracteres.
          </p>
        </div>
        {sp.error && <p className="flash err">{ERRORS[sp.error]}</p>}
        <form className="f" action={setPassword}>
          <label htmlFor="password">
            Contraseña nueva
            <input id="password" name="password" type="password" autoComplete="new-password" minLength={10} required />
          </label>
          <label htmlFor="confirm">
            Repetir contraseña
            <input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={10} required />
          </label>
          <SubmitButton>Guardar y entrar</SubmitButton>
        </form>
      </section>
    </div>
  );
}
