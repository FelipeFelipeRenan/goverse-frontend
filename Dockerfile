# Etapa 1: build Angular app
FROM node:22-alpine AS builder

# Diretório da aplicação
WORKDIR /app

# Instala dependências com cache otimizado
COPY package.json package-lock.json ./
RUN npm ci

# Copia o restante do código
COPY . .

# Build da aplicação Angular (output para dist/goverse-frontend)
RUN npx ng build --configuration production

# Etapa 2: imagem final com Nginx estável e limpa
FROM nginx:1.25.5-alpine

# Remove configuração default insegura
RUN rm /etc/nginx/conf.d/default.conf

# Copia nossa configuração customizada
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia o build da app Angular
COPY --from=builder /app/dist/goverse-frontend/browser /usr/share/nginx/html

# Expondo a porta padrão
EXPOSE 80

# Comando padrão
CMD ["nginx", "-g", "daemon off;"]
