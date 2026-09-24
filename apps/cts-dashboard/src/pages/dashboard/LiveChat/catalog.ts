export type CannedResponse = {
  id: string;
  shortcut: string;
  title: string;
  body: string;
};

export const CANNED: CannedResponse[] = [
  {
    id: "greet",
    shortcut: "hi",
    title: "Greeting",
    body: "Hi {{name}}, thanks for waiting. I have your chat now and I am looking into this.",
  },
  {
    id: "track",
    shortcut: "track",
    title: "Tracking update",
    body: "I checked the shipment. The last courier scan is still in transit, and I have asked them for a fresh update.",
  },
  {
    id: "refund",
    shortcut: "refund",
    title: "Refund started",
    body: "I have started the refund on this order. It should return to the original payment method in 5 to 7 business days.",
  },
  {
    id: "hold",
    shortcut: "hold",
    title: "Please hold",
    body: "I need a moment to check this with the warehouse. I will stay on this chat and reply as soon as I have an answer.",
  },
  {
    id: "close",
    shortcut: "close",
    title: "Closing",
    body: "Glad we could sort this out. I am closing the chat now. Reply here if anything else comes up.",
  },
];

export function fillCanned(body: string, customerName: string) {
  const first = customerName.split(" ")[0] || customerName;
  return body.replaceAll("{{name}}", first);
}

export type ChatTag = {
  id: string;
  label: string;
  className: string;
};

export const TAGS: ChatTag[] = [
  { id: "shipping", label: "Shipping", className: "bg-sky-50 text-sky-800 ring-sky-200" },
  { id: "refund", label: "Refund", className: "bg-rose-50 text-rose-800 ring-rose-200" },
  { id: "exchange", label: "Exchange", className: "bg-violet-50 text-violet-800 ring-violet-200" },
  { id: "tracking", label: "Tracking", className: "bg-amber-50 text-amber-900 ring-amber-200" },
  { id: "priority", label: "Priority", className: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
];

export function tagById(id: string) {
  return TAGS.find((tag) => tag.id === id) ?? null;
}
