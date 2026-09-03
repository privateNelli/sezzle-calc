# Design decisions

## Contract-first catalog

`GET /api/v1/operations` is the source of labels and arity. The client must not invent operations the API cannot execute. `POST /api/v1/calculate` stays a single versioned command: `{ operation, operands }` → `{ operation, operands, result }`.

## Pure domain in Go

Formulas live in `internal/calculator`. HTTP code only decodes JSON, maps errors to status codes, and encodes JSON. Edge cases (zero divisor, negative square root, non-finite values) are tested without a network.

## Client analyzes, server computes

The iOS keypad needs a local state machine (digits, pending operator, chaining). Analysis (`2 + 3` → addition of 2 and 3) is a frontend concern so the display can show a readable expression. The API still performs the arithmetic so results stay consistent with tests on the Go side.

## Minimal dependencies

Go: standard library. React: Vite, Vitest, Testing Library. No Redux, no router, no ORM.

## Accessibility over chrome

Visible focus rings, named buttons, live display, alert errors, dialog history. Visual style follows iOS calculator conventions (circular keys, orange operators, wide zero).

## Client-only history and theme

History is a UX feature, not a multi-user store. `localStorage` avoids backend scope creep for an assignment of a few hours.

## Single Docker image

Optional in the brief. One process group is simpler to run than two published ports. Nginx + loopback API matches how a small static+API demo is usually shipped.

## Explicit non-goals

- Auth, rate limits, TLS termination in-app
- Exact decimal / money arithmetic
- Multi-step expression AST sent to the server (`1 + 2 * 3` as one payload)
- Server-side history
- Kubernetes / Compose / cloud deploy docs
