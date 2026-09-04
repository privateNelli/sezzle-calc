# API

Base URL in local development: `http://localhost:8080`. Override the listen address with `CALCULATOR_API_ADDR` (for example `:9090`).

All JSON responses use `Content-Type: application/json; charset=utf-8`. Request bodies are limited to 1 MiB. Unknown JSON fields and extra JSON values in the body are rejected.

There is no authentication. Treat the API as a local demo service.

The React app lists these same routes in the API status module. It records live traffic for `health`, `operations`, `calculate`, and `evaluate`. `GET /health` is probed once when the SPA mounts. Docker `HEALTHCHECK` still hits the same path through Nginx.

## Endpoints

### `GET /health`

Liveness probe. Used by Docker `HEALTHCHECK` through Nginx.

**Response `200`**

```json
{ "status": "ok" }
```

### `GET /api/v1/operations`

Catalog of operations the UI must render. The client uses `id`, `arity`, `label`, and `symbol` instead of hard-coding the set.

**Response `200`**

```json
{
  "operations": [
    { "id": "add", "label": "Addition", "arity": 2, "symbol": "+" }
  ]
}
```

The list is sorted by `id`. Current operations:

| `id` | Arity | Meaning |
| --- | --- | --- |
| `add` | 2 | Sum |
| `subtract` | 2 | Difference |
| `multiply` | 2 | Product |
| `divide` | 2 | Quotient; divisor `0` is an error |
| `power` | 2 | `math.Pow(base, exponent)` |
| `sqrt` | 1 | Square root; negative input is an error |
| `percentage` | 1 | `value / 100` (`25` → `0.25`) |

### `POST /api/v1/calculate`

Performs one operation.

**Request**

```json
{
  "operation": "power",
  "operands": [2, 8]
}
```

**Response `200`**

```json
{
  "operation": "power",
  "operands": [2, 8],
  "result": 256
}
```

PowerShell:

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

### `POST /api/v1/evaluate`

Evaluates a binary expression of two or more operands. Multiplication and division bind tighter than addition and subtraction. Exponentiation is right-associative. The expression is limited to 16 operands.

**Request**

```json
{
  "operands": [1, 2, 3],
  "operations": ["add", "multiply"]
}
```

**Response `200`**

```json
{
  "operands": [1, 2, 3],
  "operations": ["add", "multiply"],
  "result": 7
}
```

PowerShell:

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

## Errors

Every error body uses the same shape:

```json
{
  "error": {
    "code": "DIVISION_BY_ZERO",
    "message": "Cannot divide by zero."
  }
}
```

| HTTP | Code | When |
| --- | --- | --- |
| `400` | `INVALID_JSON` | Body is not a single valid JSON object, or contains unknown fields |
| `422` | `UNKNOWN_OPERATION` | `operation` is not in the catalog |
| `422` | `INVALID_ARITY` | Operand count does not match the operation |
| `422` | `INVALID_EXPRESSION` | Operand/operation counts do not form a valid binary chain, a unary operation appears in the chain, or the expression exceeds 16 operands |
| `422` | `DIVISION_BY_ZERO` | Division with a zero divisor |
| `422` | `NEGATIVE_SQUARE_ROOT` | Square root of a negative number |
| `422` | `NON_FINITE_NUMBER` | An operand is NaN or Inf |
| `422` | `NON_FINITE_RESULT` | The result is NaN or Inf (for example overflow from `power`) |
| `500` | `INTERNAL_ERROR` | Unexpected failure (should not occur for domain errors) |

## CORS

The handler allows:

- Origin: `http://localhost:5173`
- Methods: `GET`, `POST`, `OPTIONS`
- Headers: `Content-Type`

Docker does not need CORS for the UI: the browser talks to the same origin as Nginx.

Unhandled paths fall through Go's default mux behavior (typically `404`).
