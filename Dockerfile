FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build:ts && chown -R node:node /app

USER node

EXPOSE 3000

CMD ["node", "dist/server.js"]
