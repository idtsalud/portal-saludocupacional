/**
 * Cómo se leen las columnas de la planilla de Aviso Médico.
 * Cada campo lista los encabezados posibles (se comparan sin mayúsculas ni acentos).
 * Ajustar cuando tengamos la planilla real: es el único lugar que hay que tocar.
 *
 * Importante: NO se lee ninguna columna de diagnóstico o síntoma. El portal no la guarda ni la muestra.
 */
export const AVISOS_COLUMNS = {
  id: ["id", "id aviso", "numero", "nro", "n°"],
  company: ["empresa", "cliente", "razon social", "organizacion"],
  receivedAt: ["fecha", "fecha aviso", "fecha y hora", "timestamp", "marca temporal"],
  collaborator: ["colaborador", "empleado", "nombre", "apellido y nombre", "nombre y apellido"],
  days: ["dias", "dias de reposo", "cantidad de dias", "reposo"],
  certificate: ["certificado", "estado certificado", "certificado recibido"],
  status: ["estado", "estado aviso", "situacion"],
} as const;
