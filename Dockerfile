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

# ✅ Generate Prisma client
RUN bunx prisma generate

# Build NestJS
RUN bun run build

# ----------------------------
# STEP 2: Production stage
# ----------------------------
FROM oven/bun:1-slim

WORKDIR /app

# Copy only what's needed
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/bun.lock ./

EXPOSE 3000

# ✅ FIX: Update the path to match your actual file location
CMD ["bun", "run", "dist/src/main.js"]
