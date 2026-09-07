# RDX Chat API — frontend contract (FastAPI)

Implement this exactly. Extra **optional** fields are OK. Renaming, nesting, or wrapping existing fields is not.

This file is the source of truth for the chatbot widget and dashboard client. It matches `@rdx/chat-contract` in the frontend monorepo.

When you are ready, send back:

1. FastAPI OpenAPI (`/docs`) or `openapi.json`
2. Staging base URL + CORS origins we should allow
3. Any extra fields you added (must be additive / optional)
4. Updated API markdown if anything changed

Frontend will point `VITE_CHAT_API_URL` / `VITE_API_BASE_URL` at your service. We will not change field names to match a new format.

---

## Transport

| Item | Value |
| --- | --- |
| Protocol | HTTPS (HTTP is OK for local) |
| Content-Type | `application/json; charset=utf-8` |
| Accept | `application/json` |
| CORS | Allow chatbot + dashboard origins. Methods: `GET`, `POST`, `OPTIONS`. Headers: `Content-Type`, `Accept` |
| Auth (phase 1) | None. Add later as optional headers; do not require them yet |

Local frontend defaults:

- Chatbot: `VITE_CHAT_API_URL=http://127.0.0.1:8001`
- Dashboard: `VITE_API_BASE_URL=http://127.0.0.1:8001`

Base URL = origin only (no trailing slash, no `/v1` suffix). The client appends paths as `/health` and `/v1/chat`.

Suggested local CORS origins:

```
http://localhost:5173
http://localhost:5174
http://127.0.0.1:5173
http://127.0.0.1:5174
```

---

## `GET /health`

**200**

```json
{ "ok": true, "service": "rdx-fastapi" }
```

`service` may be any non-empty string.

---

## `POST /v1/chat`

The widget sends **only** `{ "message": "<user text>" }`.
The server owns conversation history (session / cookie / id later is fine).

### Request

```json
{
  "message": "Do you have size M?",
  "messages": [
    { "role": "user", "content": "legacy fallback — ignore unless message is missing" }
  ],
  "region": "US"
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `message` | preferred | Non-empty string after trim |
| `messages` | legacy | Use the last item with `role: "user"` and non-empty `content` only if `message` is missing |
| `region` | optional | Ignore if unused |

`messages[]` items:

```json
{ "role": "user", "content": "text" }
```

`role` is `"user"` or `"assistant"`.

Empty body / no usable user text → **400**:

```json
{ "error": "Message is required." }
```

Invalid JSON → **400**:

```json
{ "error": "Invalid JSON body." }
```

### Success — **200**

```json
{
  "reply": "Thanks for your message...",
  "requestId": "optional-uuid",
  "attachments": [
    {
      "kind": "size_chart",
      "productId": "gid://shopify/Product/123",
      "productTitle": "RDX Boxing Gloves",
      "url": "https://your-store.myshopify.com/cdn/shop/files/size-chart.jpg",
      "altText": "Size chart for RDX Boxing Gloves",
      "width": 800,
      "height": 600
    }
  ]
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `reply` | **yes** | Non-empty string. Markdown is OK (`**bold**`). An empty / whitespace-only `reply` is treated as a client error |
| `requestId` | optional | Correlation id |
| `attachments` | optional | Omit or `[]` if none. **Server-verified only** — never model-authored URLs |

### Attachment object

Only `kind: "size_chart"` is rendered today. Unknown kinds are ignored.

| Field | Type | Required |
| --- | --- | --- |
| `kind` | `"size_chart"` | yes |
| `productId` | string | yes |
| `productTitle` | string | yes |
| `url` | HTTPS URL | yes |
| `altText` | string | yes |
| `width` | number or `null` | yes (`null` is OK) |
| `height` | number or `null` | yes (`null` is OK) |

Frontend will **not render** an attachment if:

- `kind` is not `"size_chart"`
- `url` is not `http:` / `https:`
- `url` host is `cdn.shopify.com` (blocked)
- `url` is not on the storefront host, `*.myshopify.com`, or a known carrier/tracking host

Prefer `*.myshopify.com` or the public storefront host for size-chart images. Do not send raw `cdn.shopify.com` URLs.

### Errors

Always return this shape (top-level `error` string):

```json
{ "error": "Human-readable message." }
```

| Status | When |
| --- | --- |
| 400 | Validation, empty message, or bad JSON |
| 404 | Unknown path: `{ "error": "Not found." }` |
| 500 | Unexpected: `{ "error": "..." }` |

Do **not** wrap responses like:

```json
{ "data": { "reply": "..." } }
```

```json
{ "success": true, "message": "..." }
```

The client reads `payload.reply` and `payload.error` at the **top level**.

---

## What the frontend does not send or expect yet

- No `conversationId` / `sessionId` (add as **optional** later)
- No streaming / SSE
- No auth header
- Menu buttons (`M`, quick options) are **UI-only**, not an API field
- Dashboard Conversations page is a placeholder — no list/history endpoint yet

---

## Phase 2 (optional, additive only)

If you add these, keep them optional so the current widget still works:

```json
{
  "message": "hello",
  "conversationId": "optional-uuid",
  "sessionId": "optional-uuid"
}
```

New attachment `kind` values (product cards, images, etc.) need a frontend change first. Until then, only `size_chart`.

---

## Product types (later catalog endpoints — not called yet)

Do not ship catalog routes until we agree paths (for example `GET /v1/products`).

```ts
ProductSummary {
  id: string
  title: string
  status: string
  handle: string
  url: string | null
  description: string
  productType: string
  vendor: string
  tags: string[]
  priceRange: { min: string, max: string, currency: string }
  onSale: boolean
  totalInventory: number | null
  variants: ProductVariant[]
}

ProductVariant {
  id: string
  title: string
  price: string
  compareAtPrice: string | null
  availableForSale: boolean
  inventoryQuantity: number | null
}
```

---

## Curl smoke test we will run

```bash
curl -s http://127.0.0.1:8001/health

curl -s -X POST http://127.0.0.1:8001/v1/chat \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"Do you have size M?\"}"
```

Expected: JSON with a non-empty top-level `reply` string.
