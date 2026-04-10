# Etapa 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# VITE_API_URL se pasa como build arg cuando frontend y backend son dominios distintos
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Etapa 2: Servir con nginx
FROM nginx:alpine

# gettext provee envsubst para sustituir variables en nginx.conf en tiempo de arranque
RUN apk add --no-cache gettext

COPY --from=builder /app/dist /usr/share/nginx/html

# nginx.conf usa ${BACKEND_URL}; se sustituye al iniciar el contenedor
COPY nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 80

# nginx official image procesa automáticamente /etc/nginx/templates/ con envsubst
CMD ["nginx", "-g", "daemon off;"]
