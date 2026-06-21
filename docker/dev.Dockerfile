# syntax=docker/dockerfile:1.7

# Lagda DEV image — one image for the whole live-reload dev stack (web, server, auth, migrate, seed).
#
# It installs the ENTIRE workspace (including dev deps: vite, tsx, vitest) from the frozen lockfile.
# Internal packages export their TypeScript source directly (e.g. "@lagda/auth-contract" -> ./src/...),
# so there is NO build step: Vite (web) and tsx (server/auth) consume `.ts` source, and editing any
# package hot-reloads its consumers.
#
# At runtime the repo is bind-mounted at /repo for live source, while every node_modules is shadowed by
# an anonymous volume (see docker-compose.dev.yml) so THIS image's install — not the host, which may
# have none — is what each container resolves. `.dockerignore` keeps node_modules and .env out of the
# build context, so the install is clean and the host's localhost .env can never leak in.

FROM node:20-slim
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /repo

COPY . .
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install --frozen-lockfile

# Each compose service overrides this with its own watch command; kept explicit for documentation.
CMD ["pnpm", "run", "dev"]
