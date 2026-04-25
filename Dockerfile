FROM node:22-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
RUN npm install

# Copy the rest of the code
COPY . .

# 1. Declare the ARGs so Docker knows to expect them from docker-compose
ARG VITE_BACKEND_URL
ARG VITE_TURNSTILE_SITE_KEY
ARG VITE_SITE_URL

# 2. Set them as ENV vars so Vite can see them during the build
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_TURNSTILE_SITE_KEY=$VITE_TURNSTILE_SITE_KEY
ENV VITE_SITE_URL=$VITE_SITE_URL

# 3. Build the frontend! This bakes the real URLs into the dist/ files
RUN npm run build 

# (Assuming this is a monorepo where Fastify is also in this container)
EXPOSE 3000

# 4. Start your Fastify backend (which will serve the newly built dist/ folder)
CMD ["npm", "start"]
