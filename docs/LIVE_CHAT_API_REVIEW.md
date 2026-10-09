# Live Chat API guide vs desk flow

Review of the staging **Live Chat API — Developer Guide** against `docs/LIVE_CHAT.md` and the CTS desk in `apps/cts-dashboard/src/pages/dashboard/LiveChat/`.

**Verdict:** accurate enough for the desk’s CRUD and inbox rules. Not complete enough for the full documented flow.

The two docs do different jobs. `docs/LIVE_CHAT.md` is the desk contract (permissions, UI rules, balancer, realtime). The API guide is a staging HTTP catalog. Most routes line up. A few contracts would still make the dashboard behave wrong.

---

## What matches the live-chat flow

Lifecycle, inboxes, and mutations match the desk.

| Flow | Desk / `LIVE_CHAT.md` | API guide |
| --- | --- | --- |
| Statuses | `waiting` → take → `active` → close → `resolved` → reopen | Same |
| User Queue | Every `waiting` chat; no take | Same |
| Active | Waiting assigned to me + owned `active` | Same |
| Team / Closed | Admin sees others’ active + all closed; agent sees own closed | Same |
| Take | Only if `waiting` and `queuedForId` is the caller | Same, `409` otherwise |
| Reply / note | Reply: owner of `active`. Note: any non-resolved chat you can see | Same |
| Transfer / resolve / reopen | Owner-only | Same |
| Limit | 1–12, load = queued + taken | Same |
| Balancer intent | Accepting, lowest load, name tie-break, `queuedForId = null` when full | Same at a high level |
| Summary | Inbox badges + admin Team stats | `GET /summary` covers this |

System message wording also matches the desk (`took`, `transferred`, `closed by`, `reopened`).

For a first integration of list / thread / take / reply / transfer / close, this is usable.

---

## Where it is not accurate enough

### 1. Permissions are missing

The desk does not treat “support admin vs agent” as the only gate.

- Route: `live_chat.access`
- Reply / notes: `live_chat.reply`
- Take, transfer, reopen, presence: `live_chat.assign`
- Close: `live_chat.resolve`
- CTS **super admin** has no live-chat access
- CTS **admin** currently gets every permission (`isAdminUser`)

The API guide only has: headers present, support-member profile exists, `role === admin` for Team / edit-other-limits.

`LIVE_CHAT.md` is explicit: a user can **see** a chat and still be blocked from reply, take, or close. If staging only checks member role, a read-only agent cannot be represented.

Also, admin in the UI today is **CTS `admin`**, while the API admin is **`core_supportmember.role`**. Those can diverge unless you map them on purpose.

### 2. IDs: the desk still assumes one viewer id

`LIVE_CHAT.md` says the member id is the authenticated user id. The sample desk uses `VIEWER_ID = "you"`.

The API splits:

- `X-Staff-User-Id` / `staffUserId` → `aud_...`
- member id → `sm_...`
- conversation id → `lc_...`

That is fine, but the client must use **`GET /me`.id** for `queuedForId` / `ownerId` / transfer targets, not the staff-user id. The guide should say that in one sentence.

### 3. Realtime and post-handoff customer events are absent

`LIVE_CHAT.md` requires:

- `conversation.created` / `updated`
- `message.created`
- `member.updated`
- `queue.rebalanced`
- new customer messages after handoff (unread++, `typing` false)
- typing start/stop
- visit updates

The conversation **shape** includes `typing`, `unread`, `location`, `currentPage`, `visits`, `browser`, `referrer`. The API only documents **create handoff**. There is no way for those fields to change after the chat is on the desk, except agent actions.

Without that, Active tabs, unread badges, and “customer is typing” cannot stay live. Polling `/conversations` would be a workaround; the flow doc assumes push.

### 4. `409` payload will break the documented client strategy

`LIVE_CHAT.md`:

> Conflicts return `409` with the current conversation. The client replaces its copy from that payload.

The API guide:

```json
{ "detail": "conflict:not_active" }
```

That is not enough. On take / reply / transfer races the desk needs the **current conversation** (or it must refetch). Either change the API or tell the client to refetch on every `409`.

### 5. Search and `lastMessage` are narrower than the desk

Desk search (`ConversationList.tsx`) matches:

- name, email, order number
- last non-system preview
- tag **labels** (`shipping`, `refund`, …)

The API `q` only lists name, email, order number.

List preview on the desk:

- skip `system`
- notes → `Note: {body}`
- no message → `Handed off from the AI assistant`

The API example is a raw customer string. If `lastMessage` is just the latest body, note previews and empty-handoff rows will look wrong.

### 6. Balancer section is a shortened version of the real rule

`assignment.ts` / `LIVE_CHAT.md` do a full rebalance:

1. Owned `active` chats keep slots and never move
2. Keep current `queuedForId` if that member is accepting and under limit
3. Everything else is **loose** (null, offline, over limit)
4. Place loose chats oldest-first onto lowest load
5. Offline / limit change releases **waiting** assignments only
6. Take does **not** free a slot
7. Reopen **always succeeds**, even over limit, then waiting chats are shed
8. Transfer **to an offline member is allowed**; their waiting assignments may be released

The API section only says: new handoff → lowest load; on a free slot, oldest **unassigned** chat fills it.

That last point is the risky one. If the server only fills `queuedForId === null` and does not reassign chats whose agent went offline or had their limit lowered, User Queue / Active will not match the desk. `queueChanges` on `PATCH /me` implies a full rebalance — the prose should match that.

### 7. Small contract mismatches vs `LIVE_CHAT.md`

| Topic | Flow doc | API guide |
| --- | --- | --- |
| Bad limit | `400` | `422` — prefer the API; update `LIVE_CHAT.md` |
| Team inbox for a non-admin | empty or `403` | not specified |
| `GET /me` | id, name, role, limit, accepting | also `queued`, `taken`, `tenantId`, `staffUserId` — fine, extra |
| Take response | conversation + message + `queueChanges` | no `queueChanges` (usually empty, but inconsistent) |
| Auth | CTS session JWT | staging headers — OK if you keep the “prod uses JWT” note |

`POST /handoffs` as assistant-only is correct. The desk “New handoff” button is local demo data only.

---

## Before wiring the real dashboard

Lock these:

1. CTS permissions vs support-member `role`
2. Viewer id = `sm_...` from `/me`
3. Realtime (or documented polling) plus customer message / typing / visit updates
4. `409` includes the conversation, or clients always refetch
5. Search + `lastMessage` rules
6. Full rebalance (keep assignment, offline/limit release, reopen-over-limit, transfer-to-offline)

Until those are written down, the API guide is a good staging cheat sheet, not a replacement for `docs/LIVE_CHAT.md`.
