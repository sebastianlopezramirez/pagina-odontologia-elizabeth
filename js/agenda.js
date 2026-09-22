/**
 * ============================================
 * ARCHIVO: /js/agenda.js
 * PROPÓSITO: Lógica del formulario de citas de
 *            Dra. Elizabeth Guzmán Odontología
 * DEPENDENCIAS: ninguna (vanilla JS puro, cero librerías)
 * PATRÓN: event-driven, progresivo, sin onclick="" en HTML
 * ============================================
 */

/**
 * ============================================
 * CONSTANTE DE CONFIGURACIÓN
 * ============================================
 * CAMBIA ESTA URL por la de tu Web App de Apps Script
 * después de desplegarlo (ver /apps-script/README.md).
 * Mientras no la tengas, el formulario mostrará un
 * error claro para que sepas qué falta.
 * ============================================
 */
const APPS_SCRIPT_URL = 'TU_URL_DE_APPS_SCRIPT_AQUI';

/**
 * ============================================
 * BLOQUE 1: FECHA MÍNIMA
 * Evita que el usuario elija una fecha pasada.
 * Se ejecuta al cargar la página, una sola vez.
 * ============================================
 */

/**
 * NOMBRE: iniciarFechaMinima
 * PROPÓSITO: Pone el atributo "min" del input de fecha
 *            a la fecha de hoy en formato YYYY-MM-DD,
 *            que es el formato que espera <input type="date">
 * PARAMS: ninguno
 * RETORNA: void
 */
function iniciarFechaMinima() {
  const inputFecha = document.getElementById('fecha-preferida');
  if (!inputFecha) return;

  const hoy = new Date();

  /**
   * toISOString() devuelve "2024-03-15T14:23:00.000Z"
   * .slice(0, 10) recorta solo "2024-03-15" = formato YYYY-MM-DD
   */
  const fechaHoy = hoy.toISOString().slice(0, 10);

  inputFecha.setAttribute('min', fechaHoy);
}

/**
 * ============================================
 * BLOQUE 2: CONTADOR DE CARACTERES DEL TEXTAREA
 * ============================================
 */

/**
 * NOMBRE: iniciarContadorMensaje
 * PROPÓSITO: Escucha "input" del textarea y actualiza
 *            el <output id="contador-mensaje"> en tiempo real
 * PARAMS: ninguno
 * RETORNA: void
 */
function iniciarContadorMensaje() {
  const textarea = document.getElementById('mensaje');
  const contador = document.getElementById('contador-mensaje');

  if (!textarea || !contador) return;

  const maxLength = parseInt(textarea.getAttribute('maxlength'), 10) || 500;

  function actualizarContador() {
    const restantes = maxLength - textarea.value.length;
    contador.textContent = restantes + ' caracteres restantes';
    contador.classList.toggle('contador--advertencia', restantes < 50);
  }

  textarea.addEventListener('input', actualizarContador);
  actualizarContador();
}

/**
 * ============================================
 * BLOQUE 3: VALIDACIÓN DE CAMPOS
 * ============================================
 */

/**
 * NOMBRE: mostrarError
 * PROPÓSITO: Muestra error en <output> y marca campo con aria-invalid
 * PARAMS: campo (HTMLElement), outputId (string), mensaje (string)
 * RETORNA: void
 */
function mostrarError(campo, outputId, mensaje) {
  const outputEl = document.getElementById(outputId);
  if (outputEl) outputEl.textContent = mensaje;
  campo.setAttribute('aria-invalid', 'true');
  campo.classList.add('campo--error');
}

/**
 * NOMBRE: limpiarError
 * PROPÓSITO: Quita el estado de error de un campo
 * PARAMS: campo (HTMLElement), outputId (string)
 * RETORNA: void
 */
function limpiarError(campo, outputId) {
  const outputEl = document.getElementById(outputId);
  if (outputEl) outputEl.textContent = '';
  campo.removeAttribute('aria-invalid');
  campo.classList.remove('campo--error');
}

/**
 * NOMBRE: validarFormulario
 * PROPÓSITO: Valida todos los campos. Devuelve true si es válido.
 * PARAMS: ninguno
 * RETORNA: boolean
 */
function validarFormulario() {
  let esValido = true;

  /* NOMBRE */
  const nombre = document.getElementById('nombre');
  if (nombre) {
    if (!nombre.value.trim()) {
      mostrarError(nombre, 'error-nombre', 'Por favor escribe tu nombre completo.');
      esValido = false;
    } else if (nombre.value.trim().length < 3) {
      mostrarError(nombre, 'error-nombre', 'El nombre debe tener al menos 3 caracteres.');
      esValido = false;
    } else {
      limpiarError(nombre, 'error-nombre');
    }
  }

  /* TELÉFONO */
  const telefono = document.getElementById('telefono');
  if (telefono) {
    const regexTel = /^[\d\s\+\-]{7,15}$/;
    if (!telefono.value.trim()) {
      mostrarError(telefono, 'error-telefono', 'Por favor escribe tu número de teléfono o celular.');
      esValido = false;
    } else if (!regexTel.test(telefono.value.trim())) {
      mostrarError(telefono, 'error-telefono', 'Número no válido. Ejemplo: 322 2614315 o 604 2716000.');
      esValido = false;
    } else {
      limpiarError(telefono, 'error-telefono');
    }
  }

  /* EMAIL (opcional — solo valida si tiene contenido) */
  const email = document.getElementById('email');
  if (email && email.value.trim()) {
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexEmail.test(email.value.trim())) {
      mostrarError(email, 'error-email', 'El correo electrónico no parece válido. Ejemplo: nombre@gmail.com');
      esValido = false;
    } else {
      limpiarError(email, 'error-email');
    }
  }

  /* SERVICIO */
  const servicio = document.getElementById('servicio');
  if (servicio) {
    if (!servicio.value || servicio.value === '') {
      mostrarError(servicio, 'error-servicio', 'Por favor selecciona el servicio que necesitas.');
      esValido = false;
    } else {
      limpiarError(servicio, 'error-servicio');
    }
  }

  /* FECHA (opcional — si se ingresa, debe ser futura) */
  const fecha = document.getElementById('fecha-preferida');
  if (fecha && fecha.value) {
    const fechaElegida = new Date(fecha.value + 'T00:00:00');
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (fechaElegida < hoy) {
      mostrarError(fecha, 'error-fecha', 'La fecha debe ser hoy o una fecha futura.');
      esValido = false;
    } else {
      limpiarError(fecha, 'error-fecha');
    }
  }

  /* CONSENTIMIENTO (obligatorio — Ley 1581 de 2012 Colombia) */
  const consentimiento = document.getElementById('consentimiento');
  if (consentimiento) {
    if (!consentimiento.checked) {
      mostrarError(consentimiento, 'error-consentimiento',
        'Debes aceptar el tratamiento de tus datos personales para continuar (Ley 1581 de 2012).');
      esValido = false;
    } else {
      limpiarError(consentimiento, 'error-consentimiento');
    }
  }

  return esValido;
}

/**
 * ============================================
 * BLOQUE 4: LIMPIEZA EN TIEMPO REAL
 * Quita el error cuando el usuario empieza a corregir
 * ============================================
 */

/**
 * NOMBRE: iniciarLimpiezaEnTiempoReal
 * PROPÓSITO: Escucha cada campo y limpia su error cuando el usuario interactúa
 * PARAMS: ninguno
 * RETORNA: void
 */
function iniciarLimpiezaEnTiempoReal() {
  const campos = [
    { id: 'nombre',           outputId: 'error-nombre',           evento: 'input'  },
    { id: 'telefono',         outputId: 'error-telefono',         evento: 'input'  },
    { id: 'email',            outputId: 'error-email',            evento: 'input'  },
    { id: 'servicio',         outputId: 'error-servicio',         evento: 'change' },
    { id: 'fecha-preferida',  outputId: 'error-fecha',            evento: 'change' },
    { id: 'consentimiento',   outputId: 'error-consentimiento',   evento: 'change' },
  ];

  campos.forEach(function(item) {
    const campo = document.getElementById(item.id);
    if (!campo) return;
    campo.addEventListener(item.evento, function() {
      limpiarError(campo, item.outputId);
    });
  });
}

/**
 * ============================================
 * BLOQUE 5: CONSTRUCCIÓN DEL PAYLOAD JSON
 * ============================================
 */

/**
 * NOMBRE: construirPayload
 * PROPÓSITO: Empaqueta todos los datos del formulario en un objeto JSON
 * PARAMS: ninguno
 * RETORNA: Object
 */
function construirPayload() {
  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  return {
    formulario:     'cita-odontologia',
    nombre:         val('nombre'),
    telefono:       val('telefono'),
    email:          val('email'),
    servicio:       val('servicio'),
    fechaPreferida: val('fecha-preferida'),
    horaPreferida:  val('hora-preferida'),
    mensaje:        val('mensaje'),
    origen:         window.location.href,
    timestamp:      new Date().toISOString(),
  };
}

/**
 * ============================================
 * BLOQUE 6: ENVÍO AL BACKEND (Apps Script)
 * ============================================
 */

/**
 * NOMBRE: enviarFormulario
 * PROPÓSITO: Intercepta submit, valida, envía POST a Apps Script,
 *            redirige a gracias.html en éxito, muestra error si falla
 * PARAMS: evento (Event)
 * RETORNA: void (async)
 */
async function enviarFormulario(evento) {
  evento.preventDefault();

  const btnEnviar   = document.getElementById('btn-enviar');
  const estadoEnvio = document.getElementById('estado-envio');

  /* VALIDACIÓN */
  if (!validarFormulario()) {
    var primerError = document.querySelector('[aria-invalid="true"]');
    if (primerError) {
      primerError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      primerError.focus();
    }
    return;
  }

  /* VERIFICAR URL CONFIGURADA */
  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === 'TU_URL_DE_APPS_SCRIPT_AQUI') {
    if (estadoEnvio) {
      estadoEnvio.textContent =
        '⚠️ El sistema de citas aún no está configurado. ' +
        'Por favor llámanos al 604 2716000 o escríbenos por WhatsApp.';
      estadoEnvio.className = 'estado-envio estado-envio--error';
    }
    return;
  }

  /* ESTADO DE CARGA */
  if (btnEnviar) {
    btnEnviar.disabled = true;
    btnEnviar.dataset.textoOriginal = btnEnviar.textContent;
    btnEnviar.textContent = 'Enviando tu solicitud…';
  }
  if (estadoEnvio) {
    estadoEnvio.textContent = 'Enviando…';
    estadoEnvio.className = 'estado-envio estado-envio--cargando';
  }

  /* TIMEOUT de 15 segundos */
  var controlador = new AbortController();
  var timeoutId = setTimeout(function() { controlador.abort(); }, 15000);

  try {
    var payload = construirPayload();

    var respuesta = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      /**
       * ⚠️ NO ponemos Content-Type: application/json aquí.
       *
       * RAZÓN — CORS PREFLIGHT:
       * Si pones Content-Type: application/json, el navegador primero envía
       * una petición OPTIONS (preflight) para pedir permiso al servidor.
       * Google Apps Script NO responde a OPTIONS → el preflight falla →
       * el POST nunca llega → el formulario falla con error de red.
       *
       * SOLUCIÓN:
       * Sin header explícito, el body se envía como text/plain, que es
       * una "simple request" sin preflight. Apps Script sigue recibiendo
       * el JSON en e.postData.contents y JSON.parse() lo procesa igual.
       *
       * REF: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#simple_requests
       */
      body: JSON.stringify(payload),
      signal: controlador.signal,
    });

    clearTimeout(timeoutId);

    if (!respuesta.ok) {
      throw new Error('Error del servidor: ' + respuesta.status);
    }

    var datos = await respuesta.json();

    if (!datos.success) {
      throw new Error(datos.error || 'El servidor respondió con un error inesperado.');
    }

    /* ÉXITO: redirigir a gracias.html */
    var nombreVal   = document.getElementById('nombre')?.value?.trim() || '';
    var servicioVal = document.getElementById('servicio')?.value || '';
    var params = new URLSearchParams({ nombre: nombreVal, servicio: servicioVal });

    /* replace() evita que "Atrás" vuelva al formulario enviado */
    window.location.replace('/gracias.html?' + params.toString());

  } catch (error) {
    clearTimeout(timeoutId);

    var mensajeError;
    if (error.name === 'AbortError') {
      mensajeError = 'La solicitud tardó demasiado. Verifica tu internet e intenta de nuevo.';
    } else {
      mensajeError =
        'Hubo un problema al enviar tu solicitud. ' +
        'Por favor llámanos al 604 2716000 o escríbenos por WhatsApp.';
      console.error('[agenda.js] Error al enviar:', error);
    }

    if (estadoEnvio) {
      estadoEnvio.textContent = mensajeError;
      estadoEnvio.className = 'estado-envio estado-envio--error';
    }
    if (btnEnviar) {
      btnEnviar.disabled = false;
      btnEnviar.textContent = btnEnviar.dataset.textoOriginal || 'Solicitar mi cita';
    }
  }
}

/**
 * ============================================
 * BLOQUE 7: PERSONALIZAR PÁGINA DE GRACIAS
 * Lee ?nombre=X&servicio=Y de la URL y los muestra
 * ============================================
 */

/**
 * NOMBRE: personalizarPaginaGracias
 * PROPÓSITO: Personaliza gracias.html con el nombre y servicio
 *            que vienen como parámetros en la URL
 * PARAMS: ninguno
 * RETORNA: void
 */
function personalizarPaginaGracias() {
  var saludo            = document.getElementById('saludo-nombre');
  var servicioConfirm   = document.getElementById('servicio-confirmado');

  if (!saludo && !servicioConfirm) return;

  var params   = new URLSearchParams(window.location.search);
  var nombre   = params.get('nombre')   || '';
  var servicio = params.get('servicio') || '';

  var nombresServicios = {
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

  /* textContent (no innerHTML) para evitar XSS — datos de la URL no son confiables */
  if (saludo && nombre) {
    saludo.textContent = nombre;
  }
  if (servicioConfirm && servicio) {
    servicioConfirm.textContent = nombresServicios[servicio] || servicio;
  }
}

/**
 * ============================================
 * BLOQUE 8: INICIALIZACIÓN
 * ============================================
 */

/**
 * NOMBRE: init
 * PROPÓSITO: Punto de entrada — conecta todos los módulos con el DOM
 * PARAMS: ninguno
 * RETORNA: void
 */
function init() {
  iniciarFechaMinima();
  iniciarContadorMensaje();
  iniciarLimpiezaEnTiempoReal();
  personalizarPaginaGracias();

  var form = document.getElementById('form-cita');
  if (form) {
    /* addEventListener en JS, no onclick="" en HTML (REGLA 2 del proyecto) */
    form.addEventListener('submit', enviarFormulario);
  }
}

/* DOMContentLoaded: el DOM está listo, sin esperar imágenes ni CSS */
document.addEventListener('DOMContentLoaded', init);

/* AUDITORÍA: onclick=0, innerHTML=0, dependencias_externas=0, librerías=0 */
