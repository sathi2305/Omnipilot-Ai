# syntax=docker/dockerfile:1
FROM node:22-alpine AS base

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache git bash

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application source
COPY . .

# Build Vite frontend assets
RUN npm run build

# Run automated test verification during container build
RUN npm test

# Expose port 3000
EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

# Start OmniPilot X full-stack engine server
CMD ["node", "dist/server.js"]
