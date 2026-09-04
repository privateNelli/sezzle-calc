# Development

Target environment: **Windows 10+ and PowerShell**. For a new clone, agents must follow [`.agents/skills/bootstrap-new-device/SKILL.md`](../.agents/skills/bootstrap-new-device/SKILL.md) (install tools, `npm install`, tests, then run).

## Prerequisites

- Node.js 20 or newer
- Go 1.22 or newer
- Git
- Docker (only if you run the production image)

## First-time setup

```powershell
Set-Location .\frontend
npm install
Copy-Item .env.example .env
```

## Daily run (two terminals)

**Terminal 1 — API**

```powershell
Set-Location .\backend
go run .\cmd\server
```

**Terminal 2 — UI**

```powershell
Set-Location .\frontend
npm run dev
```

Open the URL Vite prints, usually `http://localhost:5173`.

Do not run `docker run -p 8080:80` at the same time as the local API: both use host port 8080 by default (Docker maps host `8080` to container `80`; inside the image the API listens on `127.0.0.1:8080` only).

## Frontend iteration vs Docker

The container serves a **static** `npm run build` output. Editing `frontend/src` does not update a running container. Use Vite for UI work; rebuild the image to verify production.

## Agent skills

Project skills live in `.agents/skills/` (`bootstrap-new-device`, `api-and-interface-design`, `frontend-ui-engineering`, `test-driven-development`, `code-review-and-quality`). They are process guides for contributors using Cursor, not runtime dependencies.
