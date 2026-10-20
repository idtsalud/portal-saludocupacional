const MESSAGES: Record<string, string> = {
  pedido: "Pedido enviado a Coordinación de exámenes. Lo ves abajo, en Tus pedidos.",
  caso: "Caso registrado. El médico referente hace el seguimiento.",
  invitado: "Invitación enviada. La persona crea su contraseña desde el correo.",
  clave: "Contraseña guardada. Ya estás dentro del portal.",
  org: "Organización guardada.",
  servicios: "Servicios actualizados. El cliente ya los ve en su portal.",
  estado: "Estado actualizado.",
  doc: "Documento subido.",
  sync: "Avisos sincronizados.",
};
const ERRORS: Record<string, string> = {
  permiso: "Tu usuario no tiene permiso para hacer esto. Pedíselo a quien administra el portal en tu empresa.",
  datos: "Faltan datos obligatorios.",
  invitar: "No pudimos enviar la invitación. Revisá el correo o probá más tarde.",
  fallo: "No pudimos guardar. Probá de nuevo en unos minutos.",
};

export function Flash({ ok, error }: { ok?: string; error?: string }) {
  if (ok && MESSAGES[ok]) return <p className="flash ok" role="status">{MESSAGES[ok]}</p>;
  if (error) return <p className="flash err" role="alert">{ERRORS[error] ?? "Algo salió mal."}</p>;
  return null;
}
