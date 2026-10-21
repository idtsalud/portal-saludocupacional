import { prettyStatus } from "@/lib/avisos-sync";

/** Estados del seguimiento médico de un aviso, en el orden del circuito. */
export const MEDICAL_STATUS: Record<string, { label: string; tone: string; open: boolean }> = {
  pendiente_contacto: { label: "Pendiente de contacto", tone: "warn", open: true },
  contactado_telemedicina: { label: "Atendido por telemedicina", tone: "info", open: true },
  contactado_whatsapp: { label: "Contactado por WhatsApp", tone: "info", open: true },
  reposo_validado: { label: "Reposo validado", tone: "ok", open: false },
  informe_cargado: { label: "Informe en historia clínica", tone: "ok", open: false },
  cerrado: { label: "Cerrado", tone: "off", open: false },
};

/** Estado que se muestra: el del médico si lo cargó; si no, el que viene de la planilla. */
export function shownStatus(a: { medical_status?: string | null; status: string | null }) {
  const m = a.medical_status ? MEDICAL_STATUS[a.medical_status] : null;
  if (m) return { label: m.label, tone: m.tone, open: m.open };
  const pending = /pendiente/i.test(a.status ?? "") || !a.status;
  return { label: a.status ? prettyStatus(a.status) : "Pendiente de contacto", tone: pending ? "warn" : "info", open: pending };
}
