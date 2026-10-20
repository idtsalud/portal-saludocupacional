/** Datos de contacto de IDT usados en todo el portal. Cambiar acá si cambian los números. */
export const CONTACTO = {
  whatsappComercial: "5491126320855",
  whatsappComercialTexto: "11 2632-0855",
  telefonoIdt: "11 2120-4550",
  email: "comercial@idtsalud.com.ar",
};

/** Enlace de WhatsApp a Comercial con el mensaje ya escrito. */
export const waComercial = (mensaje: string) =>
  `https://wa.me/${CONTACTO.whatsappComercial}?text=${encodeURIComponent(mensaje)}`;
