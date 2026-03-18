Start the WealthWise development environment with Docker Compose or Podman Compose.

Mode: $ARGUMENTS

## Runtime detection

Detect which container runtime is available:
1. Check `docker info 2>/dev/null` — if it succeeds, use `docker compose`
2. Else check `podman info 2>/dev/null` — if it succeeds, use `podman-compose`
3. If neither is available, report the error and stop

When using Podman, substitute:
- `docker compose` → `podman-compose`
- `docker-compose.yml` → `podman-compose.yml`
- `docker-compose.prod.yml` → `podman-compose.prod.yml`

## Behavior

### Default (no argument or "dev")
```
# Docker
docker compose up --build -d

# Podman
podman-compose -f podman-compose.yml up --build -d
```
Starts the development environment with hot-reload and volume mounts.
Services started: `api` (port 4000), `web` (port 3000), `mongodb` (port 27017), `mcp` (port 5100), `agentic-ai` (port 5200).

### "prod"
```
# Docker
docker compose -f docker-compose.prod.yml up --build -d

# Podman
podman-compose -f podman-compose.prod.yml up --build -d
```
Starts the production stack with Nginx reverse proxy and production builds.
Note: requires production env vars to be set.

### "down"
```
# Docker
docker compose down

# Podman
podman-compose -f podman-compose.yml down
```
Stops and removes all containers. Does NOT remove volumes (data is preserved).

### "down --volumes"
```
# Docker
docker compose down -v

# Podman
podman-compose -f podman-compose.yml down -v
```
Stops containers AND removes all volumes (MongoDB data will be wiped). Confirm before running.

### "logs"
```
# Docker
docker compose logs -f

# Podman
podman-compose -f podman-compose.yml logs -f
```
Tail logs from all services.

### "logs api" or "logs web"
```
# Docker
docker compose logs -f <service>

# Podman
podman-compose -f podman-compose.yml logs -f <service>
```

## Pre-flight checks
1. Confirm Docker or Podman is running (see runtime detection above)
2. Confirm a `.env` file exists in both `apps/api/` and `apps/web/` (just check existence, never read contents)
3. If MongoDB port 27017 is already in use, warn the user

## After starting
- Wait ~10 seconds and check container health: `docker compose ps` or `podman ps --filter label=com.docker.compose.project`
- Report which services are healthy and their exposed ports
- If any service is unhealthy, show its logs
