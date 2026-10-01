# CTS Dashboard — Live Chat workflow

Source of truth for the Live Chat desk at `/live-chat` in `apps/cts-dashboard`. The UI is complete and currently runs on local sample data. The backend owns conversation state, queue assignment, permissions, and realtime updates. The dashboard renders what these APIs return.

The “New handoff” button in the desk is a demo injector. Production handoffs come from the AI assistant, not from that button.

---

## Actors

| Actor | How they get in | What they see |
| --- | --- | --- |
| Agent | `live_chat.access` | User Queue: every waiting chat. Active: owned chats plus waiting chats assigned to them, capped by their limit. Closed: chats they own |
| Support admin (`admin` role) | Same permission. Admins pass every permission check | The same three inboxes for their own workload, plus every other agent’s owned chats (Team) and every closed chat. Team tab shows the roster |
| Super admin | No live-chat access | Sidebar and route stay closed |
| Customer / AI assistant | Not this app | They start the thread. A handoff creates the desk conversation |

Extra actions need extra permissions. `admin` has all of them:

| Permission | Allows |
| --- | --- |
| `live_chat.access` | Open `/live-chat` |
| `live_chat.reply` | Customer replies and private notes |
| `live_chat.assign` | Take over, transfer, reopen, and presence |
| `live_chat.resolve` | Close an owned active chat |

A user can read a chat they are allowed to see and still be blocked from reply, take, or close.

---

## Conversation lifecycle

```text
AI handoff
    │
    ▼
waiting  (listed in User Queue for every agent)
    │  balancer places it into an accepting agent's Active tab
    │  when that agent still has room (queuedForId = agent, or null if full)
    ▼
Active tab (owned active chats + waiting chats assigned to that agent)
    │  Take over (only from Active, only the assigned agent, needs assign)
    ▼
active   (ownerId = that agent, queuedForId = null)
    │
    ├─ Reply / private note
    ├─ Transfer → still active, ownerId = target agent, then rebalance
    └─ Close (needs resolve) → frees one Active slot, then rebalance
           ▼
       resolved (ownerId stays the closer)
           │
           └─ Reopen (needs assign, only that owner) → active
```

Statuses are exactly `waiting`, `active`, and `resolved`.

The API must reject any transition the desk already refuses:

| Action | Allowed when |
| --- | --- |
| Take over | `status = waiting` and `queuedForId` is the caller. Needs `live_chat.assign`. The desk shows this only in Active. User Queue has no take action. Admins cannot take a chat queued for someone else |
| Reply | `status = active` and `ownerId` is the caller. Needs `live_chat.reply` |
| Private note | Any non-resolved chat the caller can open, including a chat owned by someone else. Needs `live_chat.reply`. Never sent to the customer |
| Transfer | Caller owns an active chat. Target is another support member. Needs `live_chat.assign` |
| Close | Caller owns an active chat. Needs `live_chat.resolve`. `ownerId` is kept |
| Reopen | `status = resolved` and `ownerId` is the caller. Needs `live_chat.assign`. Becomes `active` for that same owner |

Every status change appends a system message and sets `updatedAt` to that message time:

| Action | System body |
| --- | --- |
| Handoff | `AI handed this chat to a human agent. {handoff reason}` |
| Take over | `{agent name} took this conversation.` |
| Transfer | `{agent name} transferred this chat to {target name}.` |
| Close | `Conversation closed by {agent name}.` |
| Reopen | `{agent name} reopened the conversation.` |

---

## Queue assignment

The server runs this. The desk currently recomputes it in the browser after every handoff, take over, transfer, close, reopen, presence change, and limit change.

Each support member has:

| Field | Meaning |
| --- | --- |
| `id` | Stable member id. The desk uses the authenticated user id |
| `name` | Display name |
| `role` | `agent` or `admin` |
| `limit` | Integer 1–12. Sample default is 6 |
| `accepting` | Online/offline. Offline members receive no new queued chats |

The limit is the size of that member’s Active tab. It counts owned chats and assigned waiting chats together. A limit of 6 means at most 6 of those chats appear in Active.

- `queued` = waiting chats with `queuedForId = member` (shown in that member’s Active tab, and also in User Queue)
- `taken` = active chats with `ownerId = member`
- `load` = `queued` + `taken`. New waiting chats are assigned only while `load` is under `limit`

Rebalance, in order:

1. Owned active chats occupy slots first. Rebalance never moves `ownerId`.
2. Take every `waiting` chat, oldest `handedOffAt` first.
3. Keep a chat on its current `queuedForId` when that member is accepting and `load` is still under their limit.
4. Chats that no longer fit (member offline, over limit, or `queuedForId` null) become loose.
5. Place each loose chat, oldest first, on the accepting member with the lowest load. Ties break by name, ascending. This is incremental: one newly opened slot receives the next oldest loose chat.
6. If every accepting member is full, set `queuedForId` to null. The chat stays `waiting` in User Queue only.

Going offline releases that member’s waiting assignments and runs the same placement. Owned chats stay with them. Changing a limit does the same. Closing or transferring an owned chat frees a slot, and the next oldest loose chat is assigned into Active. Taking over a waiting chat does not free a slot, because that chat remains inside the same limit as an owned chat.

Sort:

- User Queue: oldest `handedOffAt` first
- Active: assigned waiting chats first (oldest `handedOffAt`), then owned chats by `updatedAt` descending
- Team and Closed: `updatedAt` descending

---

## Inboxes

| Inbox | Agent | Admin |
| --- | --- | --- |
| User Queue | every `waiting` chat. No take action | every `waiting` chat. No take action |
| Active | `waiting` queued for me, plus `active` chats I own. Together these stay within my limit, unless I already own more than the limit | same, for the admin’s own workload |
| Team | hidden | `active` owned by someone else |
| Closed | `resolved` and I own it | every `resolved` chat |

Search matches customer name, email, order number, last non-system message, and tag label, within the inbox the caller is allowed to see. The list API should accept the same `q` and `inbox` so the client does not have to hold the whole history.

Agents see every waiting chat in User Queue, including chats already assigned into someone’s Active tab. Each waiting row shows the queue age and who it is assigned to (`Assigned to you`, a member name, or `Unassigned`). They do not see other agents’ owned or closed chats. After a transfer, the previous owner loses the thread unless they are an admin. There is no action that puts an owned chat back into the waiting queue.

---

## Agent workflow

1. Open `/live-chat`. Load the caller’s presence (`accepting`, `limit`) and the conversation list for the selected inbox.
2. The Online switch sets `accepting`. Offline means “not accepting new handoffs,” and that member’s waiting assignments leave Active immediately. Chats they already own stay.
3. Active limit is 1–12. It caps owned chats plus waiting chats assigned to that person. Agents change only their own. Admins change anyone’s from the Team tab.
4. A new handoff arrives as `waiting` in User Queue, and the balancer places it into Active when someone has room. If it is assigned to this agent, the desk opens it on the Active tab.
5. The agent opens the thread. The browser keeps at most 5 chats open at once (one main panel, the rest as bottom windows). Side windows are only chats from that agent’s Active tab, and they stay up while the agent looks at another inbox. Opening a User Queue, Team, or Closed chat puts it in the main panel. If the chat that was in the main panel is still an Active-tab chat, it moves to a side window. Closing a window does not change conversation status. The 5-chat cap is client-only.
6. User Queue never offers take. In Active, a waiting chat assigned to the agent has Take over. Take over sets `active`, `ownerId = caller`, `queuedForId = null`, and writes the system message. The chat stays inside the same limit, so the next waiting chat is not assigned until a slot opens (close, transfer away, a higher limit, or coming back online).
7. The owner replies. Enter sends. Shift+Enter is a newline. Empty text is not sent. A draft that still starts with `/` is not sent. `/` opens the canned-reply picker.
8. Private note is a message with `author = note`. On a chat the agent does not own, the composer defaults to note and the reply box stays disabled until they own it.
9. Transfer keeps the same thread and moves `ownerId`. The target can be offline. The chat then counts toward the target’s Active limit. If that pushes them over the limit, their waiting assignments are released back to User Queue and placed again. The previous owner’s freed slot can receive the next oldest loose chat. After transfer, the previous owner no longer sees the chat unless they are an admin (Team inbox).
10. Close moves the chat to Closed and frees one Active slot. Reopen returns it to Active for the same owner. If that owner is already at the limit, reopen still succeeds, and waiting chats are released until the load fits.
11. Unread clears when the chat is on screen: the main panel, or an expanded side window. A minimized pill does not clear it. Opening the thread marks it read on the server.

---

## Team tab (admins only)

Four counts:

| Stat | Value |
| --- | --- |
| Incoming | `waiting` total, including chats already sitting in someone’s Active tab. Hint shows how many have `queuedForId = null` |
| Taken | `active` total |
| Closed | `resolved` total |
| Accepting | accepting members / all members |

Per member: name, role, status (`Not accepting` / `At limit` / `Open`), waiting count shown with `load/limit`, taken count, and an editable Active limit. `At limit` means waiting plus taken has reached the limit. Saving a limit rebalances waiting chats into Active. Agents edit only their own limit, from the chat list. Admins edit anyone’s limit here.

---

## Data the desk renders

### Conversation

| Field | Type | Use |
| --- | --- | --- |
| `id` | string | Stable id |
| `customerName` | string | List, header |
| `customerEmail` | string | Search, mailto |
| `channel` | string | Header. Samples use `Website chat` |
| `orderNumber` | string or null | Header, search, copy button |
| `status` | `waiting` \| `active` \| `resolved` | Inbox and actions |
| `queuedForId` | string or null | Waiting chat placed in that member’s Active tab. Null while it is only in User Queue |
| `ownerId` | string or null | Set once taken. Kept after close |
| `handoffReason` | string | Customer panel |
| `aiSummary` | string | Customer panel |
| `handedOffAt` | ISO-8601 | Queue age and queue sort |
| `updatedAt` | ISO-8601 | List time and non-queue sort |
| `unread` | number | Badge. Clear on view |
| `tags` | string[] | Ids below. UI shows the first two and does not edit them |
| `location` | string | Current visit |
| `currentPage` | string | Current visit |
| `visits` | number | Customer panel |
| `browser` | string | Current visit |
| `referrer` | string | Current visit |
| `typing` | boolean | `{name} is typing…` while the customer is typing |
| `messages` | ChatMessage[] | Full transcript, including AI turns before the handoff |

Tag ids the UI knows: `shipping`, `refund`, `exchange`, `tracking`, `priority`. Unknown ids still match search as raw text. There is no tag-edit action.

List rows may omit `messages` and include `lastMessage`: the latest message whose author is not `system`. If that author is `note`, the preview is `Note: {body}`. If there is no such message, the preview is `Handed off from the AI assistant`.

### Message

| Field | Type | Use |
| --- | --- | --- |
| `id` | string | Stable id |
| `author` | `customer` \| `assistant` \| `agent` \| `system` \| `note` | Bubble layout. `note` and `system` are agent-only |
| `authorName` | string | Shown on the bubble |
| `body` | string | Plain text |
| `at` | ISO-8601 | Time |

### Canned replies

Hardcoded in the client today. No API is required unless they become editable.

| Shortcut | Title |
| --- | --- |
| `/hi` | Greeting. Body may contain `{{name}}`, replaced with the customer’s first name |
| `/track` | Tracking update |
| `/refund` | Refund started |
| `/hold` | Please hold |
| `/close` | Closing |

---

## API surface

Auth is the existing CTS session. Enforce the permission on each route, then enforce ownership.

Mutations that change status or queue placement return the updated conversation, the new message when one was written, and any other conversations whose `queuedForId` changed.

Conflicts return `409` with the current conversation: already taken, not the owner, closed, target missing, or the caller is no longer the queued agent. The client replaces its copy from that payload.

### Desk

`GET /live-chat/me`

```json
{ "id": "user-id", "name": "Agent Name", "role": "agent", "limit": 6, "accepting": true }
```

`PATCH /live-chat/me`

Body: `{ "accepting"?: boolean, "limit"?: number }`. Agents may change only themselves. Limit outside 1–12 is `400`. Response includes the member and any conversations whose `queuedForId` changed.

`GET /live-chat/members`

Roster for transfer and the Team tab. Agents need id, name, role, and accepting. Admins also need limit, queued, and taken.

`PATCH /live-chat/members/:id`

Admin only. Body: `{ "limit": number }`. Then rebalance.

### Conversations

`GET /live-chat/conversations?inbox=user_queue|active|team|closed&q=`

Inbox rows for the caller. `team` is admin-only; others get an empty list or `403`.

`GET /live-chat/conversations/:id`

Full conversation plus messages. `404` when the caller cannot see it.

`POST /live-chat/conversations/:id/read`

Set `unread` to 0 for this viewer.

`POST /live-chat/conversations/:id/take`

`POST /live-chat/conversations/:id/transfer`

Body: `{ "memberId": "user-id" }`.

`POST /live-chat/conversations/:id/resolve`

`POST /live-chat/conversations/:id/reopen`

`POST /live-chat/conversations/:id/messages`

Body: `{ "body": "text", "kind": "reply" | "note" }`. Reject empty bodies and bodies that still start with `/`.

### Inbound from the assistant

Not called by the dashboard.

`POST /live-chat/handoffs`

Create `waiting` with the pre-handoff transcript, reason, AI summary, customer, order, visit context, and tags. Run placement and push the result to connected desks.

Also accept, on an existing conversation:

- a new customer message (increments `unread` for agents who are not viewing it, sets `typing` false, bumps `updatedAt`)
- customer typing start and stop
- visit updates (`location`, `currentPage`, `browser`, `referrer`, `visits`)

### Realtime

Push to every desk allowed to see the change:

| Event | When |
| --- | --- |
| `conversation.created` | Handoff placed |
| `conversation.updated` | Status, owner, queue, unread, typing, or visit changed |
| `message.created` | Any new message, including system and note |
| `member.updated` | Accepting or limit changed |
| `queue.rebalanced` | Several `queuedForId` values moved together |

### Summary counts

Include on the list response or on `GET /live-chat/summary`:

- Per-inbox counts for the caller. Admin Team count is active chats owned by others.
- For admins: waiting total, active total, resolved total, unassigned waiting count, accepting count, and per member `{ queued, taken, limit, accepting }`.

---

## Client-only behavior

These stay in the browser and need no API:

- Which of the open chats is the main panel vs a side window. Side windows are Active-tab chats only. Other inboxes open in the main panel
- The 5-chat open cap
- Hiding Take over outside the Active inbox, including on a waiting chat opened from User Queue. A side window of a chat assigned to the viewer can still take it over. The API still requires `queuedForId` to be the caller
- Unsent drafts
- Canned-reply picker state
- Customer-details panel open or closed
