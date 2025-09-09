
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

# Build NestJS (output goes to /app/dist)
RUN bun run build

# ----------------------------
# STEP 2: Production stage
# ----------------------------
FROM oven/bun:1

WORKDIR /app

# Copy only what we need for production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json bun.lock ./

# Expose the NestJS port
EXPOSE 3000

# Start the app (use NestJS production start)
CMD ["bun", "run", "start:prod"]

