FROM node:22-bookworm-slim AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/db/game.sqlite

COPY package*.json ./
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl \
  && npm ci --omit=dev \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

COPY src ./src

RUN mkdir -p /app/db

EXPOSE 3000
VOLUME ["/app/db"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl --fail "http://127.0.0.1:${PORT}" || exit 1

CMD ["npm", "start"]
