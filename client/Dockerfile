# ... (Top part stays the same) ...
WORKDIR /app

# Copy the root/backend package.json
COPY package*.json ./

# NEW: Copy the frontend package.json into its correct subfolder
COPY client/package*.json ./client/

# Install backend dependencies (and frontend if you use npm workspaces)
RUN npm install

# NEW: Explicitly install frontend dependencies if not using workspaces
RUN cd client && npm install

# Copy the rest of your application code
COPY . .

# --- Declare Build Arguments ---
ARG VITE_BACKEND_URL
ARG VITE_TURNSTILE_SITE_KEY
ARG VITE_SITE_URL

# --- Set Environment Variables for Vite ---
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_TURNSTILE_SITE_KEY=$VITE_TURNSTILE_SITE_KEY
ENV VITE_SITE_URL=$VITE_SITE_URL

# NEW: Navigate into the frontend folder to run the build!
RUN cd client && npm run build

# --- Expose and Start ---
EXPOSE 3000
CMD ["npm", "start"]
