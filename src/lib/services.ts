/** Catálogo de servicios (las claves coinciden con la tabla `services`) y servicios que trae cada plan. */
export type ServiceKey =
  | "medico_referente"
  | "atencion_sedes"
  | "telemedicina"
  | "precio_preferencial"
  | "licencias_accidentes"
  | "aviso_medico"
  | "nume"
  | "academia"
  | "campanas"
  | "ruta_saludable"
  | "medicheck"
  | "capacitaciones";

const BASE: ServiceKey[] = ["medico_referente", "atencion_sedes", "telemedicina", "precio_preferencial", "licencias_accidentes"];

export type PlanPreset = {
  key: string;
  kind: "empresa" | "comercio";
  name: string;
  units: number;
  services: ServiceKey[];
};

/**
 * Propuesta de servicios por plan. IDT la aplica con un clic al crear o editar un cliente,
 * y después puede tildar o destildar servicios sueltos.
 */
export const PLAN_PRESETS: PlanPreset[] = [
  { key: "comercio", kind: "comercio", name: "Plan Comercio", units: 15, services: [...BASE, "campanas"] },
  { key: "comercio_plus", kind: "comercio", name: "Plan Comercio Plus", units: 15, services: [...BASE, "campanas", "aviso_medico", "nume", "academia"] },
  { key: "esencial", kind: "empresa", name: "Plan Esencial", units: 15, services: [...BASE] },
  { key: "integral", kind: "empresa", name: "Plan Integral", units: 30, services: [...BASE, "campanas", "ruta_saludable"] },
  {
    key: "corporativo",
    kind: "empresa",
    name: "Plan Corporativo",
    units: 60,
    services: [...BASE, "campanas", "ruta_saludable", "aviso_medico", "nume", "academia", "medicheck", "capacitaciones"],
  },
];

export const presetByKey = (k: string) => PLAN_PRESETS.find((p) => p.key === k);
