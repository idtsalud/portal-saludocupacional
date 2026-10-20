/**
 * Envía los avisos de la hoja "Avisos" al Portal SaludOcupacional cada 10 minutos.
 * Va en la planilla "Aviso Medico - IDT": Extensiones → Apps Script → pegar este código.
 *
 * Solo se envían: id_aviso, fecha_hora, empresa, colaborador, certificado, reposo_indicado y estado.
 * El motivo y cualquier dato de salud NO salen de la planilla.
 *
 * Configuración (una sola vez):
 * 1. Configuración del proyecto (engranaje) → Propiedades de la secuencia de comandos →
 *    agregar la propiedad PORTAL_SECRET con la clave que te da IDT (la misma CRON_SECRET del portal).
 * 2. Elegir la función "instalarEnvioAutomatico" y tocar Ejecutar. Autorizar los permisos que pide Google.
 * 3. Elegir la función "enviarAvisos" y tocar Ejecutar para mandar los avisos de inmediato.
 */

var PORTAL_URL = "https://app.saludocupacional.com.ar/api/avisos/ingest";
var HOJA = "Avisos";
var CAMPOS = ["id_aviso", "fecha_hora", "empresa", "colaborador", "certificado", "reposo_indicado", "estado"];

function enviarAvisos() {
  var secreto = PropertiesService.getScriptProperties().getProperty("PORTAL_SECRET");
  if (!secreto) throw new Error("Falta la propiedad PORTAL_SECRET (ver instrucciones arriba).");

  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA);
  var valores = hoja.getDataRange().getValues();
  if (valores.length < 2) return;

  var encabezado = valores[0].map(function (h) { return String(h).trim().toLowerCase(); });
  var columna = {};
  CAMPOS.forEach(function (c) { columna[c] = encabezado.indexOf(c); });
  if (columna.id_aviso < 0 || columna.fecha_hora < 0 || columna.empresa < 0 || columna.colaborador < 0) {
    throw new Error("La hoja " + HOJA + " no tiene las columnas id_aviso, fecha_hora, empresa y colaborador.");
  }

  var filas = [];
  for (var i = 1; i < valores.length; i++) {
    var fila = valores[i];
    if (!fila[columna.id_aviso]) continue;
    var aviso = {};
    CAMPOS.forEach(function (c) {
      if (columna[c] < 0) return;
      var v = fila[columna[c]];
      aviso[c] = v instanceof Date ? v.toISOString() : String(v).trim();
    });
    filas.push(aviso);
  }

  var respuesta = UrlFetchApp.fetch(PORTAL_URL, {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + secreto },
    payload: JSON.stringify({ rows: filas }),
    muteHttpExceptions: true,
  });
  Logger.log(respuesta.getResponseCode() + " " + respuesta.getContentText());
  if (respuesta.getResponseCode() !== 200) throw new Error("El portal respondió " + respuesta.getResponseCode() + ": " + respuesta.getContentText());
}

function instalarEnvioAutomatico() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "enviarAvisos") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("enviarAvisos").timeBased().everyMinutes(10).create();
  Logger.log("Listo: los avisos se envían al portal cada 10 minutos.");
}
