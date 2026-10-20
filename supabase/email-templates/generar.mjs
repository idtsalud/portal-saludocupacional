// Genera las plantillas de correo de Supabase Auth con el diseño de SaludOcupacional.
// Uso: node supabase/email-templates/generar.mjs  → escribe un .html por plantilla y un asuntos.txt
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = dirname(fileURLToPath(import.meta.url));
const LOGO = "https://app.saludocupacional.com.ar/mail/logo.png";
const C = { bg: "#eef3f9", card: "#ffffff", navy: "#001b5a", ink: "#0b1f3f", muted: "#56688a", line: "#dbe4ef", blue: "#0052fd", soft: "#e6eeff" };
const FONT = "Arial,Helvetica,sans-serif";

const button = (label) => `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px">
  <tr><td bgcolor="${C.blue}" style="border-radius:10px">
    <a href="{{ .ConfirmationURL }}" target="_blank" style="display:inline-block;padding:14px 26px;font-family:${FONT};font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:10px">${label}</a>
  </td></tr>
</table>`;

const code = () => `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px">
  <tr><td bgcolor="${C.soft}" style="border-radius:10px;padding:16px 28px;font-family:${FONT};font-size:28px;font-weight:bold;letter-spacing:6px;color:${C.navy}">{{ .Token }}</td></tr>
</table>`;

const list = (items) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 24px;background:${C.bg};border-radius:10px">
  <tr><td style="padding:16px 20px;font-family:${FONT};font-size:14px;line-height:22px;color:${C.ink}">
    ${items.map((t) => `<div style="padding:3px 0">&#10003;&nbsp; ${t}</div>`).join("\n    ")}
  </td></tr>
</table>`;

function layout({ preheader, title, intro, action, extra = "", note }) {
  return `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background:${C.bg}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.bg}">
<tr><td align="center" style="padding:32px 16px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px">
    <tr><td style="padding:0 4px 20px"><img src="${LOGO}" width="220" alt="SaludOcupacional.com.ar by IDT" style="display:block;width:220px;max-width:100%;height:auto;border:0"></td></tr>
    <tr><td bgcolor="${C.card}" style="border:1px solid ${C.line};border-radius:16px;padding:36px 32px">
      <h1 style="margin:0 0 14px;font-family:${FONT};font-size:22px;line-height:28px;color:${C.navy}">${title}</h1>
      <p style="margin:0 0 20px;font-family:${FONT};font-size:15px;line-height:24px;color:${C.ink}">${intro}</p>
      ${extra}
      ${action}
      <p style="margin:0;font-family:${FONT};font-size:13px;line-height:20px;color:${C.muted}">${note}</p>
    </td></tr>
    <tr><td style="padding:22px 8px 0;font-family:${FONT};font-size:12px;line-height:19px;color:${C.muted}" align="center">
      ¿Necesitás ayuda? Escribinos a <a href="mailto:comercial@idtsalud.com.ar" style="color:${C.blue}">comercial@idtsalud.com.ar</a> o por WhatsApp al 11 2632-0855.<br>
      SaludOcupacional.com.ar by IDT · Instituto del Trabajador · Sedes Campana y Zárate
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}

const IGNORE = "Si no esperabas este correo, podés ignorarlo: no se va a hacer ningún cambio en tu cuenta.";

const T = {
  "invitar-usuario": {
    subject: "Tu acceso al Portal SaludOcupacional",
    html: layout({
      preheader: "Creá tu contraseña y empezá a usar el portal de clientes de IDT.",
      title: "Te damos la bienvenida al portal",
      intro: "IDT te invitó al Portal SaludOcupacional, el lugar donde tu empresa gestiona todo su servicio de salud ocupacional.",
      extra: list(["Pedí exámenes y turnos, y seguí cada pedido", "Descargá tu certificado, campañas y kits", "Hablá directo con tu equipo IDT"]),
      action: button("Crear mi contraseña"),
      note: `El enlace vence en 24 horas. ${IGNORE}`,
    }),
  },
  "restablecer-contrasena": {
    subject: "Creá una contraseña nueva para el portal",
    html: layout({
      preheader: "Recibimos un pedido para cambiar tu contraseña.",
      title: "Creá una contraseña nueva",
      intro: "Recibimos un pedido para cambiar la contraseña de tu cuenta del Portal SaludOcupacional. Tocá el botón para elegir una nueva.",
      action: button("Crear contraseña nueva"),
      note: `El enlace vence en 1 hora. Si no lo pediste vos, ignorá este correo: tu contraseña actual sigue funcionando.`,
    }),
  },
  "confirmar-registro": {
    subject: "Confirmá tu correo en el Portal SaludOcupacional",
    html: layout({
      preheader: "Un paso más para activar tu cuenta.",
      title: "Confirmá tu correo",
      intro: "Para activar tu cuenta del Portal SaludOcupacional, confirmá que este correo es tuyo.",
      action: button("Confirmar mi correo"),
      note: IGNORE,
    }),
  },
  "enlace-de-acceso": {
    subject: "Tu enlace para entrar al portal",
    html: layout({
      preheader: "Entrá al portal con un clic.",
      title: "Entrá al portal",
      intro: "Usá este botón para entrar al Portal SaludOcupacional sin escribir tu contraseña.",
      action: button("Entrar al portal"),
      note: `El enlace sirve una sola vez y vence en 1 hora. ${IGNORE}`,
    }),
  },
  "cambio-de-correo": {
    subject: "Confirmá tu nuevo correo",
    html: layout({
      preheader: "Confirmá el cambio de correo de tu cuenta.",
      title: "Confirmá tu nuevo correo",
      intro: "Pediste cambiar el correo de tu cuenta de <b>{{ .Email }}</b> a <b>{{ .NewEmail }}</b>. Confirmalo con el botón.",
      action: button("Confirmar el cambio"),
      note: `Si no pediste este cambio, escribinos cuanto antes a comercial@idtsalud.com.ar.`,
    }),
  },
  "verificar-identidad": {
    subject: "Tu código de verificación: {{ .Token }}",
    html: layout({
      preheader: "Usá este código para confirmar que sos vos.",
      title: "Confirmá que sos vos",
      intro: "Para completar esta acción en el Portal SaludOcupacional, ingresá este código:",
      action: code(),
      note: `El código vence en pocos minutos. Si no lo pediste, ignorá este correo y avisanos.`,
    }),
  },
};

const subjects = [];
for (const [name, t] of Object.entries(T)) {
  writeFileSync(join(DIR, `${name}.html`), t.html, "utf8");
  subjects.push(`${name}: ${t.subject}`);
}
writeFileSync(join(DIR, "asuntos.txt"), subjects.join("\n") + "\n", "utf8");
console.log(subjects.join("\n"));
