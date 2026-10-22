# CTS dashboard: Tracking and Live Chat

This note is for the backend. It covers only the Tracking module (`/tracking`) and the Live Chat desk (`/live-chat`).

Tracking is wired to `cts-backend` today. Live Chat is not. The desk runs entirely in the browser on sample conversations. The Live Chat section describes the rules the UI already enforces, so a real service can match them.

Both modules sit behind the dashboard session cookie. Every request uses `credentials: include`. Responses use `{ success: true, data }` or `{ success: false, error }`.

---

## Tracking

Tracking is a courier-issue ticket desk. Agents log a shipment problem (order, courier, tracking number, issue), assign it to a department, and keep a history of replies and status changes. It is not a live courier-scan lookup.

Public ticket ids look like `CTS-0001`. The dashboard always sends that string (`ticket_number`), never the numeric database id. Detail responses also include `dbId` for internal use.

### Permissions

| Permission | What it unlocks |
| --- | --- |
| `tracking.access` | List, detail, options, status change, reply, attachment download |
| `tracking.add` | Create one ticket. Also accepted on `GET /api/tickets/options` |
| `tracking.add_bulk` | CSV / Excel upload |
| `tracking.delete` | Delete a ticket |

A user without `tracking.access` never reaches the page.

### Screens

| Route | What the agent does |
| --- | --- |
| `/tracking` | Filter, sort, page, change status inline, open or delete a ticket |
| `/tracking/:ticketId` | Read the ticket and its history, download files, add a reply |
| `/add-tickets` | Create one ticket |
| `/add-bulk-tickets` | Upload many tickets |

### List flow

```text
Open /tracking
  -> GET /api/tickets/options
  -> GET /api/tickets?page=0&pageSize=25&sortBy=ticketDate&sortDirection=desc
Agent applies filters
  -> same list call, page reset to 0, only non-empty filters sent
Agent changes a status cell
  -> PATCH /api/tickets/:ticketId  { status }
Agent opens a row
  -> /tracking/:ticketId
```

Default sort is newest ticket date first. Page size starts at 25. The API allows page size 1–100. `page` is zero-based.

Filters are exact matches, not search:

| Query param | Matches |
| --- | --- |
| `courier` | `tickets.courier` |
| `issue` | `tickets.issue` |
| `status` | `tickets.status` |
| `assignedTo` | department name, or the literal `Unassigned` when `assigned_department_id` is null |
| `createdBy` | creator user name |
| `modifiedBy` | last modifier user name |
| `fromDate` / `toDate` | `created_at`, inclusive calendar dates `YYYY-MM-DD`. `toDate` is exclusive of the next day |

Allowed `sortBy` values: `ticketDate`, `id`, `orderId`, `courier`, `trackingNumber`, `issue`, `status`, `assignedTo`, `createdBy`, `modifiedBy`, `closedBy`.

List item shape:

```json
{
  "id": "CTS-0001",
  "orderId": "IG-10482",
  "courier": "DHL",
  "trackingNumber": "1234567890",
  "issue": "In transit delay",
  "ticketDate": "2026-10-22T09:00:00.000Z",
  "status": "Not Started",
  "assignedTo": "Customer Support",
  "createdBy": "Ayesha Khan",
  "modifiedBy": "Ayesha Khan",
  "closedBy": ""
}
```

`assignedTo` is a department name. Empty assignment is shown as `Unassigned`.

The status cell is a dropdown from `options.statuses`. A row whose status is `Completed` cannot be edited in the grid. Changing the cell calls:

```http
PATCH /api/tickets/CTS-0001
Content-Type: application/json

{ "status": "In Progress" }
```

The new status must be an active lookup. If the lookup is marked closed, the backend sets `closed_by_id` and `closed_at` to the current user and now. Otherwise both are cleared. A `status_changed` event is stored. The same status sent again is a no-op.

### Options

`GET /api/tickets/options` fills every dropdown (filters, create form, reply form, status cell):

```json
{
  "couriers": ["DHL"],
  "issues": ["In transit delay"],
  "statuses": ["Not Started", "In Progress", "Completed"],
  "departments": [{ "id": 1, "name": "Customer Support" }],
  "users": [{ "id": 4, "name": "Ayesha Khan", "email": "ayesha@example.com", "department": "Customer Support" }]
}
```

Courier, issue, and status values come from active ticket lookups. Create and status change reject a label that is not active. Departments are every department. Users are active users; the list UI does not assign a ticket to a user.

### Create one ticket

`POST /api/tickets` is `multipart/form-data`.

| Field | Required | Notes |
| --- | --- | --- |
| `orderId` | yes | Unique, case-insensitive |
| `courier` | yes | Active courier lookup |
| `trackingNumber` | yes | Unique, case-insensitive |
| `issue` | yes | Active issue lookup |
| `comment` | no | HTML from the rich text editor. Stored as the opening comment |
| `assignedDepartmentId` | no | Omit or leave empty for Unassigned |
| `status` | no | Defaults to `Not Started` |
| `attachments` | no | Repeat the field. PNG, JPEG, or PDF. Max 10 files, 10 MB each |

On success the API returns the created ticket (same shape as detail, including `history`). The UI then returns to `/tracking`.

Duplicate order id returns `ORDER_ID_ALREADY_EXISTS`. Duplicate tracking number returns `TRACKING_NUMBER_ALREADY_EXISTS`. Unknown department returns `DEPARTMENT_NOT_FOUND`.

Insert also writes a `created` event. If the chosen status is a closed lookup, the creator is stored as `closed_by` immediately.

### Bulk upload

`POST /api/tickets/bulk` with a single form field `file`.

- CSV, `.xls`, or `.xlsx`. Max 5 MB, max 500 data rows.
- Required columns: `orderId`, `courier`, `trackingNumber`, `issue`.
- Optional: `comment` (alias `description`), `status`, `assignedDepartmentId` (alias `departmentId`), `assignedDepartment` (alias `department` / `departmentName`).
- Header matching ignores spaces, case, and punctuation. `order number` and `tracking no` are accepted.
- A status of `Open` is treated as `Not Started`.
- Department may be an id or a name. Name is resolved case-insensitively.
- The whole file is validated first. Any bad row rejects the upload and nothing is inserted.
- Order id and tracking number must be unique inside the file and against existing tickets.
- Success body: `{ totalRows, createdCount }`.

### Ticket detail

`GET /api/tickets/:ticketId` returns the list fields plus:

- `dbId`, `comment`, `assignedDepartmentId`, `createdByDepartment`
- `attachments` on the ticket itself: files uploaded at create time (`reply_id` is null)
- `history`: merged create event, replies, and status events, oldest first

History item:

```json
{
  "id": "reply-12",
  "kind": "reply",
  "authorName": "Ayesha Khan",
  "authorDepartment": "Customer Support",
  "assignedToName": "Warehouse",
  "assignedToDepartment": null,
  "bodyHtml": "<p>Asked the courier for a fresh scan.</p>",
  "fromStatus": null,
  "toStatus": null,
  "createdAt": "2026-10-22T10:00:00.000Z",
  "attachments": [
    { "id": 8, "fileName": "label.pdf", "mimeType": "application/pdf", "sizeBytes": 12000 }
  ]
}
```

`kind` is `created`, `reply`, or `status`.

- `created` carries the opening comment and the create-time attachments.
- `reply` carries the comment HTML, the department it was assigned to, and that reply’s files.
- `status` carries `fromStatus` and `toStatus` and no body.

The UI shows **Add reply** only when the signed-in user’s department name equals `assignedTo`. Anyone with `tracking.access` can still call the reply API; the department check is a dashboard rule.

### Reply

`POST /api/tickets/:ticketId/replies` is `multipart/form-data`.

| Field | Required | Notes |
| --- | --- | --- |
| `comment` | yes | HTML. Plain text after stripping tags must be non-empty |
| `assignedDepartmentId` | yes | Becomes the ticket’s new department |
| `attachments` | no | Same limits as create |

A reply does not change status. It sets `assigned_department_id` and `modified_by_id`, inserts `ticket_replies`, and attaches files to that reply. The response is the full ticket detail so the history can refresh.

On a `Completed` ticket the dashboard hides the department picker and resubmits the current department. The agent can still add a comment.

### Delete and files

`DELETE /api/tickets/:ticketId` needs `tracking.delete`. Related replies, events, and files go with the ticket.

`GET /api/tickets/attachments/:attachmentId` returns the file bytes. The dashboard downloads it with the session cookie and saves it under the stored file name. Attachment rows store `file_data` in the database.

### Tracking lifecycle

```text
Create (single or bulk)
  status defaults to Not Started
  assigned department optional
  created event + opening comment + files
        |
        v
List / detail
  another department can be assigned by a reply
  status moves through the lookup list
        |
        v
Status set to a closed lookup (the grid treats "Completed" as locked)
  closed_by and closed_at are set
  status cell can no longer be edited
  a reply can still be added by someone in the assigned department
        |
        v
Delete (tracking.delete only)
```

---

## Live Chat

Live Chat is the agent desk for chats that an AI assistant has already handed to a person. Route: `/live-chat`. Permission to open the page: `live_chat.access`.

There is no live-chat module in `cts-backend`. Conversations, the support roster, queue limits, and messages live in React state. Sample chats are created in `apps/cts-dashboard/src/pages/dashboard/LiveChat/sample-conversations.ts`. The **New handoff** button fabricates another waiting chat in the browser. Nothing is saved, and a refresh wipes it.

The customer chatbot is also separate. It can detect “I want a human” and collect a name and email, but it does not create a conversation this desk can see. A backend handoff has to be the bridge between that widget and this desk.

### Permissions

| Permission | Agent action |
| --- | --- |
| `live_chat.access` | Open the desk and read chats the visibility rules allow |
| `live_chat.reply` | Send a customer reply or save a private note |
| `live_chat.assign` | Take a waiting chat, transfer it, reopen it, and be treated as someone who can own chats |
| `live_chat.resolve` | Close an active chat they own |

Dashboard admins (`super_admin` / `admin`) see every chat and the Team tab. A normal agent does not.

### Conversation the desk expects

```ts
status: "waiting" | "active" | "resolved"

queuedForId: string | null   // set while waiting; the agent it is offered to
ownerId: string | null       // set once someone takes it; stays set after close

messages[].author: "customer" | "assistant" | "agent" | "system" | "note"
```

Other fields the panels render: `customerName`, `customerEmail`, `channel`, `orderNumber`, `handoffReason`, `aiSummary`, `handedOffAt`, `updatedAt`, `unread`, `tags`, `location`, `currentPage`, `visits`, `browser`, `referrer`, `typing`.

`note` messages are internal. They must not be delivered to the customer. `assistant` messages are the AI transcript from before the handoff. `system` messages are the audit lines the desk appends (“X took this conversation”, transfer, close, reopen).

Tags used by the UI: `shipping`, `refund`, `exchange`, `tracking`, `priority`.

### How a chat enters the desk

Intended path, once the backend exists:

```text
Customer asks the chatbot for a person
  -> chatbot collects name and email
  -> backend creates a conversation
       status = waiting
       ownerId = null
       transcript so far kept as assistant + customer messages
       handoffReason + aiSummary stored
  -> queue assignment (below) sets queuedForId
  -> agents with live_chat.access see it
```

Today the desk skips that path. **New handoff** builds a waiting conversation locally and runs the same assignment function.

### Queue assignment

Each support member has:

- `limit` from 1 to 12 (default in the sample team is 2–6)
- `accepting` true or false

Workload for the limit is **owned active chats + waiting chats queued to that person**. Closed chats do not count. Owned active chats are never moved.

`rebalance` runs after a handoff, take, transfer, resolve, reopen, limit change, or accepting toggle:

1. Waiting chats are ordered oldest `handedOffAt` first.
2. A waiting chat stays with `queuedForId` when that person is accepting and still under their limit.
3. Everyone else is unstuck: accepting members with free slots, fewest chats first, then name. The chat’s `queuedForId` is set to that person. Status stays `waiting`. `ownerId` stays null.
4. If every accepting person is full, `queuedForId` becomes null. The chat remains in User Queue and is not in anyone’s Active tab.

Turning accepting off pulls waiting chats out of that person’s Active tab and gives them to someone else with room, or leaves them unassigned.

### Inbox tabs

| Tab | Who sees it | Rows |
| --- | --- | --- |
| User Queue | Everyone | Every `waiting` chat, including ones queued to other people |
| Active | Everyone | `active` chats this agent owns, plus `waiting` chats queued to this agent |
| Team | Admins only | `active` chats owned by someone else |
| Closed | Everyone | `resolved`. Admins see all. Agents see only chats they own |

Search matches customer name, email, order number, and message text. It does not change status.

### Who can see a thread

- Admin: any conversation.
- Agent: every waiting chat, plus active or closed chats where `ownerId` is that agent.
- An agent cannot open another agent’s taken chat. Transfer removes it from their open windows.

Unread count drops to 0 while the thread is on screen (main panel, or an expanded side window). Minimized side windows do not mark the chat read. This is local today; the backend should persist read state per agent.

### Agent actions

All of these are local `setState` today. A backend should persist the same transition and append the system or agent message.

**Take** (`live_chat.assign`)

- Allowed when status is `waiting`, `queuedForId` is the current agent, and they can see the chat.
- Sets `status = active`, `ownerId = current agent`, `queuedForId = null`.
- Appends a system message: “{name} took this conversation.”
- After this, only that agent (and admins) can see it.
- The desk switches the inbox to Active.

**Reply** (`live_chat.reply`)

- Blocked when the chat is `resolved`.
- A customer-visible reply is blocked unless `ownerId` is the current agent. Take first.
- Private note uses the same permission and is also blocked on resolved chats, but it does not require ownership.
- Drafts that are empty or start with `/` are not sent. `/` opens canned replies.
- Author is `agent` or `note`. `updatedAt` becomes the message time. `typing` is cleared.

**Transfer** (`live_chat.assign`)

- Allowed when status is `active` and `ownerId` is the current agent.
- Target is another member, not yourself.
- Chat stays `active`. `ownerId` becomes the target. `queuedForId` stays null.
- System message: “{from} transferred this chat to {to}.”
- Then `rebalance` runs. The previous owner loses the thread under the visibility rule.

**Resolve** (`live_chat.resolve`)

- Allowed when status is `active` and `ownerId` is the current agent.
- Sets `status = resolved`. Owner is kept.
- System message: “Conversation closed by {name}.”
- Then `rebalance`, which frees a slot and can pull the oldest loose waiting chat into Active.

**Reopen** (`live_chat.assign`)

- Allowed when status is `resolved` and `ownerId` is the current agent.
- Sets `status = active`, `ownerId` stays the same agent, `queuedForId = null`.
- System message: “{name} reopened the conversation.”

**Accepting and limit**

- Any agent can toggle their own `accepting` flag and set their own limit (1–12).
- An admin can change any member’s limit from the Team tab.
- Both changes call `rebalance`.

Canned replies are hardcoded in the dashboard (`hi`, `track`, `refund`, `hold`, `close`). `{{name}}` is replaced with the customer’s first name. They are not loaded from the API.

### Several chats at once

An agent can keep 5 chats open. One is the main thread. The others are side windows, and only chats that belong in the Active tab are allowed to float. Waiting chats opened from User Queue, and closed chats, replace the main thread instead of floating. The 5-chat cap is a desk limit, not a queue limit.

### Team tab

Admins see counts of waiting, taken (active), closed, and how many people are accepting. Per person: queued waiting chats, taken active chats, workload against limit, and an editable limit. Status labels on that screen:

- Not accepting
- At limit (`workload >= limit` while accepting)
- Open

### What the backend needs to own

The dashboard can keep rendering and local window layout. These decisions should move to the server so two agents cannot take the same chat:

1. Create a waiting conversation when the chatbot hands off, including the AI transcript, reason, summary, and customer contact.
2. Run queue assignment with the same limit and accepting rules, and broadcast the result.
3. Enforce take, transfer, resolve, and reopen with the permission and ownership checks above. Reject a second take.
4. Store replies and private notes separately. Notes never go to the customer channel.
5. Fan out new customer messages, typing, and unread/read per agent.
6. Persist each member’s `limit` and `accepting` flag.
7. Hide other agents’ owned chats from non-admins.

Suggested status machine:

```text
waiting --take--> active --resolve--> resolved
   ^                 |                    |
   |                 +----transfer--------+
   |                 (stays active,
   |                  owner changes)
   |
   +----------reopen (back to active, same owner)
```

`queuedForId` changes only while status is `waiting`. `ownerId` is set on take and kept through transfer, resolve, and reopen.
