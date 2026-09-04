# Design decisions

## Contract-first catalog

`GET /api/v1/operations` is the source of labels and arity. The client must not invent operations the API cannot execute. `POST /api/v1/calculate` stays a single-operation command. Multi-step keypad input uses an additive `POST /api/v1/evaluate` contract: `{ operands, operations }` → `{ operands, operations, result }`. That extends the API without breaking the original calculate consumers.

## Pure domain in Go

Formulas live in `internal/calculator`. HTTP code only decodes JSON, maps errors to status codes, and encodes JSON. Edge cases (zero divisor, negative square root, non-finite values) are tested without a network.

## Client analyzes, server computes

The iOS keypad needs a local state machine (digits, pending operator, chaining). Analysis (`1 + 2 × 3` → operands `[1, 2, 3]` and operations `add`, `multiply`) is a frontend concern so the display can show a readable expression. The API still performs the arithmetic, including operator precedence, so results stay consistent with tests on the Go side.

## Layered calculator feature

The React calculator is one feature with four folders: `domain` (pure engine, expression, history), `api` (fetch + in-memory monitor), `hooks` (orchestration), `ui` (presentation). Domain must not import the HTTP client. Catalog types live in `domain/types.ts`. `App` consumes only `features/calculator` public exports.

## Minimal dependencies

Go: standard library. React: Vite, Vitest, Testing Library. No Redux, no router, no ORM.

## Accessibility over chrome

Visible focus rings, named buttons, live display, alert errors, dialog history, dialog JSON. Visual style follows iOS calculator conventions (circular keys, orange operators, wide zero).

## Client-only history, theme, and API snapshots

History is a UX feature, not a multi-user store. `localStorage` avoids backend scope creep for an assignment of a few hours. API endpoint status is also client-only: the HTTP client records the last call in memory so reviewers can see catalog, calculate, and evaluate traffic without a tracing backend. `GET /health` is listed because it is part of the public surface (Docker health check); the SPA does not poll it.

## Desktop vs mobile chrome

Desktop keeps history (and API status) visible beside the keypad so the sheet overlay is unnecessary. Mobile keeps the iOS sheet and collapses API status so the keypad stays primary.

## Single Docker image

Optional in the brief. One process group is simpler to run than two published ports. Nginx + loopback API matches how a small static+API demo is usually shipped.

## Explicit non-goals

- Auth, rate limits, TLS termination in-app
- Exact decimal / money arithmetic
- Parentheses or a free-form expression string parser
- Server-side history or request logs
- SPA polling of `/health`
- Kubernetes / Compose / cloud deploy docs
