"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Destino del enlace de invitación con la plantilla de correo por defecto de Supabase.
 * Supabase devuelve la sesión en el fragmento (#access_token=…), que solo el navegador puede leer.
 */
export default function Aceptar() {
  const [msg, setMsg] = useState("Validando tu invitación…");

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const next = search.get("next")?.startsWith("/") ? search.get("next")! : "/auth/nueva-clave";

    const code = search.get("code");
    if (code) {
      window.location.replace(`/auth/confirm?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`);
      return;
    }

    const hash = new URLSearchParams(window.location.hash.slice(1));
    const access_token = hash.get("access_token");
    const refresh_token = hash.get("refresh_token");
    if (!access_token || !refresh_token) {
      setMsg("El enlace venció o ya se usó. Pedile a IDT una invitación nueva.");
      return;
    }
    createClient()
      .auth.setSession({ access_token, refresh_token })
      .then(({ error }) => {
        if (error) setMsg("No pudimos validar la invitación. Pedile a IDT una nueva.");
        else window.location.replace(next);
      });
  }, []);

  return (
    <div className="narrow">
      <section className="card">
        <p role="status">{msg}</p>
      </section>
    </div>
  );
}
