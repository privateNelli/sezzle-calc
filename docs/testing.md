# Testing

Tests sit next to the code they specify. Prefer failing tests first when changing behavior.

## Backend

`go test` table tests in:

- `internal/calculator/calculator_test.go` — happy paths and domain rejections for single operations and multi-step expressions
- `internal/api/handler_test.go` — health, catalog, calculate, evaluate, structured errors

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
| `App.test.tsx` | Catalog loading, API-down alert, calculator mount, brand heading |
| `api/client.test.ts` | Fetch client and `CalculatorApiError` |
| `domain/expression.test.ts` | Analysis strings and arity checks |
| `domain/history.test.ts` | Cap, serialize, ignore junk JSON |
| `domain/engine.test.ts` | Keypad state machine |
| `domain/format.test.ts` | Result formatting and non-finite values |
| `domain/keypad.test.ts` | Catalog-driven pad layout |
| `hooks/use-calculator.test.ts` | API orchestration, busy lock, history |
| `hooks/use-theme.test.ts` | Theme parse and persistence |
| `hooks/use-desktop-layout.test.ts` | Desktop media query |
| `ui/Calculator.test.tsx` | UI: calculate, mobile history sheet, desktop history panel, theme, keyboard |
| `ui/CalculatorDisplay.test.tsx` | Analysis vs error vs value size |
| `ui/CalculatorHistory.test.tsx` | Empty, recall, clear |
| `ui/CalculatorPad.test.tsx` | Key dispatch and leftover utility slots |
| `ui/sheet-height.test.ts` | Bottom-sheet snap points and dismiss threshold |
| `ui/HistorySheet.test.tsx` | Drag, keyboard resize, dismiss |

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
