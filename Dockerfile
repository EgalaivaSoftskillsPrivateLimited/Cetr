FROM node:22-bookworm-slim

WORKDIR /app

# Debian Chromium is a real browser (Ubuntu 24.04's `chromium` package is not).
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    fonts-noto-core \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

COPY package.json package-lock.json ./
RUN npm ci --include=dev

COPY . .
RUN npm run build && npm prune --omit=dev

EXPOSE 3000
CMD ["npm", "run", "start"]
