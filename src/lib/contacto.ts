/** Datos de contacto de IDT usados en todo el portal. Cambiar acá si cambian los números. */
export const CONTACTO = {
  whatsappComercial: "5491126320855",
  whatsappComercialTexto: "11 2632-0855",
  telefonoIdt: "11 2120-4550",
  email: "comercial@idtsalud.com.ar",
  /** Agente de IA que recibe los avisos de ausencia. */
  avisoMedico: "5493489635500",
  avisoMedicoTexto: "3489 63-5500",
  /** NUME (Nuevo Método): plataforma de bienestar para colaboradores. */
  numeUrl: "https://nuevometodo.com",
};

const wa = (numero: string, mensaje: string) => `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;

/** Enlace de WhatsApp a Comercial con el mensaje ya escrito. */
export const waComercial = (mensaje: string) => wa(CONTACTO.whatsappComercial, mensaje);

/** Enlace de WhatsApp a Aviso Médico con el mensaje ya escrito. */
export const waAvisoMedico = (mensaje: string) => wa(CONTACTO.avisoMedico, mensaje);
