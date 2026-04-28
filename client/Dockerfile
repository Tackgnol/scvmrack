FROM node:22-alpine

WORKDIR /app
RUN chown node:node /app

COPY --chown=node:node package*.json ./

USER node

RUN npm install

COPY --chown=node:node . .

ARG VITE_BACKEND_URL
# trivy:ignore:AVD-DS-0031 - Vite Turnstile site key is a public browser key, not a secret.
ARG VITE_TURNSTILE_SITE_KEY
ARG VITE_SITE_URL
ARG VITE_GLITCHTIP_DSN

ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
# trivy:ignore:AVD-DS-0031 - Vite Turnstile site key is a public browser key, not a secret.
ENV VITE_TURNSTILE_SITE_KEY=$VITE_TURNSTILE_SITE_KEY
ENV VITE_SITE_URL=$VITE_SITE_URL
ENV VITE_GLITCHTIP_DSN=$VITE_GLITCHTIP_DSN

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
