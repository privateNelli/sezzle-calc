# Docker

One image runs the UI and the API. There is no `docker-compose` file.

## Build and run

From the repository root:

```powershell
docker build -t fullstack-calculator .
docker run --rm -p 8080:80 fullstack-calculator
```

Open `http://localhost:8080`.

| Host | Container | Role |
| --- | --- | --- |
| `8080` | `80` | Nginx: static React app + reverse proxy |

Inside the container the Go process listens on `127.0.0.1:8080`. Nginx proxies:

- `/api/` → Go `/api/`
- `/health` → Go `/health`
- everything else → `index.html` / static assets

## Image stages

1. **backend-builder** (`golang:1.27-alpine`): `CGO_ENABLED=0` binary `/calculator-api`.
2. **frontend-builder** (`node:22-alpine`): `npm ci` and `npm run build` with `VITE_API_BASE_URL=""`.
3. **runtime** (`nginx:1.29-alpine`): copies binary, `dist`, `docker/nginx.conf`, `docker/entrypoint.sh`, installs `dumb-init`. Sets `CALCULATOR_API_ADDR=127.0.0.1:8080` so the API stays on loopback.

`dumb-init` is PID 1 so `SIGTERM` reaches both Nginx and the API.

Docker `HEALTHCHECK` requests `http://127.0.0.1/health` (through Nginx). The bundled SPA also calls that path once on load; same-origin because `VITE_API_BASE_URL` is empty in this image.

## Files

| Path | Purpose |
| --- | --- |
| `Dockerfile` | Multi-stage build |
| `.dockerignore` | Drops `.git`, `node_modules`, coverage, `.agents` |
| `docker/nginx.conf` | Proxy and SPA fallback |
| `docker/entrypoint.sh` | Start API + Nginx; trap shutdown |

## Limits

- No bind mount of source; rebuild after frontend or backend changes.
- CORS is irrelevant for the bundled UI (same origin). Direct calls from another host to published port 8080 still hit Nginx, not the Go CORS middleware, unless you expose the API separately.
