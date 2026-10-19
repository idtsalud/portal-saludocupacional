const TZ = "America/Argentina/Buenos_Aires";

export const fmtDate = (d: string | Date | null | undefined) =>
  d ? new Intl.DateTimeFormat("es-AR", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(d)) : "—";

export const fmtDateTime = (d: string | Date | null | undefined) =>
  d
    ? new Intl.DateTimeFormat("es-AR", { timeZone: TZ, day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(d))
    : "—";

export const fmtLongToday = () =>
  new Intl.DateTimeFormat("es-AR", { timeZone: TZ, weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());

export const STATUS: Record<string, { label: string; tone: string }> = {
  recibido: { label: "Recibido", tone: "info" },
  coordinado: { label: "Turno coordinado", tone: "warn" },
  realizado: { label: "Realizado", tone: "ok" },
  resultados: { label: "Resultados disponibles", tone: "ok" },
  cancelado: { label: "Cancelado", tone: "off" },
};

export const firstName = (full: string) => full.trim().split(/\s+/)[0] ?? "";

export const waLink = (digits: string | null) => (digits ? `https://wa.me/${digits.replace(/\D/g, "")}` : null);
