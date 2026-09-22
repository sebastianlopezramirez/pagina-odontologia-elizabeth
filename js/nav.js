/**
 * ============================================
 * ARCHIVO: /js/nav.js
 * PROPÓSITO: Toggle del menú de navegación móvil.
 *            Alterna la clase "nav-abierto" en el <header>
 *            y mantiene aria-expanded sincronizado para accesibilidad.
 * DEPENDENCIAS: Ninguna — JavaScript vanilla puro.
 * NOTAS: Sin onclick="" en HTML (cumple Regla 2 del proyecto).
 *        Sin frameworks. Sin librerías externas.
 * ============================================
 */

/**
 * NOMBRE: initNav
 * PROPÓSITO: Inicializa el comportamiento del menú móvil cuando el DOM está listo.
 *            Se llama desde DOMContentLoaded para garantizar que los elementos
 *            existan antes de intentar acceder a ellos.
 * PARAMS: ninguno
 * RETORNA: void
 */
function initNav() {

  /* Seleccionamos el <header> que contiene el <nav> y el botón toggle.
     querySelector es más semántico que getElementById aquí porque
     el <header> es un landmark, no necesita ID para ser único en la página. */
  const header = document.querySelector('header');

  /* Seleccionamos el botón hamburguesa por su clase específica.
     Tiene aria-controls="menu-principal" y aria-expanded="false" en el HTML. */
  const toggleBtn = document.querySelector('.nav-toggle');

  /* Si no existe el botón (por ejemplo en una página que no lo tenga),
     salimos silenciosamente. Esto hace el script robusto en todas las páginas. */
  if (!toggleBtn || !header) return;

  /* Seleccionamos todos los enlaces del menú para cerrar el nav al hacer clic.
     En móvil, sin esto el menú permanece abierto después de navegar. */
  const navLinks = document.querySelectorAll('header nav a');

  /**
   * NOMBRE: toggleMenu
   * PROPÓSITO: Abre o cierra el menú alternando la clase "nav-abierto"
   *            en el <header> y actualizando aria-expanded en el botón.
   * PARAMS: ninguno
   * RETORNA: void
   * NOTAS: aria-expanded debe siempre reflejar el estado real del menú.
   *        Es crítico para usuarios de lectores de pantalla.
   */
  function toggleMenu() {
    /* classList.toggle devuelve true si la clase fue AÑADIDA, false si fue REMOVIDA.
       Esto nos da directamente el nuevo estado del menú (abierto = true). */
    const estaAbierto = header.classList.toggle('nav-abierto');

    /* Actualizamos aria-expanded para que el lector de pantalla anuncie
       "menú, expandido" o "menú, contraído" al usuario con discapacidad visual. */
    toggleBtn.setAttribute('aria-expanded', estaAbierto ? 'true' : 'false');
  }

  /* Escuchamos el clic en el botón hamburguesa.
     Sin onclick="" en HTML porque: 1) respeta separación de capas HTML/JS,
     2) permite remover el listener si fuera necesario,
     3) es la práctica correcta según la especificación HTML5. */
  toggleBtn.addEventListener('click', toggleMenu);

  /* Cerramos el menú al hacer clic en cualquier enlace del nav.
     En móvil el menú overlay permanece visible después de navegar si no hacemos esto. */
  navLinks.forEach(function(link) {
    link.addEventListener('click', function() {
      /* Solo cerramos si el menú está abierto para no alterar el estado innecesariamente */
      if (header.classList.contains('nav-abierto')) {
        /* Reutilizamos toggleMenu para mantener aria-expanded sincronizado */
        toggleMenu();
      }
    });
  });

  /* Cerramos el menú al presionar Escape.
     Requisito de accesibilidad: WCAG 2.1 criterio 1.4.13 (Content on Hover or Focus).
     Usuarios de teclado deben poder cerrar componentes sin usar el ratón. */
  document.addEventListener('keydown', function(evento) {
    /* evento.key es la forma moderna (IE9+).
       Comparamos con 'Escape' (estándar) — en IE11 era 'Esc', pero ya no es relevante. */
    if (evento.key === 'Escape' && header.classList.contains('nav-abierto')) {
      toggleMenu();
      /* Devolvemos el foco al botón toggle para que el usuario sepa dónde está */
      toggleBtn.focus();
    }
  });

  /* Cerramos el menú si el usuario hace clic fuera del header.
     UX estándar: tocar fuera de un menú desplegable lo cierra. */
  document.addEventListener('click', function(evento) {
    /* evento.target es el elemento clickeado.
       closest() sube por el árbol DOM buscando el <header> más cercano.
       Si no encuentra ninguno, devuelve null → el clic fue FUERA del header. */
    if (
      header.classList.contains('nav-abierto') &&
      !evento.target.closest('header')
    ) {
      toggleMenu();
    }
  });

}

/* DOMContentLoaded garantiza que el DOM está completamente parseado
   antes de buscar los elementos. Más eficiente que window.load porque
   no espera imágenes y otros recursos — solo el HTML. */
document.addEventListener('DOMContentLoaded', initNav);
