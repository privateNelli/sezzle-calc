# Full-stack calculator

A small calculator application with a React + TypeScript client and a Go REST API. The client obtains available operations from the API, sends calculations to it, and displays accessible loading, validation, and error states.

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

- “Build a full-stack calculator application with a React frontend and a backend microservice. The frontend should consume the backend API to perform basic and advanced arithmetic operations. Focus on clean design, maintainable code, and testable architecture.”
- “investiga skills utiles en la web e importalas para un trabajo más solido”
- “Implement the plan as specified, it is attached for your reference.”

## Repository publication

Git is initialized locally. Create an empty remote repository, then publish it:

```powershell
git add .
git commit -m "Build full-stack calculator"
git branch -M main
git remote add origin <your-repository-url>
git push -u origin main
```
