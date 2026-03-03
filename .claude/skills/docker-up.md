Start the WealthWise development environment with Docker Compose.

Mode: $ARGUMENTS

## Behavior

### Default (no argument or "dev")
```
docker compose up --build -d
```
Starts the development environment (`docker-compose.yml`) with hot-reload and volume mounts.
Services started: `api` (port 4000), `web` (port 3000), `mongodb` (port 27017).

### "prod"
```
docker compose -f docker-compose.prod.yml up --build -d
```
Starts the production stack with Nginx reverse proxy and production builds.
Note: requires production env vars to be set.

### "down"
```
docker compose down
```
Stops and removes all containers. Does NOT remove volumes (data is preserved).

### "down --volumes"
```
docker compose down -v
```
Stops containers AND removes all volumes (MongoDB data will be wiped). Confirm before running.

### "logs"
```
docker compose logs -f
```
Tail logs from all services.

### "logs api" or "logs web"
```
docker compose logs -f <service>
```

## Pre-flight checks
1. Confirm Docker daemon is running: `docker info`
2. Confirm a `.env` file exists in both `apps/api/` and `apps/web/` (just check existence, never read contents)
3. If MongoDB port 27017 is already in use, warn the user

## After starting
- Wait ~10 seconds and check container health: `docker compose ps`
- Report which services are healthy and their exposed ports
- If any service is unhealthy, show its logs: `docker compose logs <service> --tail=50`
