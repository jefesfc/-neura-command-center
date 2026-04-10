# Stage 1: Build frontend + install backend deps
FROM node:20-slim AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install --ignore-scripts

COPY client/package*.json ./client/
RUN cd client && npm install --include=dev

COPY . .
RUN cd client && npm run build

# Stage 2: Runtime with Chromium
FROM node:20-slim
WORKDIR /app

RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Copy built artifacts from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/client/dist ./client/dist
COPY . .

RUN mkdir -p social-posts

EXPOSE 3000
CMD ["node", "server.js"]
