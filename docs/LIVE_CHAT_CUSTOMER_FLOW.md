# Live chat — handoff and customer conversation

How a chatbot conversation becomes a human chat, and how the customer and the agent then talk. The agent desk itself (inboxes, limits, permissions) is in [LIVE_CHAT.md](./LIVE_CHAT.md). This file is the customer path and the strategy the code uses to keep it instant and ordered.

Three programs are involved:

| Piece | Role |
| --- | --- |
| AI service | Decides a person should take over. Calls `POST /api/live-chat/handoffs`, then puts the desk id and customer token on the reply the chatbot already shows. |
| `apps/cts-backend` | Creates the desk conversation, places it in the queue, and runs the customer API. |
| `apps/chatbot-next` | Keeps the assistant until that token arrives, then replaces the assistant thread with a live chat. Only the human talks after that. |

The dashboard (`apps/cts-dashboard`) is the agent's side of the same conversation. It is not called by the customer.

---

## The flow

```text
Customer talks to the assistant
        │
        ▼
AI service  POST /api/live-chat/handoffs   (service token)
        │
        ▼
cts-backend creates a waiting conversation, places it, returns customerToken
        │
        ▼
AI reply the widget already renders, plus:
  handoff.reference, handoff.handoff_id, handoff.customer_token
        │
        ▼
Chatbot checks `handoff.reference`, `handoff.handoff_id`, and that the channel is Live Chat (or that a `customer_token` is already on the reply). `NEXT_PUBLIC_LIVE_CHAT_API_BASE` must be set.
        │
        ├─ missing  → stay on the assistant. "Passed to our support team" stays as it is.
        └─ present  → save the session, replace the thread with the live chat
                          │
                          ├─ GET  /customer/events     SSE, Authorization: Bearer token
                          └─ POST /customer/messages   the customer's text
                          │
Agent takes the chat, replies, transfers, or closes
        │  each change commits a row, then NOTIFY carries ids only
        ▼
Customer's open stream receives the message or the new status
        │
Close → "This chat has ended." and a button to start a new assistant chat
```

### 1. The AI service creates the handoff

`POST /api/live-chat/handoffs` is authenticated with the chatbot service token (`CHATBOT_SERVICE_TOKEN`), not a staff session and not the customer token. The body is the customer and why the chat was handed over: `conversationId`, `customerName`, `customerEmail`, `channel`, `orderNumber`, `handoffReason`, `aiSummary`, `location`, `tags`.

`conversationId` here is the AI service's own id for that support thread. It is not the chatbot widget's private conversation id, and the widget never sends it. The schema allows letters, digits, `_`, and `-`, up to 64 characters.

Inside one transaction the server:

1. Locks the queue.
2. Inserts a `waiting` row in `live_chat_conversations`. If an open conversation already exists for that `conversationId`, the insert does nothing and the existing row is returned (`200` instead of `201`).
3. On a new row, writes one system message for the desk only: `AI handed this chat to a human agent. {reason}`. The customer never sees this line. The earlier AI transcript is not copied in. It arrives later, through a separate path.
4. Runs the same placement as every other queue change. The chat lands in an accepting agent's Active tab when that agent still has room. If every accepting agent is at their limit, `queuedFor` is null and the chat stays in User Queue until a slot opens or an admin takes it.
5. Publishes a desk event on `live_chat_events` before commit, so connected desks refresh when the transaction commits.

The response is:

```json
{
  "success": true,
  "data": {
    "id": "desk-conversation-uuid",
    "conversationId": "the id the AI service sent",
    "status": "waiting",
    "queuedFor": { "id": 12, "name": "Sarah Chen" },
    "handedOffAt": "2026-11-04T08:00:00.000Z",
    "customerToken": "<jwt>"
  }
}
```

`queuedFor` is `null` when nobody had room. A repeat call for an open handoff returns the same conversation with a new `customerToken`.

### 2. The token is scoped to that one chat

`customerToken` is a JWT, audience `live-chat-customer`, subject the desk conversation id, lifetime 24 hours. It is signed with `HMAC-SHA256(JWT_SECRET, "live-chat-customer")`, not with `JWT_SECRET` itself. A staff session therefore cannot be used as a customer token, and a customer token cannot be used as a staff session. The token grants read and write of that one conversation and nothing else.

The customer API is mounted at `/api/live-chat/customer` before the desk router. Every customer route requires `Authorization: Bearer <customerToken>`. Staff cookies are ignored.

### 3. The AI service passes the token through

The chatbot does not call the handoff API. It only looks at the assistant reply it already received. The AI service must copy the handoff response onto that reply:

```json
"handoff": {
  "reference": "<data.id>",
  "channel": "LiveChat",
  "handoff_id": "<data.id>",
  "customer_token": "<data.customerToken>"
}
```

`reference` and `handoff_id` are the same desk id. `SupportHandoff` in `packages/chat-contract` carries `handoff_id` and `customer_token` as optional fields, so older clients ignore them.

### 4. The widget switches, or it does not

`liveChatHandoffFromReply` (`apps/chatbot-next/lib/live-chat/session.ts`) opens the live thread when `NEXT_PUBLIC_LIVE_CHAT_API_BASE` is set and the reply has `handoff.reference` and `handoff.handoff_id`. The channel must be `LiveChat`, unless the reply already includes `customer_token`.

If the token is on the reply, the widget uses it. If it is not, the widget calls `POST /api/live-chat/customer/session` with `{ "handoffId" }` and the API returns a token for that desk conversation. The assistant thread is replaced as soon as the handoff is recognized. The composer stays disabled until that token arrives, so a message is not dropped. A handoff already sitting in the transcript is picked up on the next render, including after a reload that has not stored a token yet.

When all four are present, `useSupportChat` calls `onHandoff`, and `ChatPanel` stores the session and renders `LiveChatView` instead of the assistant list and composer. The session is kept in `sessionStorage` under `rdx-chat:live:${store}`, so a reload of the same tab stays in the live chat. The panel is keyed by store, so a different store does not reuse it.

The header then shows the live status: waiting, chatting with the agent's first name, reconnecting, or chat ended. The assistant is not asked another question on this thread.

### 5. The customer joins

The widget opens one stream and sends messages on a separate request. Both go straight to cts-backend. They do not pass through a Next.js rewrite, because a rewrite can buffer a long-lived stream.

| Call | Purpose |
| --- | --- |
| `POST /api/live-chat/customer/session` | Exchange `{ "handoffId" }` for `{ "customerToken" }` when the assistant reply has no token. |
| `GET /api/live-chat/customer/events` | Receive. `Last-Event-ID` is the last message id the browser has applied. |
| `POST /api/live-chat/customer/messages` | Send. Body `{ "body": "text", "clientId": "live_…" }`. |

The browser uses `fetch` with an `Authorization` header and parses the SSE text itself (`lib/live-chat/sse.ts`). `EventSource` cannot set that header, and putting the token in the query string would leak it into logs.

On open, the stream writes `retry: 3000`, then:

1. Subscribes to live notices and buffers them.
2. Replays messages after `Last-Event-ID`, or the latest 500 if there is no cursor.
3. Sends one `status` event (`waiting`, `active`, or `resolved`, plus the owner's first name while active).
4. Flushes anything that arrived during the replay, skipping message ids already written.

After that, live events are written as they are delivered. A comment line (`: ping`) every 25 seconds keeps proxies from closing an idle stream. The server ends the stream after 30 minutes. The client reconnects with its cursor. At most 5 streams may be open for one conversation (`429 TOO_MANY_STREAMS`).

A customer may send while the chat is `waiting` or `active`. Once it is `resolved`, send returns `409 CONVERSATION_CLOSED`.

### 6. What the customer is allowed to see

A message is visible when its author is `customer` or `agent`, or it is `system` and `customer_body` is set. Everything else stays on the desk:

| Stored as | Customer sees |
| --- | --- |
| Customer message | Their own text, under their name |
| Agent reply | The text, author shown as the agent's first name |
| System line with `customer_body` | That wording, not the desk wording |
| Private note (`author = note`) | Nothing |
| AI turns and the handoff reason | Nothing |

The two wordings of the same event:

| Action | Desk (`body`) | Customer (`customer_body`) |
| --- | --- | --- |
| Take | `{name} took this conversation.` | `{first name} joined the chat.` |
| Transfer | `{name} transferred this chat to {target}.` | `You're now chatting with {first name}.` |
| Close | `Conversation closed by {name}.` | `This chat has ended.` |
| Reopen | `{name} reopened the conversation.` | `{first name} reopened the chat.` |

`customerFacingName` uses the first word of the agent's name, or `Our team` when the name is blank.

### 7. An agent acts, the customer hears it

Take, transfer, reply, close, and reopen all run inside a transaction that locks the conversation row, writes the message, and calls `publishCustomerEvent` before commit. A private note writes a desk message and does not publish a customer event.

`publishCustomerEvent` sends Postgres `NOTIFY` on `live_chat_customer_events`. The payload is `{ c, m, s }`: conversation id, message ids, and whether status changed. It does not contain the message text. `NOTIFY` is capped at 8,000 bytes, and a message body (including Arabic) can be large. Each API process that has a subscriber for that conversation loads the rows once and writes them to its open streams. A process with no subscriber for that id ignores the notice.

The same transaction also publishes the desk event on `live_chat_events`. A new message is pushed onto the desk stream that is already open, and the desk appends that row. Status changes, queue moves, and a dropped stream still reload the thread. Typing uses the same two streams and is not stored.

### 8. The chat ends

Resolve sets status `resolved`, writes the customer line `This chat has ended.`, and sends a status event. The widget shows that line and a **Start a new chat** button. It does not switch back to the assistant by itself. The button clears the live session and resets the assistant transcript.

A `401` or `404` on the stream or on send (expired token, conversation gone) marks the session expired and shows the same way out. A send that fails for any other reason stays on screen as **Not sent · Tap to retry** and reuses the same `clientId`.

---

## Strategy

The goal is a live thread with no skipped or reordered messages, without holding a WebSocket per customer and without putting message text on the database notification bus.

### SSE down, HTTP up

Receiving is Server-Sent Events. Sending is `POST`. The server already had this shape for the desk (`GET /live-chat/events` plus ordinary mutations). WebSockets would add a second connection model, a second auth path, and no gain: the customer sends one message at a time, and the server pushes many. SSE is one long HTTP response, which the existing process, CORS, and rate limiter already understand.

### One bus, ids only, load the row after commit

Writers do not push bytes at sockets. They `NOTIFY` from inside the transaction. Postgres delivers that only if the transaction commits, so a rollback never reaches a browser.

The customer channel carries ids. The process that holds the socket reads `live_chat_messages` (through the visibility filter) and writes SSE. That keeps the notification small, lets every process serve only the sockets it owns, and means a missed notification is recovered by reading the table again rather than by replaying a side channel.

If the listener connection drops, every open customer stream is closed. Clients reconnect and send `Last-Event-ID`. The replay is the recovery, not an in-memory buffer. If the listener cannot start, the stream closes immediately (`LISTENER_UNAVAILABLE`) instead of replaying and then going silent.

### Order by locking the conversation, then the cursor

Message ids are `BIGSERIAL`. Two inserts in one conversation could otherwise commit out of id order, and a client that had seen the higher id would skip the lower one on resume.

Every insert (customer send and desk send) locks the conversation row with `SELECT … FOR UPDATE` first. Ids for that conversation commit in the order the writers acquired the lock. The stream cursor is that id. On the client, ids are ordered by decimal length and then lexicographically, which matches numeric order for these ids without using `BigInt` in the reducer.

While a stream is replaying, live notices are buffered and then written only if their id is newer than the replay. The subscribe happens before the replay query, and the listener must be up before that query runs, so a commit between the query and the subscription is not dropped.

Delivery for one conversation is a promise chain. Notices are loaded and written in the order they were notified. If a load fails, those streams are closed and the clients replay.

### Send once, show it immediately

The widget appends a pending bubble before the `POST` returns, so the thread does not wait on the network. The `POST` response and the SSE event both carry `clientId`. The reducer replaces the pending bubble when either arrives, and it ignores a second copy of the same server id.

`clientId` is 8–64 characters of `A-Za-z0-9_-`. The widget uses `live_<uuid>`. A unique partial index on `(conversation_id, client_message_id)` makes a retry insert do nothing. The API then returns the stored row and does not notify again. A double tap or a timeout retry cannot create two messages.

### Hide desk text with a second column, not a second table

`customer_body` is null on notes, AI lines, and the handoff reason, and set on the four customer-facing system lines. The customer query is one filter: author in (`customer`, `agent`), or system with `customer_body` not null. The body the customer reads is `COALESCE(customer_body, body)`, so agent and customer messages need no second copy.

### Direct to the API, token in the header

`NEXT_PUBLIC_LIVE_CHAT_API_BASE` points at cts-backend. The chatbot origin must be listed in `CORS_ORIGIN`, or the browser's `POST` is rejected (`ORIGIN_NOT_ALLOWED`). The stream request is a GET, which CORS treats as safe, but the send is not.

### Limits

| Limit | Value | Where |
| --- | --- | --- |
| Customer token lifetime | 24 hours | A repeat handoff call issues a fresh one |
| Stream lifetime | 30 minutes | Client reconnects with its cursor |
| Streams per conversation | 5 | Extra open is `429` |
| Replay page | 500 messages | Latest page, or the page after the cursor |
| Message body | 4,000 characters | Control characters stripped |
| Customer requests | 300 / minute / IP | Before the token is checked |
| Customer sends | 30 / minute / conversation | |
| Stream opens | 30 / minute / conversation | |

Rate-limit windows and the handoff route limit are in `live-chat.constants.ts`.

---

## Where it lives

| Concern | File |
| --- | --- |
| Handoff route, customer routes mounted first | `apps/cts-backend/src/modules/live-chat/live-chat.routes.ts` |
| Create conversation, placement, desk notify | `apps/cts-backend/src/modules/live-chat/handoffs.service.ts` |
| Attach `customerToken` to the response | `apps/cts-backend/src/modules/live-chat/handoffs.controller.ts` |
| Sign and verify the customer JWT | `apps/cts-backend/src/modules/live-chat/customer-token.ts` |
| SSE and send handlers | `apps/cts-backend/src/modules/live-chat/customer.controller.ts` |
| Visibility query, send, idempotent `clientId` | `apps/cts-backend/src/modules/live-chat/customer.service.ts` |
| `NOTIFY` payload and desk hub | `apps/cts-backend/src/modules/live-chat/live-chat.events.ts` |
| Per-process customer subscribers | `apps/cts-backend/src/modules/live-chat/customer-events.ts` |
| `LISTEN` reconnect | `apps/cts-backend/src/modules/live-chat/pg-listener.ts` |
| First names, customer system copy, limits | `apps/cts-backend/src/modules/live-chat/live-chat.constants.ts` |
| Agent actions that publish a customer notice | `apps/cts-backend/src/modules/live-chat/desk.service.ts` |
| `customer_body`, `client_message_id` | `apps/cts-backend/src/db/migrations/022_live_chat_customer.sql` |
| Shared message and error types | `packages/chat-contract/src/live-chat.ts` |
| `handoff_id`, `customer_token` on the assistant reply | `packages/chat-contract/src/support.ts` |
| Switch decision and `sessionStorage` | `apps/chatbot-next/lib/live-chat/session.ts` |
| Stream loop, reconnect, send, retry | `apps/chatbot-next/lib/live-chat/use-live-chat.ts` |
| Ordered messages and pending bubbles | `apps/chatbot-next/lib/live-chat/state.ts` |
| `fetch` to the customer API | `apps/chatbot-next/lib/live-chat/api.ts` |
| Replace the assistant thread | `apps/chatbot-next/components/chat/ChatPanel.tsx` |
| Bubbles, queue copy, ended banner | `apps/chatbot-next/components/chat/LiveChatView.tsx` |

---

## What has to be configured

| Setting | Where | Why |
| --- | --- | --- |
| `CHATBOT_SERVICE_TOKEN` | cts-backend | The AI service sends it to create a handoff |
| `JWT_SECRET` | cts-backend | The customer token is derived from it |
| `CORS_ORIGIN` | cts-backend | Must include the chatbot origin, for example `http://localhost:3010` |
| `NEXT_PUBLIC_LIVE_CHAT_API_BASE` | chatbot-next | Base URL of `/api/live-chat/customer`. Unset means the widget never switches. Restart the Next dev server after changing it |

Until `NEXT_PUBLIC_LIVE_CHAT_API_BASE` is set, a handoff still creates the desk conversation and the widget still shows "Passed to our support team". It does not open the live thread. With that base URL set, a Live Chat handoff opens the thread even when the assistant reply has no `customer_token`. The widget fetches one from `POST /customer/session`.

---

## Not in this version

- Typing indicators, in either direction. The desk field exists; nothing publishes it.
- Copying the AI transcript into `live_chat_messages` at handoff time.
- Pushing a typing signal. The customer and the agent each send a typing flag, and the other side shows it on the stream it already holds.
- Switching back to the assistant when the agent closes the chat. The customer chooses **Start a new chat**.
