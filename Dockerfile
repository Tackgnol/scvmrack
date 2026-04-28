FROM node:22-alpine

WORKDIR /app
RUN chown node:node /app

# Copy package files first for better caching (both backend and frontend)
COPY --chown=node:node package*.json ./
COPY --chown=node:node client/package*.json ./client/

USER node

# Install backend and frontend dependencies
RUN npm install
RUN cd client && npm install

# Copy the rest of the code
COPY --chown=node:node . .

# 1. Declare the ARGs so Docker knows to expect them from docker-compose
ARG VITE_BACKEND_URL
# trivy:ignore:AVD-DS-0031 - Vite Turnstile site key is a public browser key, not a secret.
ARG VITE_TURNSTILE_SITE_KEY
ARG VITE_SITE_URL
ARG VITE_GLITCHTIP_DSN

# 2. Set them as ENV vars so Vite can see them during the build
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
# trivy:ignore:AVD-DS-0031 - Vite Turnstile site key is a public browser key, not a secret.
ENV VITE_TURNSTILE_SITE_KEY=$VITE_TURNSTILE_SITE_KEY
ENV VITE_SITE_URL=$VITE_SITE_URL
ENV VITE_GLITCHTIP_DSN=$VITE_GLITCHTIP_DSN

# 3. Build the frontend (the `build` script lives in client/package.json, not root)
RUN cd client && npm run build

# (Assuming this is a monorepo where Fastify is also in this container)
EXPOSE 3000

# 4. Start your Fastify backend (which will serve the newly built dist/ folder)
CMD ["npm", "start"]
