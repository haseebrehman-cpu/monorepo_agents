# Frontend Integration Guide — RDX Commerce Assistant

> Audience: a frontend developer integrating the chat widget or building a custom client.
> This document is the complete contract. You should not need to read the backend source.

Base URL for examples: `https://chat.rdxsports.com` (staging: `https://chat-staging.rdxsports.com`).
Local development: `http://localhost:8001`.

---

## Table of Contents

1. [Auth Flow](#1-auth-flow)
2. [Chat Endpoints](#2-chat-endpoints)
3. [ChatRequest Fields](#3-chatrequest-fields)
4. [Idempotency-Key Header](#4-idempotency-key-header)
5. [SSE Contract](#5-sse-contract)
6. [The `done` Payload](#6-the-done-payload)
7. [Citations](#7-citations)
8. [Worked Product Card Example](#8-worked-product-card-example)
9. [Errors](#9-errors)
10. [Diagnostic Mode](#10-diagnostic-mode)
11. [Conversation Continuity](#11-conversation-continuity)
12. [Multi-Store Rules](#12-multi-store-rules)
13. [Security Notes](#13-security-notes)
14. [Store Reference Table](#14-store-reference-table)
15. [Local Testing — Dev Mode](#15-local-testing--dev-mode)
16. [Curl / PowerShell Examples](#16-curl--powershell-examples)
17. [Common Mistakes](#17-common-mistakes)

---

## 1. Auth Flow

The widget session token is the only authentication mechanism. There are no API keys, no
OAuth flows, and no anonymous access in production.

### Minting a Token

```
POST /v1/session
```

This endpoint is called through the **Shopify App Proxy**. The Shopify storefront theme
includes a proxy path (e.g. `/apps/rdx-assistant/session`) which forwards to
`/v1/session` on the backend. The backend verifies the Shopify App Proxy HMAC signature
on the full query string before minting anything.

#### Required Query Parameters

| Parameter        | Type   | Description                                    |
|------------------|--------|------------------------------------------------|
| `tenant_id`      | string | The tenant's UUID from the `core_tenant` table |
| `marketplace_id` | string | The marketplace's UUID                         |

These are embedded in the App Proxy URL by the Liquid theme. Shopify signs the entire
query string with HMAC-SHA256.

Optional: `logged_in_customer_id` — Shopify's customer ID when the user is logged in. If
absent, the backend derives an anonymous ID by hashing the query string.

#### Full URL Format

```
POST /v1/session?tenant_id=<TENANT_UUID>&marketplace_id=<MARKETPLACE_UUID>&timestamp=<UNIX_TS>&signature=<HMAC_SHA256>&shop=<SHOP_DOMAIN>&logged_in_customer_id=<CUSTOMER_ID>
```

The `signature` parameter is the Shopify App Proxy HMAC-SHA256 of the full query string
(excluding `signature` itself), signed with the app's webhook secret for that shop.

#### Session Endpoint Behaviour

1. Validates that `tenant_id` and `marketplace_id` are both present and non-empty.
2. Looks up the marketplace row in `core_marketplace` matching both IDs.
3. Loads the shop's webhook secret (envelope-encrypted in the marketplace row).
4. Verifies the Shopify App Proxy signature against the full query string.
5. On success, mints a JWT carrying sealed tenant, marketplace, and anonymous-user claims.

If any step fails, the endpoint returns a `400 validation_error`.

#### Response

```json
{
  "session_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 3600,
  "locale": "en-GB"
}
```

| Field           | Type   | Description                                                      |
|-----------------|--------|------------------------------------------------------------------|
| `session_token` | string | A signed JWT (HS256). Carry it on every chat request.            |
| `expires_in`    | int    | Lifetime in seconds. Default: **3600** (1 hour).                 |
| `locale`        | string | The marketplace's locale (`en-GB`, `en-US`, `de`, etc.). Use it to set the widget language before the first message. |

#### Token Anatomy (for understanding; never decode client-side)

The JWT carries these claims:

| Claim  | Meaning                                                |
|--------|--------------------------------------------------------|
| `iss`  | `rdx-platform`                                         |
| `aud`  | `rdx-widget`                                           |
| `iat`  | Issued-at (Unix timestamp)                             |
| `exp`  | Expiry (Unix timestamp = `iat` + `expires_in`)         |
| `ten`  | Sealed tenant ID                                       |
| `mkt`  | Sealed marketplace ID                                  |
| `anon` | Anonymous user ID (from `logged_in_customer_id` or hash) |
| `org`  | Origin the token was minted for                        |

#### Carrying the Token

Every chat request must include:

```
X-Session-Token: eyJhbGciOiJIUzI1NiIs...
```

#### What Happens on Expiry

- The backend returns **HTTP 401** with `{"error": {"code": "unauthorized", "message": "Please sign in and try again."}}`.
- The widget must call `/v1/session` again through the App Proxy to get a fresh token.
- The origin sealed in the token is compared to the live `Origin` header on every request. A token lifted from one site cannot be replayed from another.

#### Critical Principle

The `tenant` and `marketplace` in the chat request body are **never trusted as
authorisation**. In production, both are resolved exclusively from the token's sealed
claims. The body fields exist only as a development/testing convenience (bypassing the
token when `is_production` is false).

#### Why You Cannot Call `/v1/session` Directly in Testing

The `/v1/session` endpoint requires a validly-signed Shopify App Proxy query string. In
local development, you do not have a Shopify storefront generating these signatures. The
dev-mode bypass on `/v1/chat` and `/v1/chat/stream` exists for this reason — see
[Section 15](#15-local-testing--dev-mode).

---

## 2. Chat Endpoints

Both endpoints run the identical pipeline: input guard → route → retrieve → generate →
output guard. The only difference is the transport.

### `POST /v1/chat` — Synchronous JSON

One request, one JSON response. Use for tests, evaluations, and simple integrations.

#### Request

```
POST /v1/chat
Content-Type: application/json
X-Session-Token: <token>
```

```json
{
  "message": "Do you have the T17 Aura Plus in 14oz?",
  "conversation_id": "conv_01J...",
  "client_message_id": "msg-abc-123"
}
```

All fields except `message` are optional. See [Section 3](#3-chatrequest-fields) for the
full field reference.

#### Response — `200 OK`

```json
{
  "conversation_id": "conv_01J...",
  "turn_id": "turn_01J...",
  "answer": "Yes! The T17 Aura Plus boxing gloves are available in 14oz...",
  "escalated": false,
  "degraded": false,
  "citations": [
    {
      "chunk_id": "chk_01J...",
      "document_id": "doc_01J...",
      "title": "T17 Aura Plus Boxing Gloves",
      "source_uri": "https://rdxsports.co.uk/products/t17-aura-plus",
      "source_version": "2026-08-30T14:22:00Z",
      "score": 0.91
    }
  ],
  "products": [
    {
      "title": "T17 Aura Plus Boxing Gloves",
      "url": "https://rdxsports.co.uk/products/t17-aura-plus",
      "handle": "t17-aura-plus",
      "price_min": "34.99",
      "price_max": "39.99",
      "compare_at_min": "44.99",
      "compare_at_max": "49.99",
      "price_currency": "GBP",
      "promotions": ["Buy 2 Save 10%"],
      "availability": "in_stock",
      "stock_status": "In Stock"
    }
  ],
  "skill": "commerce",
  "route_tier": "t2_model",
  "tokens": { "in": 1200, "out": 350 },
  "cost_usd": 0.0085,
  "diagnostic": null
}
```

| Field             | Type              | Description                                              |
|-------------------|-------------------|----------------------------------------------------------|
| `conversation_id` | string            | Pass back on the next message to continue the conversation. |
| `turn_id`         | string            | Unique ID for this turn. Used for reconnection.          |
| `answer`          | string            | The assistant's text response.                           |
| `escalated`       | bool              | `true` if the turn was handed off to a human agent.      |
| `degraded`        | bool              | `true` if the assistant could not check a live system (e.g. stock API down) and said so honestly. |
| `citations`       | array of Citation | Source references. See [Section 7](#7-citations).        |
| `products`        | array of object   | Display-ready product cards. See [Section 8](#8-worked-product-card-example). |
| `skill`           | string or null    | Which skill answered: `commerce`, `order`, `faq`, etc.   |
| `route_tier`      | string or null    | `t0_cache`, `t1_retrieval`, `t2_model`, etc.             |
| `tokens`          | object            | `{"in": <int>, "out": <int>}` — token counts.           |
| `cost_usd`        | float             | Cost of this turn in USD, rounded to 6 decimal places.   |
| `diagnostic`      | object or null    | Only present when `X-Diagnostic: 1` is sent and environment is not production. See [Section 10](#10-diagnostic-mode). |

### `POST /v1/chat/stream` — Server-Sent Events

This is what the widget uses. Tokens arrive incrementally as SSE events.

#### Request

Identical body and headers to `/v1/chat`:

```
POST /v1/chat/stream
Content-Type: application/json
X-Session-Token: <token>
```

```json
{
  "message": "Do you have the T17 Aura Plus in 14oz?",
  "conversation_id": "conv_01J...",
  "client_message_id": "msg-abc-123"
}
```

#### Response — `200 OK`, `Content-Type: text/event-stream`

The response is an SSE stream. Each event has an `event:` type and a `data:` payload
(JSON string). See [Section 5](#5-sse-contract) for the full event contract.

### `GET /v1/conversations/{conversation_id}/turns/{turn_id}` — Resume

Resume a turn after a dropped SSE connection. See [Section 11](#11-conversation-continuity).

#### Request

```
GET /v1/conversations/{conversation_id}/turns/{turn_id}
X-Session-Token: <token>
```

Both `conversation_id` and `turn_id` are path parameters (from the SSE `meta` event).

#### Response — `200 OK`

```json
{
  "turn_id": "turn_01J...",
  "status": "complete",
  "answer": "The T17 Aura Plus boxing gloves are available in...",
  "escalated": false,
  "degraded": false,
  "last_sequence_delivered": 42
}
```

| Field                    | Type   | Description                                         |
|--------------------------|--------|-----------------------------------------------------|
| `turn_id`                | string | The turn's ID.                                      |
| `status`                 | string | `"complete"`, `"escalated"`, or `"pending"` if still generating. |
| `answer`                 | string | The full answer text. Empty if still pending.        |
| `escalated`              | bool   | Whether the turn was escalated.                     |
| `degraded`               | bool   | Whether the turn was degraded.                      |
| `last_sequence_delivered`| int    | Monotonic sequence number for partial resume.       |

#### Error Cases

| Status | Code               | When                                           |
|--------|--------------------|-------------------------------------------------|
| 400    | `validation_error` | `turn_id` does not belong to `conversation_id`. |
| 401    | `unauthorized`     | Missing or invalid session token.               |

---

## 3. ChatRequest Fields

| Field               | Type           | Required | Max Length | Description |
|---------------------|----------------|----------|------------|-------------|
| `message`           | string         | **Yes**  | 4000 chars | The customer's message. Must be at least 1 character. |
| `conversation_id`   | string or null | No       | —          | Pass back the ID from a previous response to continue the same conversation. Omit to start a new conversation. |
| `tenant`            | string or null | No       | —          | Tenant slug (e.g. `rdx`). **Development only.** In production, resolved from the token. Never trusted as an ID. |
| `marketplace`       | string or null | No       | —          | Marketplace code (e.g. `uk`, `uae`, `ca`). **Development only.** In production, resolved from the token. |
| `session_id`        | string or null | No       | —          | Client-supplied session ID. Used as the principal ID when no token is present (development only). Falls back to `"anon"`. |
| `client_message_id` | string or null | No       | 128 chars  | **The deduplication key.** A stable identifier for *this logical message*. |

### Why `client_message_id` Matters

This is the single most important field for frontend developers to understand.

When you send a message and the network times out, you retry. The backend uses
`client_message_id` to recognise that this is the **same logical message** and returns the
original answer instead of running the pipeline again.

**Rules:**

1. Generate `client_message_id` **once** when the user presses Send.
2. If you retry (timeout, network error), send the **same** `client_message_id`.
3. **Never** regenerate it on retry. If you do, the backend treats the retry as a new
   message and the customer sees a duplicate answer.
4. When the user sends a genuinely new message, generate a new `client_message_id`.

A UUID v4 or `${timestamp}-${random}` are both fine formats. The field is opaque to the
backend — it only checks equality.

---

## 4. Idempotency-Key Header

```
Idempotency-Key: <unique-string>
```

Optional header on both `/v1/chat` and `/v1/chat/stream`. Works the same way as
`client_message_id` but at the HTTP transport level:

- If present, the backend uses it as the turn's deduplication key (overriding
  `client_message_id`).
- Re-sending the same `Idempotency-Key` with the same message returns the original answer
  without re-running the pipeline.
- Sending the same key with a **different** message body is a conflict: the backend may
  return the original result (the key won, not the body).

**When to use it:** If your client already has an idempotency layer (e.g. a retry
middleware), set this header. If you are relying on `client_message_id`, you do not need
this header — they serve the same purpose.

The priority order is: `Idempotency-Key` header > `client_message_id` body field > auto-
generated turn ID (no deduplication).

---

## 5. SSE Contract

Events arrive in this order on a successful turn. Each line in the stream follows the SSE
spec: `event: <type>\ndata: <json>\n\n`.

### Event: `status`

Emitted immediately. Tells the UI to show a thinking indicator. This is what makes a
1.7-second answer feel immediate — the customer sees feedback within a few hundred
milliseconds.

```
event: status
data: {"state": "thinking"}
```

### Event: `meta`

Emitted once the turn is claimed. Contains the conversation and turn IDs.

```
event: meta
data: {"conversation_id": "conv_01J...", "turn_id": "turn_01J...", "skill": null}
```

Save `conversation_id` — you need it for the next message. Save `turn_id` — you need it
for reconnection.

### Event: `delta`

One per token (or small chunk). Append `text` to the displayed answer.

```
event: delta
data: {"text": "The T17 Aura Plus "}

event: delta
data: {"text": "boxing gloves are "}

event: delta
data: {"text": "available in 14oz."}
```

Build the answer by concatenating: `displayed += delta.text`.

### **Event: `replace`** — CRITICAL

**A `replace` event means the output guardrail rewrote the streamed answer. The client
MUST replace the entire displayed text, not append.**

```
event: replace
data: {"text": "The T17 Aura Plus boxing gloves are available in 14oz for £34.99."}
```

The `text` field contains the **complete** corrected answer. On receiving this event:

1. **Set** the displayed text to `replace.text` (do not append).
2. Reset your accumulated content buffer to `replace.text`.
3. Continue accepting `delta` events after it (there may be more tokens).

**If you append instead of replacing, the customer sees the wrong answer followed by the
right answer.** This is the second most common integration bug.

### Event: `done`

Emitted once at the end. Contains final metadata. See [Section 6](#6-the-done-payload).

```
event: done
data: {
  "escalated": false,
  "degraded": false,
  "citations": [...],
  "products": [...],
  "cost_usd": 0.0085,
  "skill": "commerce"
}
```

### Event: `error`

Emitted if the pipeline fails after the stream has started. The message is
customer-safe.

```
event: error
data: {"message": "Something went wrong on my side. Would you like a person instead?"}
```

The `message` field is always a `public_message` — safe to display directly. Internal
details are never included.

### Complete Event Sequence

```
event: status        ← show spinner / "Thinking…"
data: {"state": "thinking"}

event: meta          ← save conversation_id, turn_id
data: {"conversation_id": "...", "turn_id": "...", "skill": null}

event: delta         ← append token by token
data: {"text": "The "}

event: delta
data: {"text": "T17 Aura Plus..."}

event: replace       ← (only if guardrail rewrites) — REPLACE, don't append
data: {"text": "Full corrected answer..."}

event: done          ← render cards, show citations
data: {"escalated": false, "degraded": false, "citations": [...], ...}
```

---

## 6. The `done` Payload

The `done` event is the last event on a successful stream. Its payload contains:

| Field       | Type              | Description |
|-------------|-------------------|-------------|
| `citations` | array of Citation | Source references for the answer. See [Section 7](#7-citations). |
| `products`  | array of object   | Display-ready product cards (max 8). See [Section 8](#8-worked-product-card-example). |
| `escalated` | bool              | `true` if the assistant escalated to a human agent. Show the customer that a person is taking over. |
| `degraded`  | bool              | `true` if a live data source was unreachable (e.g. stock API down). The answer will say what it could not check. The UI may show a subtle "some information may be outdated" notice. |
| `cost_usd`  | float             | Cost of this turn. For internal dashboards only — do not display to customers. |
| `skill`     | string or null    | Which skill answered: `commerce`, `order`, `faq`, `greeting`, etc. Useful for analytics. |

---

## 7. Citations

The Citation model represents a traceable reference back to an approved source document.

| Field            | Type         | Description |
|------------------|--------------|-------------|
| `chunk_id`       | string       | Unique ID of the retrieved text chunk.                    |
| `document_id`    | string       | ID of the parent document the chunk belongs to.           |
| `title`          | string       | Human-readable title of the source document or product.   |
| `source_uri`     | string, null | URL of the source (e.g. the product page). May be `null` for internal-only documents. |
| `source_version` | string       | Timestamp or version hash of the document at retrieval time. This is what makes the citation traceable — the document may have changed since the answer was given. |
| `score`          | float        | Relevance score (0.0–1.0). Higher means more relevant.    |

Citations appear in both the `/v1/chat` JSON response (top-level `citations` field) and
in the SSE `done` event payload.

---

## 8. Worked Product Card Example

Product cards are returned in the `products` array (both JSON and SSE `done`). They are
built from `search_products` tool results, deduplicated by `handle`, capped at 8 cards.

### Example: UK Product

```json
{
  "products": [
    {
      "title": "RDX T17 Aura Plus Boxing Gloves",
      "url": "https://rdxsports.co.uk/products/t17-aura-plus-boxing-gloves",
      "handle": "t17-aura-plus-boxing-gloves",
      "price_min": "34.99",
      "price_max": "39.99",
      "compare_at_min": "44.99",
      "compare_at_max": "49.99",
      "price_currency": "GBP",
      "promotions": ["Buy 2 Save 10%"],
      "availability": "in_stock",
      "stock_status": "In Stock"
    }
  ]
}
```

### Product Card Fields

| Field            | Type              | Description |
|------------------|-------------------|-------------|
| `title`          | string            | Product title. Use as the card heading.                    |
| `url`            | string            | Full URL to the product page on the correct storefront. **Validate before making it an href** — see [Section 13](#13-security-notes). |
| `handle`         | string            | Shopify product handle. Used for deduplication.            |
| `price_min`      | string or null    | Lowest variant price. Display as the current price.        |
| `price_max`      | string or null    | Highest variant price. Show a range if `price_min !== price_max`. |
| `compare_at_min` | string or null    | Original/compare-at price (lowest). When `compare_at_min > price_min`, show as a struck-through "was" price. |
| `compare_at_max` | string or null    | Original/compare-at price (highest).                       |
| `price_currency` | string            | ISO currency code: `GBP`, `USD`, `CAD`, `EUR`, `AED`.     |
| `promotions`     | array or null     | Active promotion labels. Show the first one on the card.   |
| `availability`   | string            | `"in_stock"`, `"out_of_stock"`, or `"unknown"`.            |
| `stock_status`   | string            | Human-readable stock status, e.g. `"In Stock"`, `"Low Stock"`, `"Out of Stock"`. |

### Rendering a Card

```
┌──────────────────────────┐
│ RDX T17 Aura Plus        │  ← title (textContent, never innerHTML)
│ Boxing Gloves             │
│                          │
│ £34.99  ̶£̶4̶4̶.̶9̶9̶           │  ← price_min + struck compare_at_min
│ In Stock                 │  ← stock_status
│ Buy 2 Save 10%           │  ← promotions[0]
│                          │
│ View Product →           │  ← link to url (only if URL passes validation)
└──────────────────────────┘
```

**Show a "was" price** when `compare_at_min` is present and
`parseFloat(compare_at_min) > parseFloat(price_min)`.

**Currency symbols:**

| Code | Symbol |
|------|--------|
| GBP  | £      |
| USD  | $      |
| CAD  | CA$    |
| EUR  | €      |
| AED  | AED    |

---

## 9. Errors

Every error response follows the same shape:

```json
{
  "error": {
    "code": "<machine-readable code>",
    "message": "<customer-safe message>"
  }
}
```

The `message` field (referred to as `public_message` internally) is **always safe to
display to customers**. It never contains stack traces, internal endpoints, or provider
messages.

### Status Codes

| Status | Code                  | When                                                 | Client Action |
|--------|-----------------------|------------------------------------------------------|---------------|
| **400** | `validation_error`   | Malformed request (missing `message`, too long, etc.). Also returned as 422 for Pydantic validation failures. | Show the error message. Fix the request. |
| **401** | `unauthorized`       | Missing, expired, or invalid `X-Session-Token`. Also returned when the origin doesn't match the sealed origin. | Call `/v1/session` again to get a new token, then retry. |
| **403** | `forbidden` / `policy_denied` | The request is valid but denied by a capability or guardrail. | Show the message. Do not retry. |
| **409** | `idempotency_conflict` | Same `Idempotency-Key` reused with a different message. | Do not retry with the same key. Generate a new key for a new message. |
| **422** | `validation_error`   | Request body fails Pydantic validation.               | Fix the request body. |
| **429** | `rate_limited`       | Too many requests. Response includes `Retry-After` header. | Wait for `Retry-After` seconds, then retry. |
| **429** | `budget_exceeded`    | Conversation token budget exhausted (~30k tokens).    | Show the message (offers a human agent). Do not retry. |
| **502** | `integration_error`  | An external system (e.g. Shopify API) failed.         | May retry. The message will say what failed. |
| **503** | `model_unavailable`  | Model provider is down, or concurrency limit reached. **Includes `Retry-After` header.** | **Must** wait for `Retry-After` seconds, then retry. The widget retries up to **2 times** with backoff. |
| **504** | `upstream_timeout`   | The turn took longer than the timeout (30s default).  | May retry once. |

### The `Retry-After` Header

When the response is `429` or `503`, the `Retry-After` header contains the number of
seconds to wait before retrying. **The client must respect this value.** The reference
widget enforces it:

```javascript
if (resp.status === 503 && attempt < MAX_RETRIES) {
  var delay = parseFloat(resp.headers.get('Retry-After') || '2') * 1000
  delay = Math.min(delay, 10000)  // cap at 10 seconds
  // wait, then retry
}
```

The widget retries at most **2 times** (3 total attempts). If all attempts fail, it
shows the error message.

### Correlation ID

Every response includes an `X-Correlation-Id` header. Log this on the client side — it is
the fastest way to trace a problem to a specific backend turn when a customer reports an
issue.

---

## 10. Diagnostic Mode

In non-production environments (development, test, staging), pass the header:

```
X-Diagnostic: 1
```

on a `POST /v1/chat` request. The response will include a `diagnostic` object with
detailed pipeline information.

> **Diagnostic mode is disabled in production.** The header is ignored silently.

> **Diagnostic mode is not available on `/v1/chat/stream`.** Use the sync endpoint for
> diagnostics.

### Diagnostic Object Fields

```json
{
  "diagnostic": {
    "route": {
      "tier": "t2_model",
      "skill": "commerce",
      "confidence": 0.92
    },
    "retrieval": { ... },
    "citations": [
      {
        "chunk_id": "chk_01J...",
        "document_id": "doc_01J...",
        "title": "...",
        "source_uri": "...",
        "source_version": "...",
        "score": 0.91
      }
    ],
    "hydration": { ... },
    "guards": { ... },
    "tokens": { "in": 1200, "out": 350 },
    "cost_usd": 0.0085,
    "timings": {
      "route_ms": 45,
      "gather_ms": 320,
      "hydrate_ms": 80,
      "generate_ms": 1100,
      "guard_input_ms": 12,
      "guard_output_ms": 15,
      "total_ms": 1680
    }
  }
}
```

| Field       | Type   | Description |
|-------------|--------|-------------|
| `route`     | object | Router decision: `tier` (e.g. `t0_cache`, `t1_retrieval`, `t2_model`), `skill` (e.g. `commerce`, `order`, `faq`), `confidence` (0.0–1.0). |
| `retrieval` | object | RAG retrieval details: chunk counts, scores, filter info. |
| `citations` | array  | Full citation objects (same as the response-level `citations`). |
| `hydration` | object | Live data hydration details (price/stock lookups).       |
| `guards`    | object | Input and output guardrail decisions and reasons.        |
| `tokens`    | object | `{"in": <int>, "out": <int>}` — token counts for this turn. |
| `cost_usd`  | float  | Cost of this turn.                                       |
| `timings`   | object | Stage-level latency in milliseconds. `null` if a stage was skipped. |

### Timings Breakdown

| Timing           | What It Measures |
|------------------|------------------|
| `route_ms`       | Router classification (skill + tier selection).        |
| `gather_ms`      | RAG retrieval (vector search, full-text search, reranking). |
| `hydrate_ms`     | Live data hydration (price, stock, promotion lookups). |
| `generate_ms`    | Model generation (the LLM call).                       |
| `guard_input_ms` | Input guardrail evaluation.                            |
| `guard_output_ms`| Output guardrail evaluation.                           |
| `total_ms`       | End-to-end turn latency.                               |

---

## 11. Conversation Continuity

### Continuing a Conversation

Pass `conversation_id` from the previous response in every subsequent message:

```json
{
  "message": "What about the 16oz?",
  "conversation_id": "conv_01J..."
}
```

The backend loads the last 10 messages of context. A new conversation is created
automatically when `conversation_id` is omitted.

### Reconnecting After a Dropped Connection

If the SSE stream drops mid-response, **do not re-send the message**. Instead, poll
the resume endpoint:

```
GET /v1/conversations/{conversation_id}/turns/{turn_id}
X-Session-Token: <token>
```

This requires the `conversation_id` (from the `meta` event) and `turn_id` (also from
`meta`). If the stream dropped before you received `meta`, you can safely re-send the
message with the same `client_message_id` — the backend will recognise it as a duplicate
and return the original answer.

### The Durable Turn

The generation is a durable database row, not a property of the HTTP connection. If the
client disconnects, the backend **keeps generating**. The answer will be there when you
poll the resume endpoint. This means:

- A reconnect resumes — it never starts a second generation.
- Re-sending the message (with the same `client_message_id`) is safe — it returns the
  existing answer, not a duplicate.

---

## 12. Multi-Store Rules

The session token pins the request to a specific tenant and marketplace. Currency,
language, and all data follow from that marketplace. The assistant answers in the language
of the customer's message (not the marketplace locale — the locale sets the widget chrome
and default strings). Citation links point at that marketplace's storefront domain (e.g.
`rdxsports.co.uk` for UK, `rdxsports.ae` for UAE, `rdxsports.ca` for Canada). The
frontend must **never** send a `marketplace` value in the request body that disagrees with
the token — in production the body field is ignored entirely, and in development it
would resolve to a different store than the customer is browsing, producing wrong prices,
wrong currency, and wrong product links.

---

## 13. Security Notes

All content from the API — the answer text, citation fields, product card fields — must be
treated as **untrusted data**.

1. **Never use `innerHTML`** to render the answer or any citation/product field. Always
   use `textContent` or `createElement`. The reference widget uses `textContent`
   exclusively.

2. **Validate every `href`** before making it a clickable link. Only allow `https:` URLs
   pointing at known RDX storefront domains. The reference widget checks against an
   explicit allowlist:

   ```javascript
   var ALLOWED_HOSTS = [
     'rdxsports.co.uk',
     'rdxsports.ae',
     'global.rdxsports.com',
     'rdxsports.ca',
     'rdxsports.com',
     'rdxsports.de'
   ]
   ```

   Reject `javascript:`, `data:`, and any host not in the list.

3. **Treat all text as untrusted.** Even though the backend guardrails filter output, the
   frontend is the last line of defence. A model that injects `<script>` into an answer
   must not find a client that executes it.

4. **Never log the session token** to analytics, error reporters, or the console. It
   contains sealed tenant and marketplace claims.

5. **Open product links with `rel="noopener"`** to prevent the linked page from accessing
   `window.opener`.

---

## 14. Store Reference Table

All six RDX stores share a single tenant (`rdx`). Each marketplace is a regional
storefront with its own currency, locale, Shopify shop, and primary domain.

### Tenant

| Tenant ID | Slug | Name |
|-----------|------|------|
| `ten_01M0WCYGYX06B2MGZMEZTK48WX` | `rdx` | RDX Sports |

### Marketplaces

| Store | Code | Marketplace ID | Currency | Locale | Shopify Domain | Primary Domain | Region |
|-------|------|----------------|----------|--------|----------------|----------------|--------|
| **UK** | `uk` | `mkt_01M0WCYH1CW86X6H33KMYYN6S3` | GBP | en-GB | rdx-sports-store.myshopify.com | rdxsports.co.uk | UK |
| **UAE** | `uae` | `mkt_01M0WCYH1P7NBN76H3YBX7EA0S` | AED | en-GB | rdx-sports-middle-east.myshopify.com | rdxsports.ae | AE |
| **International** | `intl` | `mkt_01M0WCYH1Y28ZM05JY1K3XKAWW` | USD | en-GB | rdx-sports-store-global.myshopify.com | global.rdxsports.com | INTL |
| **Canada** | `ca` | `mkt_01M0WCYH245A1VGK7RM3N68NTK` | CAD | en-CA | rdx-sports-store-canada.myshopify.com | rdxsports.ca | CA |
| **USA** | `usa` | `mkt_01M0WCYH2E2WCEBHS1CWR6FRS6` | USD | en-US | rdx-sports-store-usa.myshopify.com | rdxsports.com | US |
| **Europe** | `eu` | `mkt_01M0WCYH2NZTNHMHATP47PQM7X` | EUR | de | rdx-sports-store-europe.myshopify.com | rdxsports.de | EU |

### Quick-Reference: Dev Mode Slugs

These are the `tenant` and `marketplace` values to use in the request body when testing
locally without a session token:

| Store | `tenant` | `marketplace` |
|-------|----------|---------------|
| UK | `rdx` | `uk` |
| UAE | `rdx` | `uae` |
| International | `rdx` | `intl` |
| Canada | `rdx` | `ca` |
| USA | `rdx` | `usa` |
| Europe | `rdx` | `eu` |

---

## 15. Local Testing — Dev Mode

### How Dev Mode Works

When the environment is **not** production (`APP_ENV=development` or `test`), the chat
endpoints accept `tenant` and `marketplace` in the request body as a bypass for the
session token. This is the only way to test locally without a Shopify storefront.

The logic in `build_chat_scope` (`apps/chat/deps.py`):

1. If an `X-Session-Token` header is present, the token is verified and its sealed claims
   determine the tenant and marketplace. The body fields are ignored.
2. If no token is present **and** the environment is not production, the `tenant` (slug)
   and `marketplace` (code) body fields are resolved against the database.
3. If no token is present **and** the environment is production, the request is rejected
   with `401 unauthorized`.

### What You Need

- Docker services running (`docker compose up`)
- The chat service healthy on port **8001** (`http://localhost:8001/healthz`)
- The database seeded with the six marketplace rows (they exist after `make seed` or
  the initial migration)

### Dev Mode Request Format

```json
{
  "message": "your question here",
  "tenant": "rdx",
  "marketplace": "<code>"
}
```

Where `<code>` is one of: `uk`, `uae`, `intl`, `ca`, `usa`, `eu`.

No `X-Session-Token` header is needed. No Shopify signature is needed.

### Session Endpoint (`/v1/session`) in Dev Mode

The `/v1/session` endpoint **always** requires a valid Shopify App Proxy signature, even
in development. You cannot call it directly without one. For local testing, skip the
session entirely and use the dev-mode body fields on `/v1/chat` and `/v1/chat/stream`.

---

## 16. Curl / PowerShell Examples

All local examples target `http://localhost:8001`. Replace with the staging or production
URL as needed.

### PowerShell: Synchronous Chat — All 6 Stores

#### UK Store (GBP, en-GB)

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:8001/v1/chat" `
  -ContentType "application/json" `
  -Body '{"message": "Do you have the T17 Aura Plus boxing gloves in 14oz?", "tenant": "rdx", "marketplace": "uk"}'
```

#### USA Store (USD, en-US)

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:8001/v1/chat" `
  -ContentType "application/json" `
  -Body '{"message": "What boxing gloves do you recommend for beginners?", "tenant": "rdx", "marketplace": "usa"}'
```

#### Canada Store (CAD, en-CA)

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:8001/v1/chat" `
  -ContentType "application/json" `
  -Body '{"message": "Do you ship the F6 Kara punch bag to Toronto?", "tenant": "rdx", "marketplace": "ca"}'
```

#### Europe Store (EUR, de)

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:8001/v1/chat" `
  -ContentType "application/json" `
  -Body '{"message": "Haben Sie die T17 Aura Plus Boxhandschuhe?", "tenant": "rdx", "marketplace": "eu"}'
```

#### UAE Store (AED, en-GB)

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:8001/v1/chat" `
  -ContentType "application/json" `
  -Body '{"message": "What is the price of the RDX F6 Kara punch bag?", "tenant": "rdx", "marketplace": "uae"}'
```

#### International Store (USD, en-GB)

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:8001/v1/chat" `
  -ContentType "application/json" `
  -Body '{"message": "Do you have any MMA gloves in stock?", "tenant": "rdx", "marketplace": "intl"}'
```

### PowerShell: Synchronous Chat with Diagnostics

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:8001/v1/chat" `
  -ContentType "application/json" `
  -Headers @{ "X-Diagnostic" = "1" } `
  -Body '{"message": "Do you have the T17 Aura Plus in 14oz?", "tenant": "rdx", "marketplace": "uk"}'
```

The response includes a `diagnostic` object with route, retrieval, timings, etc.

### PowerShell: Streaming Chat (SSE)

PowerShell's `Invoke-RestMethod` does not natively handle SSE streams. Use `curl.exe`
(shipped with Windows 10+) or `Invoke-WebRequest` with manual stream reading:

```powershell
curl.exe -X POST "http://localhost:8001/v1/chat/stream" `
  -H "Content-Type: application/json" `
  -N `
  -d '{"message": "What boxing gloves do you recommend?", "tenant": "rdx", "marketplace": "uk"}'
```

### PowerShell: Continue a Conversation

```powershell
# First message — save the conversation_id from the response
$r = Invoke-RestMethod -Method Post -Uri "http://localhost:8001/v1/chat" `
  -ContentType "application/json" `
  -Body '{"message": "Do you have the T17 Aura Plus?", "tenant": "rdx", "marketplace": "uk"}'

$r.conversation_id  # e.g. "conv_01M..."

# Follow-up message — pass the conversation_id
$body = @{
  message = "What about in 16oz?"
  tenant = "rdx"
  marketplace = "uk"
  conversation_id = $r.conversation_id
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "http://localhost:8001/v1/chat" `
  -ContentType "application/json" `
  -Body $body
```

### PowerShell: With Idempotency Key

```powershell
$key = [System.Guid]::NewGuid().ToString()

Invoke-RestMethod -Method Post -Uri "http://localhost:8001/v1/chat" `
  -ContentType "application/json" `
  -Headers @{ "Idempotency-Key" = $key } `
  -Body '{"message": "What gloves do you recommend for beginners?", "tenant": "rdx", "marketplace": "uk"}'
```

### PowerShell: With client_message_id (Deduplication)

```powershell
$msgId = "test-$(Get-Date -Format 'yyyyMMddHHmmss')-001"

$body = @{
  message = "Do you have the T17 Aura Plus?"
  tenant = "rdx"
  marketplace = "uk"
  client_message_id = $msgId
} | ConvertTo-Json

# First attempt
Invoke-RestMethod -Method Post -Uri "http://localhost:8001/v1/chat" `
  -ContentType "application/json" `
  -Body $body

# Retry with SAME client_message_id — returns the original answer, not a duplicate
Invoke-RestMethod -Method Post -Uri "http://localhost:8001/v1/chat" `
  -ContentType "application/json" `
  -Body $body
```

### Bash/Curl: Synchronous Chat — All 6 Stores

```bash
# UK
curl -s -X POST http://localhost:8001/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Do you have the T17 Aura Plus boxing gloves in 14oz?", "tenant": "rdx", "marketplace": "uk"}'

# USA
curl -s -X POST http://localhost:8001/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What boxing gloves do you recommend for beginners?", "tenant": "rdx", "marketplace": "usa"}'

# Canada
curl -s -X POST http://localhost:8001/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Do you ship the F6 Kara punch bag to Toronto?", "tenant": "rdx", "marketplace": "ca"}'

# Europe (German)
curl -s -X POST http://localhost:8001/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Haben Sie die T17 Aura Plus Boxhandschuhe?", "tenant": "rdx", "marketplace": "eu"}'

# UAE
curl -s -X POST http://localhost:8001/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the price of the RDX F6 Kara punch bag?", "tenant": "rdx", "marketplace": "uae"}'

# International
curl -s -X POST http://localhost:8001/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Do you have any MMA gloves in stock?", "tenant": "rdx", "marketplace": "intl"}'
```

### Bash/Curl: Streaming Chat (SSE)

```bash
curl -s -X POST http://localhost:8001/v1/chat/stream \
  -H "Content-Type: application/json" \
  -N \
  -d '{"message": "What boxing gloves do you recommend?", "tenant": "rdx", "marketplace": "uk"}'
```

### Bash/Curl: With Diagnostics

```bash
curl -s -X POST http://localhost:8001/v1/chat \
  -H "Content-Type: application/json" \
  -H "X-Diagnostic: 1" \
  -d '{"message": "Do you have the T17 Aura Plus in 14oz?", "tenant": "rdx", "marketplace": "uk"}'
```

### Bash/Curl: Resume a Turn

```bash
curl -s http://localhost:8001/v1/conversations/conv_01M.../turns/turn_01M... \
  -H "Content-Type: application/json" \
  -d '{"tenant": "rdx", "marketplace": "uk"}'
```

Note: the resume endpoint requires a session token in production. In dev mode, pass
`tenant` and `marketplace` in the body to resolve the scope.

### Staging/Production: With Session Token

```bash
curl -s -X POST https://chat-staging.rdxsports.com/v1/chat \
  -H "Content-Type: application/json" \
  -H "X-Session-Token: $TOKEN" \
  -d '{"message": "Do you have the T17 Aura Plus in 14oz?", "client_message_id": "test-001"}'
```

### Swagger UI

Available in non-production environments at:

```
http://localhost:8001/docs
```

Disabled in production (`docs_url` is `None`).

---

## 17. Common Mistakes

These are the five things new integrators get wrong. Every one of them has caused a
production incident or a failed integration.

### 1. Regenerating `client_message_id` on retry

**Wrong:** Generate a new UUID on every `fetch()` call.
**Right:** Generate the UUID once when the user presses Send. Reuse it for retries.

If you regenerate the ID, the backend treats the retry as a new message. The customer
sees the same answer twice. The conversation history has a duplicate. This is the single
most common integration bug.

### 2. Appending on `replace` event instead of replacing

**Wrong:** `content += replace.text`
**Right:** `content = replace.text`

A `replace` event means the output guardrail rewrote the answer. If you append, the
customer sees the original (potentially wrong) answer followed by the corrected answer.
The guardrail exists for a reason — the original text may contain a policy violation,
a hallucinated price, or an incorrect safety claim.

### 3. Ignoring `Retry-After` on 503

**Wrong:** Immediately retry on 503, or retry in a tight loop.
**Right:** Read the `Retry-After` header, wait that many seconds, then retry.

The 503 means the system is at capacity. Ignoring `Retry-After` turns a temporary
overload into a sustained one. The reference widget caps the delay at 10 seconds and
retries at most 2 times.

### 4. Trusting the body's `marketplace` over the token

**Wrong:** Let the client set `marketplace` in the request body and expect it to control
which store's data is used.
**Right:** The token is the authority. In production, `tenant` and `marketplace` in the
body are ignored. The token's sealed claims determine which tenant and marketplace are
used.

If you are testing in development without a token, the body fields work — but this is a
convenience, not the production contract.

### 5. Using `innerHTML` on answer or citation text

**Wrong:** `el.innerHTML = answer`
**Right:** `el.textContent = answer` or build DOM nodes with `createElement`.

The answer text and all citation/product fields come from a model. Even with output
guardrails, treating model output as HTML is an XSS vector. The reference widget never
uses `innerHTML` for content (only for the static close-button glyph `&#10005;`).

### 6. Calling `/v1/session` directly in local testing

**Wrong:** Trying to `POST /v1/session?tenant_id=...&marketplace_id=...` locally.
**Right:** Use the dev-mode bypass: pass `"tenant": "rdx"` and `"marketplace": "uk"` in
the chat request body. The session endpoint requires a valid Shopify App Proxy signature
that only the storefront can produce.
