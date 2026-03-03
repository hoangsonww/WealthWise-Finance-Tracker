---
name: docker-up
description: >
  Manage the WealthWise Docker Compose development environment.
  Triggers when asked to "start Docker", "bring up the containers", "stop Docker",
  "show Docker logs", or "restart the dev environment". Does NOT trigger implicitly.
---

Manage the WealthWise Docker development environment.

## Commands by argument

| Argument | Action | Command |
|----------|--------|---------|
| (none) or `dev` | Start dev environment | `docker compose up --build -d` |
| `prod` | Start production stack | `docker compose -f docker-compose.prod.yml up --build -d` |
| `down` | Stop containers (preserve data) | `docker compose down` |
| `down --volumes` | Stop + wipe all volumes (data destroyed) | `docker compose down -v` |
| `logs` | Tail all service logs | `docker compose logs -f` |
| `logs api` or `logs web` | Tail one service | `docker compose logs -f <service>` |

Services and ports (dev):
- `api` → port 4000
- `web` → port 3000
- `mongodb` → port 27017

## Pre-flight checks (before starting)

1. Docker daemon is running: `docker info 2>/dev/null | head -1`
2. `.env` exists in `apps/api/`: `test -f apps/api/.env`. Never read it.
3. `.env` exists in `apps/web/`: `test -f apps/web/.env`. Never read it.
4. Port conflicts: check if 4000, 3000, or 27017 are already bound.

## Confirm destructive actions

**`down --volumes` wipes all MongoDB data.** Always confirm with the user before running.

## After starting

1. Wait ~10 seconds, then check: `docker compose ps`
2. Report which services are healthy and their ports.
3. If any service is unhealthy: `docker compose logs <service> --tail=50`

## Docker Compose files

- `docker-compose.yml` — development (hot-reload, volume mounts)
- `docker-compose.prod.yml` — production (Nginx reverse proxy, production builds)
