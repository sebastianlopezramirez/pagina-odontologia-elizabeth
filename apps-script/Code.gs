/**
 * ============================================
 * ARCHIVO: /apps-script/Code.gs
 * PROYECTO: Web App de citas — Dra. Elizabeth Guzmán Odontología
 * PLATAFORMA: Google Apps Script (gratuito, sin límites de envíos propios)
 * ESTRUCTURA:
 *   - doPost(e): recibe el formulario de agendar.html vía fetch POST
 *   - guardarEnSheets(datos): escribe en Google Sheets
 *   - enviarEmailPaciente(datos): correo de confirmación al paciente
 *   - enviarNotificacionDoctora(datos): aviso a la doctora
 *   - validarDatos(datos): valida que vengan los campos obligatorios
 *   - respuestaExito() / respuestaError(msg): helpers de respuesta JSON
 * CÓMO DESPLEGAR: ver /apps-script/README.md
 * ============================================
 */

/**
 * ============================================
 * CONFIGURACIÓN GLOBAL
 * Centraliza los valores que podrías necesitar cambiar.
 * IMPORTANTE: reemplaza los valores con los reales antes de desplegar.
 * ============================================
 */
var CONFIG = {
  /**
   * EMAIL_DOCTORA: el correo donde la Dra. Elizabeth recibe notificaciones
   * de cada nueva solicitud de cita.
   * CAMBIA ESTO antes de desplegar.
   */
  EMAIL_DOCTORA: 'consultorio@elizabethguzman.com',

  /**
   * NOMBRE_CONSULTORIO: aparece en los asuntos y cuerpos de los correos.
   */
  NOMBRE_CONSULTORIO: 'Dra. Elizabeth Guzmán — Odontología Estética y Especializada',

  /**
   * TELEFONO_CONSULTORIO: se incluye en el email al paciente para que
   * pueda llamar si necesita cambiar su cita.
   */
  TELEFONO_CONSULTORIO: '604 2716000',

  /**
   * WHATSAPP_CONSULTORIO: número sin + para el link wa.me
   */
  WHATSAPP: '573222614315',

  /**
   * URL_SITIO: aparece en los correos como enlace al sitio
   */
  URL_SITIO: 'https://elizabethguzman.com',

  /**
   * SPREADSHEET_ID: ID del Google Spreadsheet donde se guardan las citas.
   *
   * OPCIÓN A (recomendada): script vinculado al Spreadsheet desde
   *   Extensiones → Apps Script dentro del Spreadsheet.
   *   → Deja este campo vacío: ''
   *   → El script usará SpreadsheetApp.getActiveSpreadsheet() automáticamente.
   *
   * OPCIÓN B: script independiente (creado en script.new).
   *   → Pon aquí el ID del Spreadsheet (la parte entre /d/ y /edit en la URL).
   *   → Ejemplo: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms'
   */
  SPREADSHEET_ID: '',

  /**
   * NOMBRE_HOJA: el nombre de la pestaña en Google Sheets donde se guardan las citas.
   * Si la hoja no existe, el script la crea automáticamente.
   */
  NOMBRE_HOJA: 'Solicitudes de Citas',

  /**
   * COLUMNAS: el orden de las columnas en la hoja de cálculo.
   * Si quieres añadir una columna, agrégala aquí y en guardarEnSheets().
   */
  COLUMNAS: [
    'Fecha de Recepción',
    'Estado',
    'Nombre Paciente',
    'Teléfono',
    'Email',
    'Servicio',
    'Fecha Preferida',
    'Hora Preferida',
    'Mensaje',
    'Origen URL',
    'Timestamp ISO',
  ],
};

/**
 * ============================================
 * MAPA DE NOMBRES DE SERVICIOS
 * Convierte el value del <select> en texto legible
 * para los correos y la hoja de cálculo.
 * ============================================
 */
var NOMBRES_SERVICIOS = {
  'valoracion-general':  'Valoración General',
  'limpieza':            'Limpieza e Higiene Oral',
  'ortodoncia':          'Ortodoncia',
  'implantes':           'Implantes Dentales',
  'estetica':            'Estética Dental',
  'endodoncia':          'Endodoncia (Conducto)',
  'periodoncia':         'Periodoncia (Encías)',
  'odontopediatria':     'Odontopediatría',
  'urgencia':            'Urgencia Dental',
  'otro':                'Consulta General',
};

/**
 * ============================================
 * FUNCIÓN PRINCIPAL: doPost(e)
 * ============================================
 * NOMBRE: doPost
 * PROPÓSITO: Punto de entrada del Web App cuando recibe un POST.
 *            Apps Script llama esta función automáticamente cuando
 *            fetch() desde agenda.js hace POST a la URL del Web App.
 * PARAMS:
 *   e (Object) — el evento de Apps Script con:
 *     e.postData.contents: el body del POST como string JSON
 *     e.postData.type: el Content-Type (application/json)
 * RETORNA: ContentService.createTextOutput — respuesta JSON al navegador
 */
function doPost(e) {
  /**
   * El try/catch global garantiza que SIEMPRE devolvemos una respuesta JSON,
   * incluso si hay un error inesperado. Así agenda.js puede manejar el error
   * correctamente sin que el fetch quede colgado.
   */
  try {
    /* PASO 1: Parsear el body JSON que envió agenda.js */
    var datos;
    try {
      /**
       * e.postData.contents contiene el body del POST como string.
       * JSON.parse() lo convierte en un objeto JavaScript.
       */
      datos = JSON.parse(e.postData.contents);
    } catch (parseError) {
      /**
       * Si el body no es JSON válido, devolvemos error 400 (bad request).
       * Esto puede pasar si alguien llama al endpoint manualmente con datos mal formados.
       */
      return respuestaError('El cuerpo de la solicitud no es JSON válido.');
    }

    /* PASO 2: Validar que los campos obligatorios estén presentes */
    var erroresValidacion = validarDatos(datos);
    if (erroresValidacion) {
      return respuestaError('Datos incompletos: ' + erroresValidacion);
    }

    /* PASO 3: Guardar en Google Sheets */
    guardarEnSheets(datos);

    /* PASO 4: Enviar email de confirmación al paciente (si proporcionó email) */
    if (datos.email && datos.email.trim() !== '') {
      enviarEmailPaciente(datos);
    }

    /* PASO 5: Notificar a la doctora por email */
    enviarNotificacionDoctora(datos);

    /* PASO 6: Respuesta de éxito al navegador */
    return respuestaExito();

  } catch (errorGeneral) {
    /**
     * Cualquier error no capturado llega aquí.
     * Registramos el error en el log de Apps Script (visible en Editor > Ejecuciones)
     * y devolvemos un error genérico al navegador.
     */
    console.error('[doPost] Error general:', errorGeneral.message, errorGeneral.stack);
    return respuestaError('Error interno del servidor. Por favor intenta de nuevo.');
  }
}

/**
 * ============================================
 * FUNCIÓN: validarDatos(datos)
 * ============================================
 * NOMBRE: validarDatos
 * PROPÓSITO: Verifica que los campos obligatorios estén presentes
 *            y no estén vacíos. La validación principal la hace agenda.js
 *            en el cliente, pero siempre validamos también en el servidor
 *            por seguridad (nunca confíes solo en el cliente).
 * PARAMS:
 *   datos (Object) — el objeto parseado del body del POST
 * RETORNA:
 *   null si todo está bien
 *   string con la descripción del error si falta algo
 */
function validarDatos(datos) {
  /* Verificamos que sea una solicitud de nuestro formulario */
  if (!datos.formulario || datos.formulario !== 'cita-odontologia') {
    return 'Formulario no reconocido.';
  }

  /* Nombre obligatorio */
  if (!datos.nombre || datos.nombre.trim().length < 2) {
    return 'El nombre del paciente es obligatorio.';
  }

  /* Teléfono obligatorio */
  if (!datos.telefono || datos.telefono.trim() === '') {
    return 'El teléfono del paciente es obligatorio.';
  }

  /* Servicio obligatorio */
  if (!datos.servicio || datos.servicio.trim() === '') {
    return 'El servicio es obligatorio.';
  }

  /* Todo bien */
  return null;
}

/**
 * ============================================
 * FUNCIÓN: guardarEnSheets(datos)
 * ============================================
 * NOMBRE: guardarEnSheets
 * PROPÓSITO: Escribe una nueva fila en Google Sheets con los datos
 *            de la solicitud de cita.
 *            Si la hoja no existe, la crea con encabezados.
 * PARAMS:
 *   datos (Object) — los datos del formulario
 * RETORNA: void
 * NOTAS:
 *   SpreadsheetApp.getActiveSpreadsheet() funciona porque el script
 *   está vinculado al Spreadsheet (deploydado desde él). Si usas un
 *   script independiente, usa SpreadsheetApp.openById('TU_ID').
 */
function guardarEnSheets(datos) {
  /**
   * Obtenemos el Spreadsheet según la configuración:
   * - Si CONFIG.SPREADSHEET_ID está vacío (''), usamos getActiveSpreadsheet()
   *   (funciona cuando el script está vinculado al Spreadsheet — Opción A del README).
   * - Si CONFIG.SPREADSHEET_ID tiene un ID, abrimos ese Spreadsheet
   *   (funciona para scripts independientes — Opción B del README).
   *
   * Esta lógica permite cambiar de Opción A a B solo editando el CONFIG,
   * sin tocar ninguna otra línea del código.
   */
  var spreadsheet = CONFIG.SPREADSHEET_ID && CONFIG.SPREADSHEET_ID !== ''
    ? SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();

  var hoja = spreadsheet.getSheetByName(CONFIG.NOMBRE_HOJA);

  /**
   * Si la hoja no existe todavía, la creamos con los encabezados.
   * Esto permite que el primer deploy funcione sin configuración manual.
   */
  if (!hoja) {
    hoja = spreadsheet.insertSheet(CONFIG.NOMBRE_HOJA);

    /* Añadimos los encabezados en la primera fila */
    hoja.getRange(1, 1, 1, CONFIG.COLUMNAS.length)
        .setValues([CONFIG.COLUMNAS]);

    /* Ponemos los encabezados en negrita para que sean legibles */
    hoja.getRange(1, 1, 1, CONFIG.COLUMNAS.length)
        .setFontWeight('bold');

    /**
     * Congelamos la primera fila para que los encabezados
     * siempre sean visibles al hacer scroll en la hoja.
     */
    hoja.setFrozenRows(1);
  }

  /**
   * Fecha y hora de recepción en zona horaria de Colombia (UTC-5).
   * Intl.DateTimeFormat garantiza el formato correcto sin librerías externas.
   */
  var ahora = new Date();
  var fechaRecepcion = Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    year:   'numeric',
    month:  '2-digit',
    day:    '2-digit',
    hour:   '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(ahora);

  /**
   * Nombre legible del servicio — usamos el mapa de nombres.
   * Si el servicio no está en el mapa, usamos el valor crudo.
   */
  var nombreServicio = NOMBRES_SERVICIOS[datos.servicio] || datos.servicio;

  /**
   * Construimos la fila que se añadirá a la hoja.
   * El orden DEBE coincidir con CONFIG.COLUMNAS.
   */
  var fila = [
    fechaRecepcion,                         /* Fecha de Recepción */
    'Pendiente',                            /* Estado (inicial siempre Pendiente) */
    datos.nombre    || '',                  /* Nombre Paciente */
    datos.telefono  || '',                  /* Teléfono */
    datos.email     || '',                  /* Email */
    nombreServicio,                         /* Servicio (nombre legible) */
    datos.fechaPreferida || 'Sin especificar', /* Fecha Preferida */
    datos.horaPreferida  || 'Sin especificar', /* Hora Preferida */
    datos.mensaje   || '',                  /* Mensaje */
    datos.origen    || '',                  /* Origen URL */
    datos.timestamp || '',                  /* Timestamp ISO */
  ];

  /**
   * appendRow() añade la fila al final de la hoja, después de la última fila con datos.
   * Es thread-safe para uso concurrente (varias citas al mismo tiempo).
   */
  hoja.appendRow(fila);

  /**
   * Autoajustamos el ancho de las columnas para que todo sea legible.
   * autoResizeColumns(inicio, cantidad) ajusta desde la columna 1 hasta la última.
   */
  hoja.autoResizeColumns(1, CONFIG.COLUMNAS.length);
}

/**
 * ============================================
 * FUNCIÓN: enviarEmailPaciente(datos)
 * ============================================
 * NOMBRE: enviarEmailPaciente
 * PROPÓSITO: Envía email de confirmación al paciente.
 *            Solo se ejecuta si el paciente proporcionó su email.
 * PARAMS:
 *   datos (Object) — los datos del formulario
 * RETORNA: void
 * NOTAS:
 *   MailApp.sendEmail() usa la cuota de Gmail del usuario del script.
 *   Cuota gratuita: 100 emails/día. Más que suficiente para una clínica pequeña.
 */
function enviarEmailPaciente(datos) {
  /* Nombre legible del servicio para el correo */
  var nombreServicio = NOMBRES_SERVICIOS[datos.servicio] || datos.servicio;

  /* Asunto del correo — claro y personalizado */
  var asunto = '✅ Tu solicitud de cita fue recibida — ' + CONFIG.NOMBRE_CONSULTORIO;

  /* Cuerpo del correo en HTML (permite formato más amigable) */
  var cuerpoHTML = [
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">',

    /* Encabezado con fondo negro y texto dorado */
    '<div style="background-color: #1a1a1a; padding: 24px; text-align: center;">',
    '<h1 style="color: #d4af37; margin: 0; font-size: 20px;">',
    CONFIG.NOMBRE_CONSULTORIO,
    '</h1>',
    '</div>',

    /* Cuerpo principal */
    '<div style="padding: 32px; background-color: #ffffff; border: 1px solid #e0e0e0;">',

    '<h2 style="color: #1a1a1a;">¡Solicitud recibida, ' + datos.nombre + '!</h2>',

    '<p style="color: #555; line-height: 1.6;">',
    'Hemos recibido tu solicitud de cita para <strong>' + nombreServicio + '</strong>. ',
    'Nuestro equipo la revisará y se comunicará contigo pronto para confirmar la fecha y hora.',
    '</p>',

    /* Resumen de la solicitud */
    '<div style="background-color: #f9f9f9; border-left: 4px solid #d4af37; padding: 16px; margin: 24px 0; border-radius: 4px;">',
    '<h3 style="margin-top: 0; color: #1a1a1a;">Resumen de tu solicitud:</h3>',
    '<table style="width: 100%; border-collapse: collapse; font-size: 14px;">',
    '<tr><td style="padding: 6px 0; font-weight: bold; color: #333; width: 40%;">Servicio:</td>',
    '<td style="color: #555;">' + nombreServicio + '</td></tr>',

    datos.fechaPreferida
      ? '<tr><td style="padding: 6px 0; font-weight: bold; color: #333;">Fecha preferida:</td>' +
        '<td style="color: #555;">' + datos.fechaPreferida + '</td></tr>'
      : '',

    datos.horaPreferida
      ? '<tr><td style="padding: 6px 0; font-weight: bold; color: #333;">Hora preferida:</td>' +
        '<td style="color: #555;">' + datos.horaPreferida + '</td></tr>'
      : '',

    '<tr><td style="padding: 6px 0; font-weight: bold; color: #333;">Teléfono registrado:</td>',
    '<td style="color: #555;">' + datos.telefono + '</td></tr>',

    '</table>',
    '</div>',

    /* Datos de contacto */
    '<p style="color: #555; line-height: 1.6;">',
    'Si necesitas cambiar algún dato o tienes una urgencia, contáctanos directamente:',
    '</p>',

    '<p style="margin: 8px 0;">',
    '📞 <a href="tel:+57' + CONFIG.TELEFONO_CONSULTORIO.replace(/\s/g, '') + '" style="color: #d4af37;">',
    CONFIG.TELEFONO_CONSULTORIO,
    '</a>',
    '</p>',

    '<p style="margin: 8px 0;">',
    '💬 <a href="https://wa.me/' + CONFIG.WHATSAPP + '?text=Hola%2C%20quiero%20consultar%20sobre%20mi%20solicitud%20de%20cita." style="color: #25d366;">',
    'WhatsApp',
    '</a>',
    '</p>',

    '</div>',

    /* Footer */
    '<div style="background-color: #f5f5f5; padding: 16px; text-align: center; font-size: 12px; color: #888;">',
    '<p>Este correo fue enviado desde ' + CONFIG.URL_SITIO + '</p>',
    '<p>Por favor no respondas a este correo directamente. Usa los datos de contacto de arriba.</p>',
    '</div>',

    '</div>',
  ].join('');

  /* Versión texto plano como fallback para clientes de correo que no soportan HTML */
  var cuerpoTexto = [
    '¡Hola, ' + datos.nombre + '!',
    '',
    'Recibimos tu solicitud de cita para: ' + nombreServicio,
    datos.fechaPreferida ? 'Fecha preferida: ' + datos.fechaPreferida : '',
    datos.horaPreferida  ? 'Hora preferida: '  + datos.horaPreferida  : '',
    '',
    'Te contactaremos pronto para confirmar.',
    '',
    'Teléfono: ' + CONFIG.TELEFONO_CONSULTORIO,
    'WhatsApp: https://wa.me/' + CONFIG.WHATSAPP,
    '',
    CONFIG.NOMBRE_CONSULTORIO,
    CONFIG.URL_SITIO,
  ].filter(Boolean).join('\n');

  /* Enviamos el email con MailApp */
  MailApp.sendEmail({
    to:       datos.email,
    subject:  asunto,
    htmlBody: cuerpoHTML,
    body:     cuerpoTexto, /* fallback texto plano */
  });
}

/**
 * ============================================
 * FUNCIÓN: enviarNotificacionDoctora(datos)
 * ============================================
 * NOMBRE: enviarNotificacionDoctora
 * PROPÓSITO: Envía una notificación breve a la doctora cada vez que
 *            llega una nueva solicitud de cita.
 *            Incluye todos los datos del paciente para que pueda
 *            contactarlo directamente desde el email.
 * PARAMS:
 *   datos (Object) — los datos del formulario
 * RETORNA: void
 */
function enviarNotificacionDoctora(datos) {
  var nombreServicio = NOMBRES_SERVICIOS[datos.servicio] || datos.servicio;

  /* Asunto con emoji para que destaque en la bandeja */
  var asunto = '🦷 Nueva solicitud de cita — ' + datos.nombre + ' (' + nombreServicio + ')';

  var cuerpoHTML = [
    '<div style="font-family: Arial, sans-serif; max-width: 600px;">',

    '<div style="background-color: #1a1a1a; padding: 16px 24px;">',
    '<h2 style="color: #d4af37; margin: 0; font-size: 18px;">Nueva solicitud de cita</h2>',
    '</div>',

    '<div style="padding: 24px; border: 1px solid #ddd;">',

    '<table style="width: 100%; border-collapse: collapse; font-size: 14px;">',

    '<tr style="border-bottom: 1px solid #eee;">',
    '<td style="padding: 10px 0; font-weight: bold; width: 35%;">Paciente:</td>',
    '<td style="padding: 10px 0;">' + datos.nombre + '</td>',
    '</tr>',

    '<tr style="border-bottom: 1px solid #eee;">',
    '<td style="padding: 10px 0; font-weight: bold;">Teléfono:</td>',
    '<td style="padding: 10px 0;">',
    '<a href="tel:' + datos.telefono.replace(/\s/g, '') + '" style="color: #1a1a1a;">',
    datos.telefono,
    '</a>',
    ' | ',
    '<a href="https://wa.me/57' + datos.telefono.replace(/[\s\+\-]/g, '') + '?text=Hola%20' +
    encodeURIComponent(datos.nombre) + '%2C%20soy%20la%20Dra.%20Elizabeth.%20Te%20contacto%20por%20tu%20solicitud%20de%20cita." style="color: #25d366;">',
    'WhatsApp',
    '</a>',
    '</td>',
    '</tr>',

    datos.email
      ? '<tr style="border-bottom: 1px solid #eee;">' +
        '<td style="padding: 10px 0; font-weight: bold;">Email:</td>' +
        '<td style="padding: 10px 0;"><a href="mailto:' + datos.email + '">' + datos.email + '</a></td>' +
        '</tr>'
      : '',

    '<tr style="border-bottom: 1px solid #eee;">',
    '<td style="padding: 10px 0; font-weight: bold;">Servicio:</td>',
    '<td style="padding: 10px 0; color: #d4af37; font-weight: bold;">' + nombreServicio + '</td>',
    '</tr>',

    datos.fechaPreferida
      ? '<tr style="border-bottom: 1px solid #eee;">' +
        '<td style="padding: 10px 0; font-weight: bold;">Fecha preferida:</td>' +
        '<td style="padding: 10px 0;">' + datos.fechaPreferida + '</td>' +
        '</tr>'
      : '',

    datos.horaPreferida
      ? '<tr style="border-bottom: 1px solid #eee;">' +
        '<td style="padding: 10px 0; font-weight: bold;">Hora preferida:</td>' +
        '<td style="padding: 10px 0;">' + datos.horaPreferida + '</td>' +
        '</tr>'
      : '',

    datos.mensaje
      ? '<tr>' +
        '<td style="padding: 10px 0; font-weight: bold;">Mensaje:</td>' +
        '<td style="padding: 10px 0; font-style: italic; color: #555;">' + datos.mensaje + '</td>' +
        '</tr>'
      : '',

    '</table>',

    '<div style="margin-top: 24px; padding: 12px; background-color: #f9f9f9; border-radius: 4px; font-size: 12px; color: #888;">',
    '<p style="margin: 0;">Recibido: ' + (datos.timestamp || new Date().toISOString()) + '</p>',
    '<p style="margin: 4px 0 0;">Origen: ' + (datos.origen || 'Desconocido') + '</p>',
    '</div>',

    '</div>',
    '</div>',
  ].filter(Boolean).join('');

  var cuerpoTexto = [
    'NUEVA SOLICITUD DE CITA',
    '========================',
    'Paciente: '  + datos.nombre,
    'Teléfono: '  + datos.telefono,
    datos.email   ? 'Email: '     + datos.email               : '',
    'Servicio: '  + nombreServicio,
    datos.fechaPreferida ? 'Fecha: '  + datos.fechaPreferida  : '',
    datos.horaPreferida  ? 'Hora: '   + datos.horaPreferida   : '',
    datos.mensaje        ? 'Mensaje: '+ datos.mensaje          : '',
    '',
    'Recibido: '  + (datos.timestamp || ''),
  ].filter(Boolean).join('\n');

  MailApp.sendEmail({
    to:       CONFIG.EMAIL_DOCTORA,
    subject:  asunto,
    htmlBody: cuerpoHTML,
    body:     cuerpoTexto,
  });
}

/**
 * ============================================
 * HELPERS: Respuestas JSON estandarizadas
 * ============================================
 */

/**
 * NOMBRE: respuestaExito
 * PROPÓSITO: Devuelve una respuesta JSON de éxito al navegador.
 *            agenda.js espera { success: true } para redirigir a gracias.html
 * RETORNA: ContentService.createTextOutput con JSON
 */
function respuestaExito() {
  /**
   * ContentService.createTextOutput() crea una respuesta HTTP de texto.
   * .setMimeType(MIME_TYPES.JSON) la envía como application/json.
   * Esto es lo que permite que agenda.js haga respuesta.json() sin error.
   */
  return ContentService
    .createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * NOMBRE: respuestaError
 * PROPÓSITO: Devuelve una respuesta JSON de error al navegador.
 *            agenda.js muestra el mensaje en el <output id="estado-envio">
 * PARAMS:
 *   mensaje (string) — descripción del error
 * RETORNA: ContentService.createTextOutput con JSON
 */
function respuestaError(mensaje) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: false, error: mensaje }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * ============================================
 * FUNCIÓN: doGet(e) — para pruebas en el navegador
 * ============================================
 * NOMBRE: doGet
 * PROPÓSITO: Responde a peticiones GET (no al formulario — eso es POST).
 *            Útil para verificar que el Web App esté activo
 *            visitando la URL en el navegador.
 * PARAMS:
 *   e (Object) — el evento GET (no se usa aquí)
 * RETORNA: ContentService.createTextOutput
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status:  'online',
      mensaje: 'Web App de citas activo — ' + CONFIG.NOMBRE_CONSULTORIO,
      version: '1.0',
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/* FIN DEL ARCHIVO — ver /apps-script/README.md para instrucciones de despliegue */
