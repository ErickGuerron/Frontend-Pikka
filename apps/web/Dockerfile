# Imagen del frontend web de Pikka (React + Vite servido por Nginx).
#
# El contexto de build es la carpeta apps/ (no apps/web) porque el código de web importa
# apps/shared con rutas relativas. Construir desde apps/:
#   docker build -f web/Dockerfile -t pikka/web:1.0 .
#
# Ejecutar (con el backend ya levantado, en la red de su docker compose):
#   docker run -d --name pikka-web --network last-mile-logistics_default -p 5173:80 pikka/web:1.0

# ---- Etapa 1: compilar ----
FROM node:22-alpine AS build
WORKDIR /app/web

# Primero solo los manifiestos: la capa de dependencias se reutiliza si no cambian.
COPY web/package.json web/package-lock.json web/.npmrc ./
RUN npm ci --ignore-scripts

# apps/web/src importa ../../../../shared => /app/shared dentro de la imagen.
COPY web/ ./
COPY shared/ /app/shared/
# VITE_API_BASE_URL queda vacío: el navegador llama a /api en el mismo origen y Nginx lo reenvía al gateway.
# Clave de MapTiler para los mapas (VITE_MAP_TILE_KEY). Vacía = OpenStreetMap, solo desarrollo.
ARG VITE_MAP_TILE_KEY=
ENV VITE_MAP_TILE_KEY=${VITE_MAP_TILE_KEY}
RUN npm run build

# ---- Etapa 2: servir ----
FROM nginx:1.27-alpine
COPY web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/web/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
