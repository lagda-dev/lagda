# syntax=docker/dockerfile:1.7

# Multi-stage build for the Lagda application monolith (@lagda/server).
# - builder: install the whole workspace from the frozen lockfile, build the SPA (@lagda/web) and the
#   server (@lagda/server) through Turbo, fold the SPA's dist into the server's ./public.
# - pruner: use `pnpm deploy` to emit a self-contained, prod-only deployment (pruned node_modules +
#   built dist + public) so the runtime image carries only what `node dist/server.js` actually needs.
# - runner: a slim, non-root image that runs the bundled server. tsup inlines @lagda/* into the bundle
#   (noExternal), so only the EXTERNAL third-party deps (hono, jose, pg, ...) ship in node_modules.

# Pinned base images (digests omitted here for readability; pin by digest in a hardened build).
FROM node:20-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /repo

# --- builder: full workspace install + Turbo build ---------------------------------------------------
FROM base AS builder
# Copy the whole workspace. .dockerignore keeps node_modules/dist/caches out of the context.
COPY . .
# Deterministic install from the committed lockfile across all workspace packages.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install --frozen-lockfile
# Build the SPA and the server (Turbo resolves the ^build dependency graph and caches per package).
RUN pnpm turbo run build --filter=@lagda/web --filter=@lagda/server
# Serve-static in production reads ./public relative to the server's working dir — fold the SPA in.
RUN mkdir -p apps/server/public && cp -R apps/web/dist/. apps/server/public/

# --- pruner: emit a prod-only, self-contained deployment for the server ------------------------------
FROM base AS pruner
COPY --from=builder /repo /repo
# `pnpm deploy` resolves the package's prod dependencies and copies the built files into an isolated,
# hoisted node_modules tree at /app — no workspace symlinks, ready to run on its own.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm --filter=@lagda/server deploy --prod /app

# --- runner: minimal non-root runtime ----------------------------------------------------------------
FROM node:20-slim AS runner
ENV NODE_ENV=production
WORKDIR /app
# Drop privileges: run as the built-in unprivileged `node` user, never root.
COPY --from=pruner --chown=node:node /app ./
USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]
