# Guía de Despliegue — Web App de Citas (Google Apps Script)

Sigue estos pasos **en orden**. No te saltes ninguno.

---

## ¿Qué vas a configurar?

Un backend gratuito usando Google Apps Script que:
1. Recibe los datos del formulario de `agendar.html`
2. Los guarda en una hoja de Google Sheets
3. Envía confirmación por email al paciente
4. Envía notificación a la Dra. Elizabeth

**Costo: $0. Sin límites de citas. Sin tarjeta de crédito.**

---

## Paso 1 — Crear el Google Spreadsheet

1. Abre [sheets.new](https://sheets.new) en tu navegador
2. Dale nombre: **"Citas — Dra. Elizabeth Guzmán"**
3. (El script creará automáticamente la hoja "Solicitudes de Citas" con encabezados en el primer envío)

---

## Paso 2 — Crear el proyecto de Apps Script

**Opción A — Desde el Spreadsheet (recomendada):**
1. En el Spreadsheet, ve a **Extensiones → Apps Script**
2. Se abre el editor de Apps Script vinculado al Spreadsheet
3. Elimina el contenido del archivo `Código.gs` que aparece por defecto

**Opción B — Script independiente:**
1. Abre [script.new](https://script.new)
2. Reemplaza el código de `guardarEnSheets()` para usar:
   ```javascript
   var hoja = SpreadsheetApp.openById('TU_ID_DE_SPREADSHEET')
                             .getSheetByName(CONFIG.NOMBRE_HOJA);
   ```

---

## Paso 3 — Pegar el código

1. Copia todo el contenido del archivo `/apps-script/Code.gs`
2. Pégalo en el editor de Apps Script (reemplaza lo que había)
3. Modifica las constantes de configuración al inicio del archivo:

```javascript
var CONFIG = {
  EMAIL_DOCTORA: 'TU_EMAIL_REAL@gmail.com',  // ← CAMBIA ESTO
  // ... resto de la configuración
};
```

4. Guarda con **Ctrl + S** (o **⌘ + S** en Mac)

---

## Paso 4 — Desplegar como Web App

1. Haz clic en el botón azul **"Desplegar"** (arriba a la derecha)
2. Selecciona **"Nueva implementación"**
3. Haz clic en el ícono de engranaje ⚙️ junto a "Seleccionar tipo"
4. Elige **"Aplicación web"**
5. Configura así:
   - **Descripción:** `Web App citas v1`
   - **Ejecutar como:** `Yo (tu email)`
   - **Quién tiene acceso:** `Cualquier persona`
     > ⚠️ "Cualquier persona" es necesario para que el formulario del sitio pueda enviar datos sin iniciar sesión. No expone tus datos — solo permite POST al endpoint.
6. Haz clic en **"Implementar"**
7. **Copia la URL del Web App** — se ve así:
   ```
   https://script.google.com/macros/s/AKfycbx.../exec
   ```

---

## Paso 5 — Actualizar la URL en agenda.js

1. Abre el archivo `/js/agenda.js` en VS Code
2. Busca esta línea al inicio del archivo:
   ```javascript
   const APPS_SCRIPT_URL = 'TU_URL_DE_APPS_SCRIPT_AQUI';
   ```
3. Reemplaza `'TU_URL_DE_APPS_SCRIPT_AQUI'` con la URL que copiaste:
   ```javascript
   const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx.../exec';
   ```
4. Guarda el archivo

---

## Paso 6 — Conceder permisos

La primera vez que se ejecute el script (primer envío de formulario), Google te pedirá permisos:

1. El editor de Apps Script mostrará una advertencia
2. Haz clic en **"Revisar permisos"**
3. Elige tu cuenta de Google
4. Aparecerá "Esta aplicación no está verificada" — haz clic en **"Avanzado"**
5. Haz clic en **"Ir a [nombre del proyecto] (no seguro)"**
6. Haz clic en **"Permitir"**

> 💡 Esto solo pasa una vez. Luego funciona automáticamente.

---

## Paso 6.5 — Verificar que el Web App está online (ANTES del primer envío real)

Antes de abrir el formulario con clientes reales, verifica que tu Web App responde correctamente:

1. Copia la URL del Web App del Paso 4 (la que termina en `/exec`)
2. **Pégala en tu navegador** y visita esa URL
3. Deberías ver un JSON como este:
   ```json
   {"status":"online","mensaje":"Web App de citas activo — Dra. Elizabeth Guzmán — Odontología Estética y Especializada","version":"1.0"}
   ```
4. Si ves ese JSON: ✅ el backend está listo
5. Si ves una página de error o "No tienes acceso": revisa el Paso 4 (acceso: "Cualquier persona")

> 💡 Esta respuesta la genera la función `doGet()` del archivo `Code.gs`. Funciona como un "ping" que confirma que el script está desplegado y los permisos están bien.

---

## Paso 7 — Probar el formulario

1. Abre tu sitio en el navegador (Live Server o producción)
2. Ve a `/agendar.html`
3. Llena el formulario con datos de prueba
4. Haz clic en "Solicitar mi cita"
5. Deberías ser redirigido a `/gracias.html`

**Verifica:**
- [ ] Aparece una fila nueva en el Google Spreadsheet
- [ ] Llega un email de confirmación al email que pusiste
- [ ] Llega la notificación al email de la doctora
- [ ] La fila en Sheets tiene todos los datos correctos

---

## Solución de problemas

### "El sistema de citas no está configurado todavía"
→ La URL en `agenda.js` sigue siendo `'TU_URL_DE_APPS_SCRIPT_AQUI'`. Revisa el Paso 5.

### El formulario envía pero no aparece nada en Sheets
→ Revisa la consola de Apps Script: **Editor → Ejecuciones** → busca errores en color rojo.

### El formulario da error de red (network error) en la consola del navegador
→ Es un error de CORS. Verifica que en `/js/agenda.js` el `fetch` **NO** tenga `headers: { 'Content-Type': 'application/json' }`.
→ Esa cabecera dispara un "preflight" OPTIONS que Apps Script no puede responder, bloqueando el envío.
→ El código ya tiene este fix aplicado — si lo ves de nuevo, alguien reintrodujo el header accidentalmente.

### "Error del servidor: 401" o "403"
→ En el despliegue, asegúrate de haber seleccionado **"Quién tiene acceso: Cualquier persona"**.

### No llegan los emails
→ Verifica que `CONFIG.EMAIL_DOCTORA` tiene el email correcto.  
→ Revisa la carpeta de SPAM.  
→ En Apps Script, ve a **Editor → Ejecuciones** para ver si `enviarEmailPaciente` corrió sin error.

### "Este script puede no ser seguro" en Google
→ Es normal para scripts no publicados en Google Marketplace. Sigue los pasos del Paso 6.

---

## Actualizar el código después del despliegue

Si cambias algo en `Code.gs` y quieres que los cambios apliquen:

1. En el editor de Apps Script, haz clic en **"Desplegar"**
2. Selecciona **"Gestionar implementaciones"**
3. Edita la implementación existente
4. En **"Versión"**, selecciona **"Nueva versión"**
5. Haz clic en **"Desplegar"**

> ⚠️ La URL del Web App no cambia cuando actualizas la versión. No necesitas cambiar `agenda.js`.

---

## Estructura de la hoja de cálculo resultante

| Fecha de Recepción | Estado | Nombre Paciente | Teléfono | Email | Servicio | Fecha Preferida | Hora Preferida | Mensaje | Origen URL | Timestamp ISO |
|---|---|---|---|---|---|---|---|---|---|---|
| 15/03/2024 09:30 | **Pendiente** | Ana García | 322 1234567 | ana@gmail.com | Ortodoncia | 2024-03-20 | 10:00 AM | Me duele... | https://... | 2024-03-15T... |

**Columna "Estado":** cámbiala manualmente a "Confirmada", "Cancelada", etc. para gestionar las citas.

---

## Seguridad y privacidad

- Los datos se almacenan en tu propio Google Drive — solo tú tienes acceso
- Los emails los envía tu cuenta de Google — no pasan por terceros
- El endpoint acepta POST de cualquier origen (CORS abierto) — es necesario para el sitio web
- No almacenamos contraseñas ni datos de pago — solo datos de contacto y cita
- Cumple con Ley 1581 de 2012 (Colombia) porque el paciente dio su consentimiento explícito en el formulario

---

## Notas técnicas importantes

### CORS y Google Apps Script
El formulario envía los datos sin el header `Content-Type: application/json` de forma intencional.  
Esto evita el "CORS preflight" (petición OPTIONS) que Apps Script no puede responder.  
El cuerpo JSON llega igual a `e.postData.contents` y se procesa con `JSON.parse()` sin problema.

### Números de teléfono (WhatsApp)
El script genera links de WhatsApp añadiendo `57` (código de Colombia) al número del formulario.  
Pide a los pacientes que ingresen el número **sin código de país** (ej: `322 2614315`, no `+57322...`).

### Cuota de emails gratuita
Google permite enviar hasta **100 emails por día** desde tu cuenta (vía `MailApp`).  
Con 2 emails por cita (paciente + doctora), eso da capacidad para 50 citas diarias.  
Para una clínica pequeña en Sabaneta, esta cuota es más que suficiente.

---

*Última actualización: 2024 — Proyecto web Dra. Elizabeth Guzmán*
