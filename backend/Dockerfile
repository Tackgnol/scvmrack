FROM node:22-alpine AS builder

WORKDIR /app/backend

COPY backend/package*.json ./
COPY .npmrc* ./
COPY backend/prisma ./prisma
COPY backend/prisma.config.ts ./
RUN npm ci
RUN rm -f .npmrc

COPY backend/ ./
RUN npx prisma generate
RUN npm run build:ts
RUN npm prune --omit=dev

FROM node:22-alpine

WORKDIR /app/backend
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/backend/package*.json ./
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/prisma ./prisma

EXPOSE 3000

USER node

CMD ["npx", "fastify", "start", "-l", "info", "dist/app.js"]
