"use client";

import { Icon } from "./Icon";

/** Abre el diálogo de impresión del navegador, desde donde también se guarda como PDF. */
export function PrintButton({ label = "Imprimir o guardar PDF" }: { label?: string }) {
  return (
    <button type="button" className="btn sec" onClick={() => window.print()}>
      <Icon name="doc" />
      {label}
    </button>
  );
}
