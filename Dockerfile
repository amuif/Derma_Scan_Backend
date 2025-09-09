
# ----------------------------
# STEP 1: Build stage
# ----------------------------
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy package files
COPY bun.lock package.json ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# ✅ Generate Prisma client (important!)
RUN bunx prisma generate

# Build NestJS
RUN bun run build

# ----------------------------
# STEP 2: Production stage
# ----------------------------
FROM node:20-slim

WORKDIR /app

# Copy only what's needed
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json bun.lock ./

EXPOSE 3000

CMD ["node", "dist/main.js"]

