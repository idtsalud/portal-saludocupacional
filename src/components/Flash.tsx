const MESSAGES: Record<string, string> = {
  pedido: "Pedido enviado a Coordinación de exámenes. Lo ves abajo, en Tus pedidos.",
  caso: "Caso registrado. El médico referente hace el seguimiento.",
  invitado: "Invitación enviada. La persona crea su contraseña desde el correo.",
  clave: "Contraseña guardada. Ya estás dentro del portal.",
  org: "Datos del cliente guardados.",
  cliente: "Cliente creado. Ahora invitá a su administrador desde esta ficha.",
  cliente_invitado: "Cliente creado. A su administrador le llegó la invitación por correo.",
  sumar: "Listo, le avisamos a IDT. Te contactamos para sumar el servicio.",
  solicitud: "Solicitud enviada. Te respondemos por acá y por los medios de siempre.",
  publicado: "Publicado. Ya lo ven los clientes a los que está dirigido.",
  guardado: "Cambios guardados.",
  plan: "Plan guardado.",
  quitado: "Listo: esa persona ya no tiene acceso al portal.",
  rol: "Rol actualizado. Lo ve la próxima vez que entre al portal.",
  servicios:"Servicios actualizados. El cliente ya los ve en su portal.",
  estado: "Estado actualizado.",
  doc: "Documento subido.",
  sync: "Avisos sincronizados.",
};
const ERRORS: Record<string, string> = {
  permiso: "Tu usuario no tiene permiso para hacer esto. Pedíselo a quien administra el portal en tu empresa.",
  datos: "Faltan datos obligatorios.",
  propio: "No podés cambiar tu propio rol ni quitarte el acceso. Pedíselo a otro administrador.",
  invitar: "No pudimos enviar la invitación. Revisá el correo o probá más tarde.",
  fallo: "No pudimos guardar. Probá de nuevo en unos minutos.",
  demo: "Esta es una cuenta de demostración: la contraseña no se puede cambiar.",
};

export function Flash({ ok, error }: { ok?: string; error?: string }) {
  if (ok && MESSAGES[ok]) return <p className="flash ok" role="status">{MESSAGES[ok]}</p>;
  if (error) return <p className="flash err" role="alert">{ERRORS[error] ?? "Algo salió mal."}</p>;
  return null;
}
