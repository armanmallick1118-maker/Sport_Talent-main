# Dockerfile for Backend Deployment on Railway
FROM node:20-bookworm-slim

# Install OpenSSL and CA certificates (required by Prisma and Supabase SSL)
RUN apt-get update -y && \
    apt-get install -y --no-install-recommends openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package config and prisma schema
COPY package.json package-lock.json* ./
COPY prisma ./prisma

# Install dependencies
RUN npm ci || npm install

# Copy the rest of the backend source code
COPY . ./

# Generate Prisma Client for PostgreSQL / Supabase
RUN npx prisma generate

# Railway dynamically routes traffic via process.env.PORT
# Start the Node.js server
CMD ["npm", "run", "start"]
