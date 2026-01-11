FROM node:22-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
RUN npm install

# Copy the rest of the code
COPY . .

EXPOSE 5173

# Run Vite with the --host flag so it's accessible outside the container
CMD ["npm", "run", "dev", "--", "--host"]
