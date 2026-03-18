---
name: health-check
description: >
  Check the health of the running WealthWise API, web app, and MongoDB services.
  Triggers when asked to "check if the app is running", "verify the API is up",
  "is the server healthy", or "show service status".
---

Check the health of the running WealthWise services.

## Checks

### 1. API health
```bash
curl -sf http://localhost:4000/api/health
```
Expected: HTTP 200 with `{ "status": "ok" }`.

### 2. Web app
```bash
curl -sf -o /dev/null -w "%{http_code}" http://localhost:3000/
```
Expected: HTTP 200.

### 3. Containers (if running in Docker or Podman)
```bash
# Try Docker first
docker compose ps 2>/dev/null

# If Docker is not available, try Podman
podman ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null
```

### 4. MongoDB (inferred from API health)
The API health endpoint reflects DB connectivity. HTTP 503 from the health endpoint typically means MongoDB is unreachable.

## Report format

```
Service          Status    Notes
─────────────────────────────────────────
API (port 4000)  ✓ up   |  ✗ unreachable
Web (port 3000)  ✓ up   |  ✗ unreachable
MongoDB          ✓ connected | ✗ disconnected (via API health)
Docker/Podman    ✓ running X/N containers | ✗ daemon not running
```

## On failure

If a service is down:
1. Check container status: `docker compose ps` or `podman ps`
2. Show recent logs: `docker compose logs --tail=30 <service>` or `podman logs --tail=30 <container>`
3. Check for port conflicts
4. Suggest the correct command to start: `$docker-up`
