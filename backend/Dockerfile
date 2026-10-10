FROM node:18-alpine

WORKDIR /usr/src/app

# Copiar manifiestos e instalar dependencias de produccion
COPY package*.json ./
RUN npm ci --only=production

# Copiar codigo fuente
COPY . .

# Ejecutar con usuario no privilegiado (Seguridad en Contenedores)
USER node

EXPOSE 3000

# Healthcheck nativo para orquestadores (ECS / Docker)
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "server.js"]
