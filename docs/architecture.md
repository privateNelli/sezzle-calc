# Architecture

The product is a calculator with two deployable pieces:

1. A **Go REST API** that owns arithmetic and input validation.
2. A **React + TypeScript** client that owns keypad UX, expression analysis, history, and theme.

The client never implements the math. It builds either a unary `{ operation, operands }` request or a multi-step `{ operands, operations }` expression, then calls the API. Arithmetic stays in one place.

```text
Browser (Vite :5173 or Nginx :80)
  │  GET  /api/v1/operations
  │  POST /api/v1/calculate
  │  POST /api/v1/evaluate
  ▼
Go API (:8080)
  │
  ▼
internal/calculator (pure functions)
```

## Repository layout

```text
backend/          Go module and HTTP server
frontend/         Vite + React application (`src/features/calculator/{api,domain,hooks,ui}`)
docker/           Nginx config and container entrypoint
docs/             This documentation
Dockerfile        Multi-stage image for both layers
```

## Runtime modes

**Local development:** two processes. Vite serves the UI with hot reload. The API listens on `:8080` with CORS limited to `http://localhost:5173`. Set `VITE_API_BASE_URL` (see `frontend/.env.example`).

**Docker:** one container. Nginx serves `frontend/dist` on port 80 and reverse-proxies `/api/` and `/health` to the Go binary on loopback `:8080`. The frontend is built with `VITE_API_BASE_URL=""`, so the browser uses same-origin URLs.

## Data ownership

| Concern | Owner |
| --- | --- |
| Operation catalog and arity | API (`GET /api/v1/operations`) |
| Arithmetic and numeric edge cases | `backend/internal/calculator` |
| Digit entry, chaining, AC/C, equals | `frontend` `domain/engine.ts` |
| Human-readable expression and analysis | `frontend` `domain/expression.ts` |
| Unary arithmetic | `POST /api/v1/calculate` |
| Multi-step expressions and precedence | `POST /api/v1/evaluate` |
| History and theme | Browser `localStorage` |

History and theme are client-only. There is no user account or history endpoint.

## Numeric model

Results are IEEE 754 `float64` on the server and JavaScript numbers on the client. That is enough for a general calculator demo. It is not suitable for currency or exact decimal work.
