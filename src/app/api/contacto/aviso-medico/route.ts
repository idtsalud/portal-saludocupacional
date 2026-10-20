import { CONTACTO } from "@/lib/contacto";

/** Tarjeta de contacto (vCard) para agendar Aviso Médico en el celular. */
export function GET() {
  const vcard = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    "N:Médico;Aviso;;;",
    "FN:Aviso Médico · SaludOcupacional",
    "ORG:IDT · SaludOcupacional",
    `TEL;TYPE=CELL:+${CONTACTO.avisoMedico}`,
    "NOTE:Escribí por WhatsApp para avisar que no vas a poder ir a trabajar.",
    "END:VCARD",
    "",
  ].join("\r\n");
  return new Response(vcard, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": 'attachment; filename="aviso-medico.vcf"',
    },
  });
}
