---
name: docker-up
description: >
  Manage the WealthWise Docker/Podman Compose development environment.
  Triggers when asked to "start Docker", "start Podman", "bring up the containers", "stop Docker",
  "show Docker logs", or "restart the dev environment". Does NOT trigger implicitly.
---

Manage the WealthWise container development environment (Docker or Podman).

## Runtime detection

Detect which container runtime is available:
1. `docker info 2>/dev/null | head -1` — if it succeeds, use `docker compose`
2. Else `podman info 2>/dev/null | head -1` — if it succeeds, use `podman-compose`
3. If neither is available, report the error and stop

## Commands by argument

**Docker:**

| Argument | Action | Command |
|----------|--------|---------|
| (none) or `dev` | Start dev environment | `docker compose up --build -d` |
| `prod` | Start production stack | `docker compose -f docker-compose.prod.yml up --build -d` |
| `down` | Stop containers (preserve data) | `docker compose down` |
| `down --volumes` | Stop + wipe all volumes (data destroyed) | `docker compose down -v` |
| `logs` | Tail all service logs | `docker compose logs -f` |
| `logs api` or `logs web` | Tail one service | `docker compose logs -f <service>` |

**Podman:**

| Argument | Action | Command |
|----------|--------|---------|
| (none) or `dev` | Start dev environment | `podman-compose -f podman-compose.yml up --build -d` |
| `prod` | Start production stack | `podman-compose -f podman-compose.prod.yml up --build -d` |
| `down` | Stop containers (preserve data) | `podman-compose -f podman-compose.yml down` |
| `down --volumes` | Stop + wipe all volumes (data destroyed) | `podman-compose -f podman-compose.yml down -v` |
| `logs` | Tail all service logs | `podman-compose -f podman-compose.yml logs -f` |
| `logs api` or `logs web` | Tail one service | `podman-compose -f podman-compose.yml logs -f <service>` |

Services and ports (dev):
- `api` → port 4000
- `web` → port 3000
- `mongodb` → port 27017
- `mcp` → port 5100
- `agentic-ai` → port 5200

## Pre-flight checks (before starting)

1. Docker or Podman daemon is running (see runtime detection)
2. `.env` exists in `apps/api/`: `test -f apps/api/.env`. Never read it.
3. `.env` exists in `apps/web/`: `test -f apps/web/.env`. Never read it.
4. Port conflicts: check if 4000, 3000, or 27017 are already bound.

## Confirm destructive actions

**`down --volumes` wipes all MongoDB data.** Always confirm with the user before running.

## After starting

1. Wait ~10 seconds, then check: `docker compose ps` or `podman ps`
2. Report which services are healthy and their ports.
3. If any service is unhealthy: show logs for that service

## Compose files

**Docker:**
- `docker-compose.yml` — development (hot-reload, volume mounts)
- `docker-compose.prod.yml` — production (Nginx reverse proxy, production builds)
- `docker-compose.production.yml` — hardened production (healthchecks, resource limits)

**Podman:**
- `podman-compose.yml` — development (Containerfiles, fully-qualified image refs)
- `podman-compose.prod.yml` — production (healthchecks, resource limits, Nginx)
