FROM node:22-alpine AS builder

WORKDIR /app

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./

ARG VITE_BACKEND_URL
ARG VITE_LOGTO_ENDPOINT
ARG VITE_SITE_URL
ARG VITE_GLITCHTIP_DSN

ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_LOGTO_ENDPOINT=$VITE_LOGTO_ENDPOINT
ENV VITE_SITE_URL=$VITE_SITE_URL
ENV VITE_GLITCHTIP_DSN=$VITE_GLITCHTIP_DSN

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
