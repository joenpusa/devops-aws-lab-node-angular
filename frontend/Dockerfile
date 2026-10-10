# ==============================================================================
# Etapa 1: Compilación de la aplicación Angular (Builder)
# ==============================================================================
FROM node:18-alpine AS builder

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm ci

# Copiar código fuente y compilar bundle para producción
COPY . .
RUN npm run build -- --configuration=production

# ==============================================================================
# Etapa 2: Servidor Web Nginx de Producción (Runner)
# ==============================================================================
FROM nginx:alpine

# Copiar configuración personalizada de Nginx para SPA (HTML5 routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar exclusivamente los artefactos compilados desde la etapa builder
COPY --from=builder /app/dist/devopslab-frontend/browser /usr/share/nginx/html

EXPOSE 80

# Ejecutar Nginx en primer plano
CMD ["nginx", "-g", "daemon off;"]
