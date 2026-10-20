/** Claves del catálogo de servicios (coinciden con la tabla `services`). Los planes se administran en la tabla `plans`. */
export const SERVICE_KEYS = [
  "medico_referente",
  "atencion_sedes",
  "telemedicina",
  "precio_preferencial",
  "licencias_accidentes",
  "aviso_medico",
  "nume",
  "academia",
  "campanas",
  "ruta_saludable",
  "medicheck",
  "capacitaciones",
] as const;

export type ServiceKey = (typeof SERVICE_KEYS)[number];
