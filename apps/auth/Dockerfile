# syntax=docker/dockerfile:1.7

# Multi-stage build for the Lagda identity & token service (@lagda/auth).
# - builder: install the whole workspace from the frozen lockfile and build @lagda/auth (tsup).
# - pruner:  `pnpm deploy --prod` -> a self-contained, prod-only deployment for `node dist/server.js`.
# - runner:  slim, non-root runtime that runs the auth service (compose default target).
# - tooling: full (incl. dev deps) workspace image used by the one-shot MIGRATE and SEED compose
#   services — they need `tsx` (devDep) + the TypeScript source, since the Better Auth CLI reads
#   better-auth.config.ts and the seed runs scripts/seedFirstOrganization.ts via tsx.

FROM node:20-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /repo

# --- builder: full workspace install + Turbo build of the auth service -------------------------------
FROM base AS builder
COPY . .
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm turbo run build --filter=@lagda/auth

# --- pruner: prod-only deployment of the auth service ------------------------------------------------
FROM base AS pruner
COPY --from=builder /repo /repo
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm --filter=@lagda/auth deploy --prod /app

# --- runner: minimal non-root runtime (the service) --------------------------------------------------
FROM node:20-slim AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=pruner --chown=node:node /app ./
USER node
EXPOSE 3100
CMD ["node", "dist/server.js"]

# --- tooling: dev-deps + source, used by the migrate & seed one-shot services ------------------------
# Keeps the migration/seed toolchain (tsx + Better Auth CLI via npx + TS source) out of the slim
# runtime image. The whole built workspace lives here, so migrate/seed can run against any package.
FROM base AS tooling
ENV NODE_ENV=development
COPY --from=builder --chown=node:node /repo /repo
WORKDIR /repo/apps/auth
USER node
# Default command is overridden per compose service (migrate vs seed); kept explicit for documentation.
CMD ["pnpm", "run", "migrate:auth"]
