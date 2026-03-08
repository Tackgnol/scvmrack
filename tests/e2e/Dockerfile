FROM mcr.microsoft.com/playwright:v1.52.0-jammy

WORKDIR /e2e

COPY tests/e2e/package*.json ./
RUN npm install

COPY tests/e2e ./

CMD ["sh", "-c", "if [ \"$PLAYWRIGHT_DEBUG\" = \"1\" ]; then npm run test:debug; else npm run test:run; fi"]
