# Lagda — common tasks. Run `make` (or `make help`) to list them.
#
# Everything the app needs runs in Docker — no host Node or pnpm required. The toolchain targets
# (check/test/lint/format) are the only ones that use pnpm, for contributors verifying changes.

DEV  := docker compose -f docker-compose.dev.yml
PROD := docker compose
OBS  := docker compose -f docker-compose.observability.yml

.DEFAULT_GOAL := help

.PHONY: help dev dev-down dev-reset dev-build otp up up-build down reset logs ps obs obs-down check test lint format

help: ## List the available targets
	@grep -hE '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "} {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

# --- Dev: full stack with live reload, no pnpm (web HMR :5173, server :3000, auth :3100) ---

dev: ## Start the dev stack with live reload (logs attached; Ctrl-C to stop)
	$(DEV) up

dev-build: ## Rebuild the dev image, then start the dev stack (after dependency changes)
	$(DEV) up --build

dev-down: ## Stop the dev stack
	$(DEV) down

dev-reset: ## Stop the dev stack and wipe its database volume
	$(DEV) down -v

otp: ## Tail the auth logs to read the dev sign-in one-time code
	$(DEV) logs -f auth

# --- Prod: zero-config self-host stack (app on :3000) ---

up: ## Start the production stack in the background (app :3000)
	$(PROD) up -d --wait

up-build: ## Rebuild images, then start the production stack
	$(PROD) up -d --wait --build

down: ## Stop the production stack
	$(PROD) down

reset: ## Stop the production stack and wipe its database volume
	$(PROD) down -v

# --- Shared helpers ---

logs: ## Follow logs for the dev stack (one service: make logs s=auth)
	$(DEV) logs -f $(s)

ps: ## Show the dev stack's containers and status
	$(DEV) ps

obs: ## Start the observability stack (Grafana :3001, Prometheus :9090)
	$(OBS) up -d

obs-down: ## Stop the observability stack
	$(OBS) down

# --- Toolchain (uses pnpm; for contributors verifying changes) ---

check: ## Full verification: lint + typecheck + test + build
	pnpm check

test: ## Run the test suites
	pnpm test

lint: ## Lint with oxlint
	pnpm lint

format: ## Format with oxfmt
	pnpm format
