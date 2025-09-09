# Use a single stage to avoid copy issues
FROM oven/bun:1

WORKDIR /app
# Copy package files first for better caching
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

RUN apt-get update -y && apt-get install -y openssl
# Generate Prisma client and build
RUN bunx prisma generate
RUN bun run build

EXPOSE 4000

# Use the actual path where main.js is located
CMD ["bun", "run", "dist/src/main.js"]
