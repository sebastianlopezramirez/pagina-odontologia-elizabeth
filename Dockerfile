# ============================================
# Dockerfile — Sitio estático con nginx
# PROPÓSITO: Empaquetar el sitio para Railway
# STACK: nginx:alpine (imagen liviana ~8MB)
# ============================================

# Imagen base: nginx en Alpine Linux
# Alpine = distribución Linux mínima, imagen final muy pequeña
FROM nginx:alpine

# Copiar todos los archivos del sitio a la carpeta que nginx sirve
# El .dockerignore (si existiera) excluiría archivos; aquí usamos --chown para permisos
COPY . /usr/share/nginx/html

# Eliminar archivos que no deben estar accesibles públicamente
# (el .gitignore no lo hace automáticamente — hay que hacerlo explícito aquí)
RUN rm -f \
    /usr/share/nginx/html/Dockerfile \
    /usr/share/nginx/html/nginx.conf \
    /usr/share/nginx/html/.gitignore \
    /usr/share/nginx/html/rediseno.py \
    /usr/share/nginx/html/.env 2>/dev/null || true

# Copiar nuestra configuración personalizada de nginx
# (reemplaza la config por defecto de la imagen)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# ——— PUERTO DE RAILWAY ———
# Railway inyecta la variable de entorno PORT en cada despliegue.
# El valor típico es 8080 pero puede cambiar.
# Reemplazamos el placeholder __PORT__ en nginx.conf con el valor real.
#
# POR QUÉ usamos sed en CMD (no en RUN):
#   RUN se ejecuta al construir la imagen (build time) → $PORT no existe aún.
#   CMD se ejecuta al iniciar el contenedor (runtime) → $PORT ya está disponible.

EXPOSE 8080

CMD sh -c "sed -i 's/__PORT__/${PORT:-8080}/g' /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"

# ============================================
# Para probar localmente (sin Railway):
#   docker build -t pagina-odontologia .
#   docker run -p 8080:8080 -e PORT=8080 pagina-odontologia
#   Luego abre: http://localhost:8080
# ============================================
