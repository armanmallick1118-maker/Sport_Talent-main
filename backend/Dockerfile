# Dockerfile for Backend Deployment on Railway
FROM node:18-bullseye-slim

# Install OpenSSL (required by Prisma)
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

# Copy package config and prisma schema
COPY package.json package-lock.json* ./
COPY prisma ./prisma

# Install dependencies
RUN npm ci || npm install

# Copy the rest of the backend source code
COPY . ./

# Generate Prisma Client for Supabase
RUN npx prisma generate

# Start the Node.js server
CMD ["npm", "run", "start"]
