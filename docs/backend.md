# Backend

Go module: `github.com/example/sezzle-calc/backend` (`go 1.22` in `go.mod`; the Docker builder image is `golang:1.27-alpine`). The HTTP server uses the standard library only.

## Packages

| Path | Role |
| --- | --- |
| `cmd/server` | Process entry: listen address and `ListenAndServe` |
| `internal/api` | HTTP routing, JSON, CORS, status mapping |
| `internal/calculator` | Operation catalog and arithmetic |

Handlers parse and serialize. They do not contain formulas. `calculator.Calculate` and `calculator.Evaluate` are pure functions and are the units under test for math and domain errors.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `CALCULATOR_API_ADDR` | `:8080` | `http.Server.Addr` |

No database, secrets, or config file.

## Run

From the repository root, PowerShell:

```powershell
Set-Location .\backend
go run .\cmd\server
```

Quality checks:

```powershell
go test ./...
go test -cover ./...
go vet ./...
```

## Adding an operation

1. Add a constant and a `Definition` in `internal/calculator/calculator.go`.
2. Handle it in the `Calculate` switch, including new edge cases.
3. Extend table tests in `calculator_test.go` and HTTP cases in `handler_test.go` if the wire contract changes.
4. The keypad in the frontend already renders unknown catalog entries in the last row (`keypad.ts`). Prefer adding `id`s the keypad already knows (`add`, `subtract`, `multiply`, `divide`, `percentage`, `sqrt`, `power`) so layout stays iOS-like.
