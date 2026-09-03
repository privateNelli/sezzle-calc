# Testing

Tests sit next to the code they specify. Prefer failing tests first when changing behavior.

## Backend

`go test` table tests in:

- `internal/calculator/calculator_test.go` — happy paths and domain rejections
- `internal/api/handler_test.go` — health, catalog, calculate, structured errors

```powershell
Set-Location .\backend
go test ./...
go test -cover ./...
go vet ./...
```

## Frontend

Vitest + Testing Library + jsdom (`frontend/vite.config.ts`, `src/test/setup.ts`).

| File | Focus |
| --- | --- |
| `api.test.ts` | Fetch client and `CalculatorApiError` |
| `expression.test.ts` | Analysis strings and arity checks |
| `history.test.ts` | Cap, serialize, ignore junk JSON |
| `calculator-engine.test.ts` | Keypad state machine |
| `Calculator.test.tsx` | UI: calculate, history sheet, theme, persistence |

```powershell
Set-Location .\frontend
npm run test
npm run test:coverage
npm run lint
npm run build
```

`npm run build` includes `tsc -b`. There is no Playwright suite; browser verification is manual against Vite or the Docker image.

## What is intentionally untested

- Pixel-perfect iOS visuals
- Nginx / `entrypoint.sh` as automated tests (verified when the image was added)
- Cross-browser matrix
