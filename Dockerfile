# Multi-stage Dockerfile for Saint // Cold Steel Bot Hosting
# Stage 1: Build Frontend & Backend
FROM node:20-alpine AS builder

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
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy root package
COPY package.json ./
COPY server/package.json ./server/

# Install production dependencies only
RUN npm --prefix server install --omit=dev

# Copy compiled outputs
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist

# Ensure data directory exists
RUN mkdir -p /app/server/data

# Ports: Expose 5000 (8080-8084 strictly forbidden)
EXPOSE 5000

VOLUME ["/app/server/data"]

CMD ["node", "server/dist/server.js"]
