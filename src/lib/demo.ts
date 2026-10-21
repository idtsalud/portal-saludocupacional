/** Cuenta demo que se comparte con empresas interesadas: tiene datos de ejemplo y no se modifica desde el portal. */
export const DEMO_EMAIL = "demo@saludocupacional.com.ar";

export const isDemoEmail = (email?: string | null) => (email ?? "").toLowerCase() === DEMO_EMAIL;
