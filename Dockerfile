# ---- Base ----
FROM node:22-alpine AS base
WORKDIR /app

# ---- Dependencies ----
FROM base AS deps

COPY site/package.json site/package-lock.json ./site/
COPY admin/package.json admin/package-lock.json ./admin/
COPY shared/ ./shared/

RUN cd site && npm ci
RUN cd admin && npm ci

# Generate Prisma client
RUN cd shared && npx prisma generate

# ---- Build site ----
FROM base AS build-site
WORKDIR /app

COPY --from=deps /app/site/node_modules ./site/node_modules
COPY --from=deps /app/shared ./shared
COPY site/ ./site/

ENV DATABASE_URL="file:/data/store.db"
RUN cd site && npm run build

# ---- Build admin ----
FROM base AS build-admin
WORKDIR /app

COPY --from=deps /app/admin/node_modules ./admin/node_modules
COPY --from=deps /app/shared ./shared
COPY admin/ ./admin/

ENV DATABASE_URL="file:/data/store.db"
RUN cd admin && npm run build

# ---- Production ----
FROM base AS production
WORKDIR /app

# Copy shared (Prisma schema + migrations)
COPY --from=deps /app/shared ./shared

# Copy site standalone build
COPY --from=build-site /app/site/.next/standalone ./site-standalone/
COPY --from=build-site /app/site/.next/static ./site-standalone/.next/static
COPY --from=build-site /app/site/public ./site-standalone/public

# Copy admin standalone build
COPY --from=build-admin /app/admin/.next/standalone ./admin-standalone/
COPY --from=build-admin /app/admin/.next/static ./admin-standalone/.next/static

# Copy entrypoint
COPY deploy/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Persistent data volume
VOLUME /data

ENV NODE_ENV=production
ENV DATABASE_URL="file:/data/store.db"

EXPOSE 3000 3001

ENTRYPOINT ["/app/entrypoint.sh"]
