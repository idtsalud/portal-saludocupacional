import Link from "next/link";

/** Aviso para el personal de IDT: qué vista del portal está mirando y cómo cambiarla. */
export function StaffBar({ view }: { view: string }) {
  return (
    <div className="staffbar" role="note">
      <span>Vista de administración: estás viendo el portal como <b>{view}</b>.</span>
      <span className="staffbar-links">
        <Link href="/admin/ver-como">Cambiar vista</Link>
        <Link href="/admin">Volver a Administración</Link>
      </span>
    </div>
  );
}
