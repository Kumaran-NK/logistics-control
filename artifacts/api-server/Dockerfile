# ── API Server ────────────────────────────────────────────────────────────────
FROM node:24-slim

# Install pnpm + pg_isready (postgresql-client)
RUN corepack enable && corepack prepare pnpm@10 --activate \
    && apt-get update \
    && apt-get install -y --no-install-recommends postgresql-client \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy workspace root config first (layer-cache friendly)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY tsconfig.base.json tsconfig.json ./

# Copy all workspace packages the API server depends on
COPY lib/db/               ./lib/db/
COPY lib/api-zod/          ./lib/api-zod/
COPY lib/api-spec/         ./lib/api-spec/
COPY lib/api-client-react/ ./lib/api-client-react/
COPY scripts/              ./scripts/
COPY artifacts/api-server/ ./artifacts/api-server/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Build API server for production start
WORKDIR /app/artifacts/api-server
RUN pnpm run build

# Copy and prepare the entrypoint
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8080
ENV PORT=8080

ENTRYPOINT ["/entrypoint.sh"]
