# Multi-stage Dockerfile for Saint // Cold Steel Bot Hosting
# Stage 1: Build Frontend & Backend (Debian glibc for rock-solid SQLite compatibility)
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Install dependencies for both client and server
COPY package.json package-lock.json* ./
COPY client/package.json ./client/
COPY server/package.json ./server/

RUN npm --prefix client install
RUN npm --prefix server install

# Copy source code
COPY client/ ./client/
COPY server/ ./server/

# Build client and server
RUN npm --prefix client run build
RUN npm --prefix server run build

# Stage 2: Production Runner
FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy root and server package definitions
COPY package.json ./
COPY server/package.json ./server/

# Install production dependencies for server
RUN npm --prefix server install --omit=dev

# Copy compiled outputs from builder
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist

# Ensure data directory exists
RUN mkdir -p /app/server/data

# Ports: Expose 5000 (8080-8084 strictly forbidden)
EXPOSE 5000

VOLUME ["/app/server/data"]

WORKDIR /app/server
CMD ["node", "dist/server.js"]
