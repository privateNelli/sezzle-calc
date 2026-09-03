# Full-stack calculator

A small calculator application with a React + TypeScript client and a Go REST API. The client obtains available operations from the API, sends calculations to it, and displays accessible loading, validation, and error states.

## New device (agents: execute this)

On a fresh Windows machine, run these PowerShell steps from the repo root. The full agent checklist is [`.agents/skills/bootstrap-new-device/SKILL.md`](.agents/skills/bootstrap-new-device/SKILL.md) — follow it instead of improvising.

1. Confirm tools: Node.js 20+, Go 1.22+, Git (`node --version`, `go version`, `git --version`). If missing: `winget install --id Git.Git -e`, `winget install --id OpenJS.NodeJS.LTS -e`, `winget install --id GoLang.Go -e`, then open a new terminal.
2. `Set-Location .\frontend; npm install; if (-not (Test-Path .\.env)) { Copy-Item .env.example .env }; Set-Location ..`
3. `Set-Location .\backend; go test ./...; Set-Location ..`
4. `Set-Location .\frontend; npm run test; Set-Location ..`
5. Start the API (`go run .\cmd\server` in `backend\`) and Vite (`npm run dev` in `frontend\`). Open `http://localhost:5173`. Do not run Docker on port 8080 at the same time.

Extended documentation is in [`docs/`](docs/README.md) (architecture, API contract, backend, frontend, local development, testing, Docker, and design decisions).

## Requirements

- Node.js 20 or newer
- Go 1.22 or newer
- Git

## Run locally (PowerShell)

Install the frontend dependencies:

```powershell
Set-Location .\frontend
npm install
```

Start the API in one terminal:

```powershell
Set-Location .\backend
go run .\cmd\server
```

Start the frontend in another terminal:

```powershell
Set-Location .\frontend
Copy-Item .env.example .env
npm run dev
```

Open the local URL reported by Vite, normally `http://localhost:5173`.

## Run the full stack with Docker

Build the production image and run the frontend plus API behind one local endpoint:

```powershell
docker build -t fullstack-calculator .
docker run --rm -p 8080:80 fullstack-calculator
```

Open `http://localhost:8080`. Nginx serves the React app and proxies `/api/*` and `/health` to the Go process within the container, so the client uses same-origin API requests.

## API

The API listens on `http://localhost:8080` by default. Set `CALCULATOR_API_ADDR` to use another address.

### Health check

```powershell
Invoke-RestMethod http://localhost:8080/health
```

### Available operations

```powershell
Invoke-RestMethod http://localhost:8080/api/v1/operations
```

### Calculate

```powershell
$body = @{
  operation = "power"
  operands = @(2, 8)
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:8080/api/v1/calculate `
  -ContentType "application/json" `
  -Body $body
```

Supported operations are `add`, `subtract`, `multiply`, `divide`, `power`, `sqrt`, and `percentage`. `percentage` converts one input to its decimal equivalent: `25` becomes `0.25`.

Errors use a consistent JSON shape:

```json
{
  "error": {
    "code": "DIVISION_BY_ZERO",
    "message": "Cannot divide by zero."
  }
}
```

Invalid JSON returns `400`; mathematically invalid requests return `422`.

### Evaluate an expression

```powershell
$body = @{
  operands = @(1, 2, 3)
  operations = @("add", "multiply")
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:8080/api/v1/evaluate `
  -ContentType "application/json" `
  -Body $body
```

`POST /api/v1/evaluate` accepts two to sixteen operands and one binary operation between each pair. Multiplication and division bind tighter than addition and subtraction, so `1 + 2 × 3` is `7`. Exponentiation is right-associative.

## Tests, coverage, and quality checks

Frontend:

```powershell
Set-Location .\frontend
npm run test
npm run test:coverage
npm run build
npm run lint
```

Backend:

```powershell
Set-Location .\backend
go test ./...
go test -cover ./...
go vet ./...
```

## Design decisions

- **Contract-first API:** `GET /api/v1/operations` is the source of operation labels and arity, preventing the client from duplicating calculation rules. `POST /api/v1/calculate` uses a stable, versioned request and response contract.
- **Pure calculation domain:** Calculation rules reside in `backend/internal/calculator`; HTTP handlers only parse, validate, and serialize. This makes edge cases fast to unit test.
- **Boundary validation:** The API rejects malformed JSON, unknown fields, invalid operation arity, non-finite values, division by zero, negative square roots, and non-finite results.
- **Minimal dependencies:** Go uses the standard library. React uses Vite, Vitest, and Testing Library. No state-management library is warranted for a single form.
- **Accessible, responsive UI:** Native form controls have visible labels and focus states; results use `aria-live`, errors use `role="alert"`, and the layout reduces to one column on small screens.
- **Numeric model:** The API uses IEEE 754 `float64`, appropriate for a general arithmetic demo. It is not suitable for currency or other domains that require exact decimal arithmetic.
- **Single Docker image:** Multi-stage builds compile Go and React independently, then Nginx serves the static UI and reverse-proxies API calls to the Go process on the container loopback interface.

## Prompts used

These are the prompts used during the assignment, in chronological order, with a short summary of what each produced. Cursor-generated follow-up messages (plan execution, subagent completion) are omitted. Spanish prompts include a corrected Spanish version and an English translation.

### 1. Assignment brief

The original prompt was already in English.

> Build a full-stack calculator application with a React frontend and a backend microservice. The frontend should consume the backend API to perform basic and advanced arithmetic operations. Focus on clean design, maintainable code, and testable architecture.
>
> Requirements: addition, subtraction, multiplication, division, plus optional exponentiation, square root, and percentage. React UI with validation, error handling, and basic mobile support. REST API with JSON results and edge-case handling. Unit tests for both layers. README with setup, API usage, and design rationale. Optional Dockerfile. Prefer TypeScript on the frontend and Go on the backend. Share any prompts used.

**Output:** Architecture plan for an empty workspace: React + TypeScript (Vite) client, Go `net/http` microservice, versioned `GET /api/v1/operations` and `POST /api/v1/calculate` contract, plus `GET /health`. Local Git only; no remote publish.

### 2. Agent skills

- **Spanish:** Investiga skills útiles en la web e impórtalas para un trabajo más sólido.
- **English:** Research useful skills on the web and import them for a more solid result.

**Output:** Imported four focused skills from `addyosmani/agent-skills` into `.agents/skills/`: `api-and-interface-design`, `frontend-ui-engineering`, `test-driven-development`, and `code-review-and-quality`. The full skill pack was skipped to avoid unrelated workflows.

### 3. Implement the plan

Cursor executed the accepted plan. The prompt was already in English.

> Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.
>
> To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

**Output:** Scaffolded `frontend/` and `backend/`. Go domain package with table tests; HTTP handlers for health, operations catalog, and calculate. React form client driven by the operations catalog. README, coverage, lint, and build verified. Frontend: 6 tests, ~83% statement coverage. Backend: `go test ./...` and `go vet ./...`, ~75% coverage.

### 4. Docker

- **Spanish:** Ahora crea el Dockerfile para poder correr ambos servicios a la vez sin problemas.
- **English:** Now create the Dockerfile so both services can run at the same time without issues.

**Output:** Multi-stage `Dockerfile` that compiles Go and React, then runs Nginx + the API in one container. Nginx reverse-proxies `/api/*` and `/health`. `dumb-init` handles clean shutdown. README Docker section added. Verified with `docker build` / `docker run`: `/health` returned OK and the container exited 0.

### 5. iOS calculator redesign

- **Spanish:** Rediseña la calculadora con el formato de la calculadora de iOS y que analice la expresión hecha, conserva las operaciones disponibles y agrega un historial de cálculo.
- **English:** Redesign the calculator using the iOS calculator layout, analyze the expression that was entered, keep the available operations, and add a calculation history.

**Output:** Replaced the form with an iOS-style keypad. A client-side engine builds and analyzes the expression, then still sends `{ operation, operands }` to the Go API. History panel with recall and `localStorage` persistence. Operator chaining matches iOS behavior. Frontend suite grew to 26 passing tests.

### 6. History sheet and theme toggle

- **Spanish:** Reemplaza el historial fijo por un bottom sheet y agrega un botón de toggle para modo claro y modo oscuro. Estos 2 botones deben usar el espacio restante de 2 botones que queda.
- **English:** Replace the fixed history panel with a bottom sheet and add a light/dark mode toggle. These 2 buttons should use the remaining space of 2 leftover buttons.

**Output:** History moved into a bottom sheet (Done, backdrop, Escape, or recalling a result closes it). The two empty keypad slots became History and light/dark theme. Theme is stored in `localStorage` as `data-theme`. Tests cover the sheet and theme toggle.

### 7. Extended expressions

- **Spanish:** Necesito poder hacer expresiones extendidas, no solo en pares.
- **English:** I need to be able to enter extended expressions, not only pairs.

**Output:** Keypad chains binary operators until `=`. Additive `POST /api/v1/evaluate` evaluates the full operand/operation lists with precedence. Unary operations still use `POST /api/v1/calculate`. Pair-only `calculate` remains unchanged.

## Repository publication

Git is initialized locally. Create an empty remote repository, then publish it:

```powershell
git add .
git commit -m "Build full-stack calculator"
git branch -M main
git remote add origin <your-repository-url>
git push -u origin main
```
