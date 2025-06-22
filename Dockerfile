# Etapa 1 - Build Angular
FROM node:22-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx ng build --configuration production

# Etapa 2 - Servidor Caddy com TLS interno
FROM caddy:alpine

COPY --from=builder /app/dist/goverse-frontend/browser /usr/share/caddy
COPY Caddyfile /etc/caddy/Caddyfile
