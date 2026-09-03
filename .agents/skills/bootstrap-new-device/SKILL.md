---
name: bootstrap-new-device
description: Initializes this calculator repo on a new Windows machine and verifies it can run. Use when cloning on a new device, setting up from scratch, onboarding, missing node_modules, or when the user asks to bootstrap, install, or start the project.
---

# Bootstrap on a new device

Execute these steps in order. Do not skip checks. Use **PowerShell**. Repo root is the directory that contains `frontend/`, `backend/`, and `README.md`.

Copy this checklist and mark items as you go:

```
Bootstrap:
- [ ] 1. Confirm repo root and tools
- [ ] 2. Install missing runtimes (Windows)
- [ ] 3. Frontend deps and .env
- [ ] 4. Backend compile/test
- [ ] 5. Frontend test
- [ ] 6. Start API + Vite (only if the user wants the app running)
```

## 1. Confirm repo root and tools

```powershell
Get-Location
Test-Path .\frontend\package.json
Test-Path .\backend\go.mod
node --version
npm --version
go version
git --version
```

Required: **Node.js 20+**, **Go 1.22+**, **Git**. If `Test-Path` is false, `cd` to the clone first. If the folder is empty, clone then `cd`:

```powershell
git clone <repository-url> sezzle-calc
Set-Location .\sezzle-calc
```

## 2. Install missing runtimes (Windows)

Only if a command failed with "not recognized". Need network. After install, **open a new PowerShell** (or refresh PATH) and re-run step 1.

```powershell
winget install --id Git.Git -e --accept-package-agreements --accept-source-agreements
winget install --id OpenJS.NodeJS.LTS -e --accept-package-agreements --accept-source-agreements
winget install --id GoLang.Go -e --accept-package-agreements --accept-source-agreements
```

Do not invent other package managers unless `winget` is unavailable.

## 3. Frontend deps and env

```powershell
Set-Location .\frontend
npm install
if (-not (Test-Path .\.env)) { Copy-Item .env.example .env }
Set-Location ..
```

`.env` must contain `VITE_API_BASE_URL=http://localhost:8080` for local Vite.

## 4. Backend check

```powershell
Set-Location .\backend
go test ./...
Set-Location ..
```

Must exit 0. If Go modules fail, fix GOPROXY/network; this module has no extra deps.

## 5. Frontend check

```powershell
Set-Location .\frontend
npm run test
Set-Location ..
```

Must exit 0.

## 6. Run the app (optional)

Do **not** start Docker in parallel (host port 8080 clash). Start **two** long-running processes from repo root:

**API** (background):

```powershell
Set-Location .\backend
go run .\cmd\server
```

Wait until the log contains `calculator API listening`. Probe: `Invoke-RestMethod http://localhost:8080/health` → `status` is `ok`.

**Vite** (background):

```powershell
Set-Location .\frontend
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). If health fails, the API is not up or port 8080 is taken — stop the Docker container or the other listener first.

## Docker alternative (not for daily UI work)

Only if the user wants the production image. Image is static; source edits need a rebuild.

```powershell
docker build -t fullstack-calculator .
docker run --rm -p 8080:80 fullstack-calculator
```

App: `http://localhost:8080`. Health: `http://localhost:8080/health`.

## Done when

- `go test ./...` and `npm run test` passed, **or**
- local health + Vite (or Docker `:8080`) respond, if the user asked to run the app

Report Node, Go, and Git versions and which mode you started (local two-process vs Docker).
