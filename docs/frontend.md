# Frontend

Vite + React 19 + TypeScript. UI code lives under `frontend/src/features/calculator/`.

`App` loads the operation catalog on mount. If the API is down, it shows an alert and does not render the keypad.

## Modules

| File | Responsibility |
| --- | --- |
| `api.ts` | `getOperations` / `calculate`; maps HTTP errors to `CalculatorApiError` |
| `calculator-engine.ts` | Digit entry, AC/C, chaining, unary vs binary, equals repeat |
| `expression.ts` | Turns a draft into `{ operation, operands, expression, analysis }` |
| `use-calculator.ts` | Engine + API calls + history persistence |
| `keypad.ts` | iOS-style rows from the catalog |
| `Calculator.tsx` | Shell, keyboard shortcuts, history sheet |
| `CalculatorPad.tsx` | Keys plus History and theme in leftover slots |
| `HistorySheet.tsx` | Modal bottom sheet |
| `history.ts` | Cap 50 entries; ignore corrupt `localStorage` |
| `use-theme.ts` | `data-theme` on `<html>`; persist light/dark |
| `format.ts` | Display formatting for results |

## Request flow

1. User completes an expression (`=` or a unary key such as `√` / `%`).
2. The engine emits a `calculate` effect with an analyzed payload.
3. `use-calculator` POSTs `{ operation, operands }` to the API.
4. On success, the display updates. Completed calculations (not intermediate chain steps) append to history.

Chaining (`2 + 3 ×`) evaluates the pending binary operation first, does **not** write that intermediate result to history, then queues the next operator — similar to iOS.

## Persistence

| Key | Contents |
| --- | --- |
| `sezzle-calculator-history` | JSON array of history entries |
| `sezzle-calculator-theme` | `light` or `dark` (anything else is treated as dark) |

## Accessibility

- Key `aria-label`s use operation labels from the API (`Addition`, `Division`, …).
- Display uses `aria-live="polite"`.
- API and calculation errors use `role="alert"`.
- History sheet is `role="dialog"` with backdrop, Done, and Escape.
- Theme and history controls fill the unused last-row keypad cells.

## Environment

`VITE_API_BASE_URL` defaults to `http://localhost:8080` when unset. Docker builds it as an empty string so fetches are same-origin (`/api/v1/...`).

Copy `frontend/.env.example` to `frontend/.env` for local Vite.

## Scripts

```powershell
Set-Location .\frontend
npm install
npm run dev
npm run test
npm run lint
npm run build
```
