FROM mcr.microsoft.com/playwright:v1.58.2-jammy

WORKDIR /e2e
RUN mkdir -p /reports /e2e/playwright-report /e2e/test-results \
  && chown -R pwuser:pwuser /e2e /reports

COPY --chown=pwuser:pwuser package*.json ./

USER pwuser

RUN npm install

COPY --chown=pwuser:pwuser . ./

CMD ["sh", "-c", "if [ \"$PLAYWRIGHT_DEBUG\" = \"1\" ]; then npm run test:debug; else npm run test:run; fi"]
