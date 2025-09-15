
# Use official Node.js image
FROM node:20

WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json ./
# RUN npm ci --omit=dev

# Copy source code
COPY . .

# Install system dependencies
RUN apt-get update -y && apt-get install -y openssl

# Generate Prisma client and build
RUN npm i
RUN npx prisma generate
RUN npm run build

EXPOSE 4000

# Use the actual path where main.js is located
CMD ["node", "dist/src/main.js"]

