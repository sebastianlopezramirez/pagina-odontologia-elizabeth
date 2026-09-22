/**
 * ARCHIVO: contacto.js
 * PROPÓSITO: Maneja el envío del formulario de contacto rápido
 *            de contacto.html hacia el Web App de Apps Script.
 * DEPENDENCIAS: Ninguna — JavaScript vanilla puro.
 * NOTAS: Reutiliza la misma URL del Apps Script que agenda.js.
 *        El servidor distingue el tipo de envío por el campo "tipo".
 */

/**
 * URL DEL WEB APP DE APPS SCRIPT
 * ⚠️ REEMPLAZAR antes de desplegar con la URL real del Web App
 */
const APPS_SCRIPT_CONTACTO_URL = 'TU_URL_DE_APPS_SCRIPT_AQUI';

/**
 * NOMBRE: iniciarFormContacto
 * PROPÓSITO: Adjunta el event listener al formulario de contacto
 *            cuando el DOM está listo.
 * NOTAS: Se llama al cargar el script (al final del body, con defer)
 */
function iniciarFormContacto() {
  // Buscamos el formulario por su id específico
  const form = document.getElementById('form-contacto');

  // Salida segura si el formulario no existe en esta página
  if (!form) return;

  // Escuchamos el evento submit del formulario
  form.addEventListener('submit', manejarEnvioContacto);
}

/**
 * NOMBRE: manejarEnvioContacto
 * PROPÓSITO: Intercepta el submit del form, valida, envía a Apps Script,
 *            y muestra feedback al usuario.
 * PARAMS: e (Event) — el evento submit del formulario
 */
async function manejarEnvioContacto(e) {
  // Prevenir el comportamiento nativo del form (reload de página)
  e.preventDefault();

  // Referencia al output para mostrar mensajes de estado
  const output = document.getElementById('contacto-output');

  // Referencia al botón para deshabilitarlo durante el envío
  const btn = form.querySelector('button[type="submit"]');

  // Deshabilitar botón y mostrar estado de carga
  btn.disabled = true;
  btn.textContent = 'Enviando...';
  output.textContent = '';
  output.className = 'form-output';

  // Construir objeto FormData desde el formulario
  const datos = new FormData(e.target);

  // Añadir campo "tipo" para que el servidor distinga contacto vs cita
  datos.append('tipo', 'contacto');

  try {
    // Enviar los datos al Web App de Apps Script
    const respuesta = await fetch(APPS_SCRIPT_CONTACTO_URL, {
      method: 'POST',
      body: datos
      // No ponemos Content-Type manual — fetch lo pone solo con FormData
    });

    // Parsear respuesta JSON del servidor
    const resultado = await respuesta.json();

    if (resultado.status === 'ok') {
      // Éxito: mostrar mensaje y limpiar el formulario
      output.textContent = '✓ Mensaje enviado. Te contactaremos pronto.';
      output.className = 'form-output form-output--exito';
      e.target.reset();
    } else {
      // Error del servidor (Apps Script devolvió error)
      throw new Error(resultado.mensaje || 'Error del servidor');
    }

  } catch (error) {
    // Error de red o error del servidor
    output.textContent = 'No se pudo enviar el mensaje. Intenta por WhatsApp.';
    output.className = 'form-output form-output--error';
    console.error('[ContactoForm]', error);
  } finally {
    // Siempre rehabilitar el botón al terminar
    btn.disabled = false;
    btn.textContent = 'Enviar mensaje';
  }
}

// Iniciar cuando el DOM esté listo
// El script tiene "defer" en el HTML, así que el DOM ya está listo aquí
iniciarFormContacto();
