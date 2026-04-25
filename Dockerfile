# --- Stage 1: build the React client ---------------------------------------
FROM node:22-alpine AS client-builder

WORKDIR /build

COPY client/package*.json ./
RUN npm ci

COPY client ./
RUN npm run build
# vite outputs to /build/public (per client/vite.config.ts)

# --- Stage 2: build the backend + assemble final image ----------------------
FROM node:22-alpine

WORKDIR /app

COPY --chown=node:node package*.json ./
RUN npm ci

COPY --chown=node:node . .
RUN npm run build:ts

# Place built client assets where Fastify's static handler serves from
# (src/routes/root.ts registers @fastify/static with root = process.cwd()/dist)
COPY --from=client-builder --chown=node:node /build/public ./dist/public

USER node

EXPOSE 3000

CMD ["node", "dist/server.js"]
