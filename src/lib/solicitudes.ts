export const SOLICITUD_KIND: Record<string, string> = {
  servicio: "Sumar un servicio",
  problema: "Problema en el portal",
  consulta: "Consulta",
};

export const SOLICITUD_STATUS: Record<string, { label: string; tone: string }> = {
  nueva: { label: "Recibida", tone: "info" },
  en_curso: { label: "En curso", tone: "warn" },
  resuelta: { label: "Resuelta", tone: "ok" },
  descartada: { label: "Cerrada", tone: "off" },
};

/** Solicitudes que todavía esperan respuesta de IDT. */
export const OPEN_STATUSES = ["nueva", "en_curso"];
