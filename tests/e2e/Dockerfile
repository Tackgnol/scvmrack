FROM mcr.microsoft.com/playwright:v1.58.2-jammy

WORKDIR /e2e

COPY package*.json ./
RUN npm install

COPY . ./

CMD ["sh", "-c", "if [ \"$PLAYWRIGHT_DEBUG\" = \"1\" ]; then npm run test:debug; else npm run test:run; fi"]
