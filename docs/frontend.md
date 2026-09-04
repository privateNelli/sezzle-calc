# Frontend

Vite + React 19 + TypeScript. The calculator is a single feature with layered folders. `App` imports the public calculator surface and the desktop brand lockup.

`App` loads the operation catalog on mount. If the API is down, it shows an alert and does not render the keypad. Successful catalog loads also update the API status row for `GET /api/v1/operations`.

## Layout

```text
frontend/src/
  App.tsx
  BrandLockup.tsx         Desktop heading ("Let's do Mathematics.")
  features/calculator/
    index.ts              Public exports
    api/client.ts         HTTP client (records each call on the monitor)
    api/monitor.ts        In-memory endpoint snapshots
    domain/               Pure logic; must not import api/
    hooks/                Engine + persistence + theme + API monitor
    ui/                   Presentational components
```

Dependency direction: `ui` → `hooks` → `api` + `domain`. `domain` never imports `api` or `ui`. Catalog types (`Operation`) live in `domain/types.ts`, not in the HTTP module.

## Modules

| Path | Responsibility |
| --- | --- |
| `api/client.ts` | `getOperations` / `calculate` / `evaluate`; maps HTTP errors to `CalculatorApiError`; notifies the monitor |
| `api/monitor.ts` | Endpoint list, phases (`idle` / `calling` / `ok` / `error`), last status, JSON body, timestamp |
| `domain/types.ts` | Shared catalog type (`Operation`) |
| `domain/engine.ts` | Digit entry, AC/C, multi-step chaining, unary vs binary, equals repeat |
| `domain/expression.ts` | Turns a draft into a unary calculate payload or a chain evaluate payload |
| `domain/keypad.ts` | iOS-style rows from the catalog |
| `domain/history.ts` | Cap 50 entries; ignore corrupt `localStorage` |
| `domain/format.ts` | Display formatting for results |
| `hooks/use-calculator.ts` | Engine + API calls + history persistence |
| `hooks/use-theme.ts` | `data-theme` on `<html>`; persist light/dark |
| `hooks/use-desktop-layout.ts` | Desktop vs mobile layout query (`min-width: 48rem`) |
| `hooks/use-api-monitor.ts` | `useSyncExternalStore` over the monitor |
| `ui/Calculator.tsx` | Shell, keyboard shortcuts, desktop history + API panel, mobile sheet + accordion |
| `ui/CalculatorPad.tsx` | Keys plus History (mobile) and theme in leftover slots |
| `ui/HistorySheet.tsx` | Modal bottom sheet; drag/keyboard resize on mobile |
| `ui/sheet-height.ts` | Snap points and dismiss threshold for the sheet |
| `ui/ApiStatusPanel.tsx` | Four endpoint rows; “View JSON response” |
| `ui/ApiStatusAccordion.tsx` | Collapsed “API endpoints” control used on small screens |
| `ui/JsonResponseDialog.tsx` | Modal with pretty-printed last body |

## Request flow

1. User completes an expression (`=` or a unary key such as `√` / `%`).
2. The engine emits a `calculate` effect with an analyzed payload.
3. `use-calculator` POSTs unary work to `/api/v1/calculate` and binary chains to `/api/v1/evaluate`.
4. On success, the display updates. Completed calculations (not mid-expression unary steps) append to history.

Chaining (`1 + 2 × 3`) keeps the full expression until `=`. The API applies operator precedence (`1 + 2 × 3` → `7`). Pressing a second operator before a new number replaces the last operator.

Physical keyboard (digits, operators, Enter/`=`, Escape, Backspace) drives the same engine when the mobile history sheet is closed. Modifier keys are ignored.

## API status

The monitor lists every documented HTTP surface:

| id | Method | Path | When the SPA updates it |
| --- | --- | --- | --- |
| `health` | `GET` | `/health` | Never (row stays idle; Docker/`Invoke-RestMethod` still hit this path) |
| `operations` | `GET` | `/api/v1/operations` | Catalog load in `App` |
| `calculate` | `POST` | `/api/v1/calculate` | Unary keys (`√`, `%`) |
| `evaluate` | `POST` | `/api/v1/evaluate` | Equals on a binary chain |

Each row shows phase (`Idle`, `Calling…`, `OK 200`, `Error 422`, or `Error` with no status on network failure), last local date/time (`dd/mm/yyyy hh:mm:ss`), and a button that opens the last JSON body. Snapshots live in memory only.

Layout:

- **Desktop:** panel under history, always visible.
- **Mobile:** accordion under the keypad; expand “API endpoints” to see the same list.

## Persistence

| Key | Contents |
| --- | --- |
| `sezzle-calculator-history` | JSON array of history entries |
| `sezzle-calculator-theme` | `light` or `dark` (anything else is treated as dark) |

## Accessibility

- Key `aria-label`s use operation labels from the API (`Addition`, `Division`, …).
- Display uses `aria-live="polite"`.
- API and calculation errors use `role="alert"`.
- History sheet is `role="dialog"` with backdrop, Done, and Escape on small screens.
- JSON response viewer is `role="dialog"`; Escape and backdrop close it (Escape is captured before keypad handling).
- API rows use `aria-busy` while a call is in flight; the accordion toggle uses `aria-expanded`.
- On desktop, a left-column heading lockup sits beside the keypad; it stays visually hidden on small screens.
- On small screens the sheet handle is a vertical slider: drag or Arrow keys change height; drag past the bottom snap dismisses.
- Theme and history controls fill the unused last-row keypad cells on small screens.

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
