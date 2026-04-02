FROM node:22-alpine

WORKDIR /app

COPY --chown=node:node package*.json ./
RUN npm install

COPY --chown=node:node . .
RUN npm run build:ts

USER node

EXPOSE 3000

CMD ["node", "dist/server.js"]
