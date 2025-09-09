# Use Node.js official image
FROM node:20-bullseye

# Install system dependencies (e.g., openssl)
RUN apt-get update -y && \
    apt-get install -y openssl curl && \
    rm -rf /var/lib/apt/lists/*

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files for caching
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the source code
COPY . .

# Generate Prisma client
RUN pnpm prisma generate

# Build the project
RUN pnpm build

# Expose port
EXPOSE 4000

# Start the app (adjust path if needed)
CMD ["node", "dist/src/main.js"]

