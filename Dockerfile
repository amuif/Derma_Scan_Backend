
# ----------------------------
# STEP 1: Build stage
# ----------------------------
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy package files
COPY bun.lock package.json ./

# Install dependencies (fast with Bun)
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Optional: generate prisma client if you use Prisma
# RUN bunx prisma generate

# Build NestJS (this calls "nest build" via package.json)
RUN bun run build

# ----------------------------
# STEP 2: Production stage
# ----------------------------
FROM node:20-slim

WORKDIR /app

# Copy only what's needed for production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json bun.lock ./

EXPOSE 3000

# Use Node to run NestJS
CMD ["node", "dist/main.js"]

