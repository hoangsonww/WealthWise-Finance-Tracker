Check the health of the running WealthWise API and web services.

Target: $ARGUMENTS

## Steps

### 1. Check API health
```
curl -sf http://localhost:4000/api/health
```
Expected response: `{ "status": "ok" }` with HTTP 200.

If that fails, also try:
```
curl -sf http://localhost:4000/
```

### 2. Check web app
```
curl -sf -o /dev/null -w "%{http_code}" http://localhost:3000/
```
Expected: HTTP 200.

### 3. Check containers (if running in Docker or Podman)
```
# Try Docker first
docker compose ps 2>/dev/null

# If Docker is not available, try Podman
podman ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null
```
Show the status of all containers and their health checks.

### 4. Check MongoDB connectivity (via API)
The API health endpoint should reflect DB connectivity. If the API is up but DB is down, the health endpoint typically returns 503.

## Report format

```
API (localhost:4000):    ✓ healthy  |  ✗ unreachable (connection refused)
Web (localhost:3000):    ✓ healthy  |  ✗ unreachable
MongoDB (via API):       ✓ connected |  ✗ disconnected
```

## On failure
If any service is unreachable:
1. Check if the process is running: `docker compose ps` or `podman ps` or check for Node processes
2. Show recent logs: `docker compose logs --tail=30 <service>` or `podman logs --tail=30 <container>`
3. Check for port conflicts: note which process is using the port
4. Suggest the fix: either start the service or kill the conflicting process
