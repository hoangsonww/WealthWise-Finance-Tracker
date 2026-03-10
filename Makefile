# ==============================================================================
# WealthWise — Makefile
# ==============================================================================
# Production-ready build, test, and operations automation for the WealthWise
# Turborepo monorepo. Works on Linux, macOS, and Windows (Git Bash / WSL).
#
# Usage:
#   make help          Show all available targets
#   make dev           Start development environment (native)
#   make test          Run all tests
#   make prod-up       Start hardened production stack
# ==============================================================================

SHELL := /bin/bash
.DEFAULT_GOAL := help

# ------------------------------------------------------------------------------
# Configuration
# ------------------------------------------------------------------------------

COMPOSE_DEV     := docker compose -f docker-compose.yml
COMPOSE_PROD    := docker compose -f docker-compose.production.yml
PODMAN_DEV      := podman-compose -f podman-compose.yml
PODMAN_PROD     := podman-compose -f podman-compose.prod.yml
TURBO           := npx turbo

# Package filter names (must match package.json "name" fields)
PKG_API         := @wealthwise/api
PKG_WEB         := @wealthwise/web
PKG_SHARED      := @wealthwise/shared-types

# Colors for terminal output
COLOR_RESET     := \033[0m
COLOR_GREEN     := \033[32m
COLOR_YELLOW    := \033[33m
COLOR_BLUE      := \033[34m
COLOR_RED       := \033[31m

# Timestamp for backups
TIMESTAMP       := $(shell date +%Y%m%d_%H%M%S)

# ------------------------------------------------------------------------------
# Help
# ------------------------------------------------------------------------------

.PHONY: help
help: ## Show this help message
	@echo ""
	@echo "  WealthWise — Available Targets"
	@echo "  ==============================="
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[34m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""

# ------------------------------------------------------------------------------
# Development
# ------------------------------------------------------------------------------

.PHONY: install
install: ## Install all dependencies
	npm install

.PHONY: dev
dev: ## Start all packages in development mode (native, no Docker)
	$(TURBO) dev

.PHONY: dev-api
dev-api: ## Start API only in development mode
	$(TURBO) dev --filter=$(PKG_API)

.PHONY: dev-web
dev-web: ## Start web only in development mode
	$(TURBO) dev --filter=$(PKG_WEB)

.PHONY: dev-docker
dev-docker: ## Start development environment with Docker Compose
	$(COMPOSE_DEV) up --build

.PHONY: dev-docker-detach
dev-docker-detach: ## Start development Docker environment (detached)
	$(COMPOSE_DEV) up --build -d

.PHONY: dev-down
dev-down: ## Stop development Docker environment
	$(COMPOSE_DEV) down

# ------------------------------------------------------------------------------
# Build
# ------------------------------------------------------------------------------

.PHONY: build
build: ## Build all packages
	$(TURBO) build

.PHONY: build-api
build-api: ## Build API package only
	$(TURBO) build --filter=$(PKG_API)

.PHONY: build-web
build-web: ## Build web package only
	$(TURBO) build --filter=$(PKG_WEB)

.PHONY: build-shared
build-shared: ## Build shared-types package only
	$(TURBO) build --filter=$(PKG_SHARED)

# ------------------------------------------------------------------------------
# Testing
# ------------------------------------------------------------------------------

.PHONY: test
test: ## Run all tests across all packages
	$(TURBO) test

.PHONY: test-api
test-api: ## Run API tests only
	$(TURBO) test --filter=$(PKG_API)

.PHONY: test-web
test-web: ## Run web tests only
	$(TURBO) test --filter=$(PKG_WEB)

.PHONY: test-shared
test-shared: ## Run shared-types tests only
	$(TURBO) test --filter=$(PKG_SHARED)

.PHONY: test-watch
test-watch: ## Run all tests in watch mode
	$(TURBO) test:watch

.PHONY: test-coverage
test-coverage: ## Run all tests with coverage report
	$(TURBO) test:coverage

# ------------------------------------------------------------------------------
# Code Quality
# ------------------------------------------------------------------------------

.PHONY: lint
lint: ## Type-check all packages
	$(TURBO) lint

.PHONY: format
format: ## Format all files with Prettier
	npm run format

.PHONY: format-check
format-check: ## Check formatting without modifying files
	npm run format:check

.PHONY: check
check: lint format-check test ## Run all quality checks (lint + format + test)

# ------------------------------------------------------------------------------
# Database
# ------------------------------------------------------------------------------

.PHONY: db-seed
db-seed: ## Seed default categories
	npm run db:seed

.PHONY: db-seed-demo
db-seed-demo: ## Seed demo data (destructive — replaces demo user data)
	npm run db:seed -- demo

.PHONY: db-backup
db-backup: ## Backup production MongoDB to ./backups/
	@mkdir -p backups
	$(COMPOSE_PROD) exec -T mongodb mongodump \
		--db wealthwise --archive --gzip > backups/wealthwise_$(TIMESTAMP).archive.gz
	@echo -e "$(COLOR_GREEN)Backup saved to backups/wealthwise_$(TIMESTAMP).archive.gz$(COLOR_RESET)"

.PHONY: db-restore
db-restore: ## Restore MongoDB from backup (usage: make db-restore BACKUP=backups/file.archive.gz)
ifndef BACKUP
	$(error BACKUP is required. Usage: make db-restore BACKUP=backups/wealthwise_20260303.archive.gz)
endif
	cat $(BACKUP) | $(COMPOSE_PROD) exec -T mongodb mongorestore \
		--archive --gzip --drop
	@echo -e "$(COLOR_GREEN)Database restored from $(BACKUP)$(COLOR_RESET)"

# ------------------------------------------------------------------------------
# Docker — Development
# ------------------------------------------------------------------------------

.PHONY: docker-build
docker-build: ## Build development Docker images
	$(COMPOSE_DEV) build

.PHONY: docker-up
docker-up: ## Start development Docker stack
	$(COMPOSE_DEV) up -d

.PHONY: docker-down
docker-down: ## Stop development Docker stack
	$(COMPOSE_DEV) down

.PHONY: docker-logs
docker-logs: ## Tail development Docker logs
	$(COMPOSE_DEV) logs -f

.PHONY: docker-ps
docker-ps: ## Show development container status
	$(COMPOSE_DEV) ps

# ------------------------------------------------------------------------------
# Docker — Production (Hardened)
# ------------------------------------------------------------------------------

.PHONY: prod-build
prod-build: ## Build production Docker images (hardened)
	$(COMPOSE_PROD) build

.PHONY: prod-up
prod-up: ## Start production stack (hardened, detached)
	$(COMPOSE_PROD) up -d
	@echo -e "$(COLOR_GREEN)Production stack started. Checking health...$(COLOR_RESET)"
	@sleep 5
	@$(MAKE) --no-print-directory prod-health

.PHONY: prod-down
prod-down: ## Stop production stack
	$(COMPOSE_PROD) down

.PHONY: prod-restart
prod-restart: ## Restart production stack
	$(COMPOSE_PROD) down
	$(COMPOSE_PROD) up -d
	@sleep 5
	@$(MAKE) --no-print-directory prod-health

.PHONY: prod-logs
prod-logs: ## Tail production logs
	$(COMPOSE_PROD) logs -f

.PHONY: prod-logs-api
prod-logs-api: ## Tail production API logs
	$(COMPOSE_PROD) logs -f api

.PHONY: prod-logs-web
prod-logs-web: ## Tail production web logs
	$(COMPOSE_PROD) logs -f web

.PHONY: prod-logs-nginx
prod-logs-nginx: ## Tail production Nginx logs
	$(COMPOSE_PROD) logs -f nginx

.PHONY: prod-ps
prod-ps: ## Show production container status
	$(COMPOSE_PROD) ps

.PHONY: prod-stats
prod-stats: ## Show production resource usage
	docker stats --no-stream $$($(COMPOSE_PROD) ps -q)

.PHONY: prod-health
prod-health: ## Check health of all production services
	@echo -e "$(COLOR_BLUE)Service Health:$(COLOR_RESET)"
	@for svc in mongodb api web nginx; do \
		status=$$(docker inspect --format='{{.State.Health.Status}}' \
			$$($(COMPOSE_PROD) ps -q $$svc) 2>/dev/null || echo "not running"); \
		if [ "$$status" = "healthy" ]; then \
			echo -e "  $$svc: $(COLOR_GREEN)$$status$(COLOR_RESET)"; \
		elif [ "$$status" = "starting" ]; then \
			echo -e "  $$svc: $(COLOR_YELLOW)$$status$(COLOR_RESET)"; \
		else \
			echo -e "  $$svc: $(COLOR_RED)$$status$(COLOR_RESET)"; \
		fi; \
	done

.PHONY: prod-shell-api
prod-shell-api: ## Open shell in production API container
	$(COMPOSE_PROD) exec api sh

.PHONY: prod-shell-mongo
prod-shell-mongo: ## Open mongosh in production MongoDB container
	$(COMPOSE_PROD) exec mongodb mongosh wealthwise

# ------------------------------------------------------------------------------
# Production Deploy Workflow
# ------------------------------------------------------------------------------

.PHONY: prod-deploy
prod-deploy: prod-preflight prod-build prod-up ## Full production deploy (preflight → build → up)
	@echo -e "$(COLOR_GREEN)Production deployment complete.$(COLOR_RESET)"

.PHONY: prod-preflight
prod-preflight: ## Validate environment before production deploy
	@echo -e "$(COLOR_BLUE)Running production preflight checks...$(COLOR_RESET)"
	@fail=0; \
	for var in JWT_SECRET JWT_REFRESH_SECRET NEXTAUTH_SECRET NEXTAUTH_URL NEXT_PUBLIC_API_URL CORS_ORIGIN; do \
		if [ -z "$${!var}" ]; then \
			echo -e "  $(COLOR_RED)MISSING$(COLOR_RESET): $$var"; \
			fail=1; \
		else \
			echo -e "  $(COLOR_GREEN)OK$(COLOR_RESET):      $$var"; \
		fi; \
	done; \
	if [ ! -f nginx/ssl/fullchain.pem ] || [ ! -f nginx/ssl/privkey.pem ]; then \
		echo -e "  $(COLOR_RED)MISSING$(COLOR_RESET): SSL certificates in nginx/ssl/"; \
		fail=1; \
	else \
		echo -e "  $(COLOR_GREEN)OK$(COLOR_RESET):      SSL certificates found"; \
	fi; \
	if [ $$fail -eq 1 ]; then \
		echo -e "\n$(COLOR_RED)Preflight failed. Set missing variables and try again.$(COLOR_RESET)"; \
		exit 1; \
	fi; \
	echo -e "\n$(COLOR_GREEN)All preflight checks passed.$(COLOR_RESET)"

# ------------------------------------------------------------------------------
# Podman — Development
# ------------------------------------------------------------------------------

.PHONY: podman-build
podman-build: ## Build development Podman images
	$(PODMAN_DEV) build

.PHONY: podman-up
podman-up: ## Start development Podman stack
	$(PODMAN_DEV) up -d

.PHONY: podman-down
podman-down: ## Stop development Podman stack
	$(PODMAN_DEV) down

.PHONY: podman-logs
podman-logs: ## Tail development Podman logs
	$(PODMAN_DEV) logs -f

.PHONY: podman-ps
podman-ps: ## Show development Podman container status
	podman ps --filter label=io.podman.compose.project

# ------------------------------------------------------------------------------
# Podman — Production
# ------------------------------------------------------------------------------

.PHONY: podman-prod-build
podman-prod-build: ## Build production Podman images (hardened)
	$(PODMAN_PROD) build

.PHONY: podman-prod-up
podman-prod-up: ## Start production Podman stack (hardened, detached)
	$(PODMAN_PROD) up -d
	@echo -e "$(COLOR_GREEN)Production stack started with Podman.$(COLOR_RESET)"

.PHONY: podman-prod-down
podman-prod-down: ## Stop production Podman stack
	$(PODMAN_PROD) down

.PHONY: podman-prod-logs
podman-prod-logs: ## Tail production Podman logs
	$(PODMAN_PROD) logs -f

.PHONY: podman-prod-deploy
podman-prod-deploy: prod-preflight podman-prod-build podman-prod-up ## Full Podman production deploy (preflight → build → up)
	@echo -e "$(COLOR_GREEN)Podman production deployment complete.$(COLOR_RESET)"

# ------------------------------------------------------------------------------
# Cleanup
# ------------------------------------------------------------------------------

.PHONY: clean
clean: ## Remove all build artifacts
	$(TURBO) clean
	@echo -e "$(COLOR_GREEN)Build artifacts cleaned.$(COLOR_RESET)"

.PHONY: clean-all
clean-all: clean ## Remove build artifacts + node_modules
	rm -rf node_modules apps/*/node_modules packages/*/node_modules
	@echo -e "$(COLOR_GREEN)All node_modules removed.$(COLOR_RESET)"

.PHONY: clean-docker
clean-docker: ## Remove all Docker containers, images, and volumes for this project
	$(COMPOSE_DEV) down -v --rmi local 2>/dev/null || true
	$(COMPOSE_PROD) down -v --rmi local 2>/dev/null || true
	@echo -e "$(COLOR_GREEN)Docker resources cleaned.$(COLOR_RESET)"

.PHONY: clean-everything
clean-everything: clean-all clean-docker ## Nuclear option: remove everything (artifacts + modules + docker)
	docker system prune -f --filter "label=com.docker.compose.project=personal-finance-app" 2>/dev/null || true
	@echo -e "$(COLOR_YELLOW)Everything cleaned. Run 'make install' to start fresh.$(COLOR_RESET)"

# ------------------------------------------------------------------------------
# Utilities
# ------------------------------------------------------------------------------

.PHONY: env-check
env-check: ## Show which environment variables are set
	@echo -e "$(COLOR_BLUE)Environment Variable Status:$(COLOR_RESET)"
	@for var in MONGODB_URI JWT_SECRET JWT_REFRESH_SECRET NEXTAUTH_SECRET \
		NEXTAUTH_URL NEXT_PUBLIC_API_URL API_URL API_PORT CORS_ORIGIN NODE_ENV \
		GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET; do \
		if [ -n "$${!var}" ]; then \
			echo -e "  $(COLOR_GREEN)SET$(COLOR_RESET):     $$var"; \
		else \
			echo -e "  $(COLOR_YELLOW)UNSET$(COLOR_RESET):   $$var"; \
		fi; \
	done

.PHONY: ssl-check
ssl-check: ## Check SSL certificate expiry date
	@if [ -f nginx/ssl/fullchain.pem ]; then \
		expiry=$$(openssl x509 -enddate -noout -in nginx/ssl/fullchain.pem | cut -d= -f2); \
		echo -e "$(COLOR_BLUE)SSL Certificate expires:$(COLOR_RESET) $$expiry"; \
	else \
		echo -e "$(COLOR_RED)No SSL certificate found at nginx/ssl/fullchain.pem$(COLOR_RESET)"; \
	fi

.PHONY: disk-usage
disk-usage: ## Show Docker/Podman disk usage
	@docker system df 2>/dev/null || podman system df 2>/dev/null || echo "Neither Docker nor Podman found"

.PHONY: versions
versions: ## Show versions of key tools
	@echo -e "$(COLOR_BLUE)Tool Versions:$(COLOR_RESET)"
	@echo -n "  Node.js:       " && node --version 2>/dev/null || echo "not installed"
	@echo -n "  npm:           " && npm --version 2>/dev/null || echo "not installed"
	@echo -n "  Docker:        " && docker --version 2>/dev/null || echo "not installed"
	@echo -n "  Compose:       " && docker compose version 2>/dev/null || echo "not installed"
	@echo -n "  Podman:        " && podman --version 2>/dev/null || echo "not installed"
	@echo -n "  podman-compose:" && podman-compose --version 2>/dev/null || echo " not installed"
	@echo -n "  Turbo:         " && npx turbo --version 2>/dev/null || echo "not installed"
	@echo -n "  TypeScript:    " && npx tsc --version 2>/dev/null || echo "not installed"
