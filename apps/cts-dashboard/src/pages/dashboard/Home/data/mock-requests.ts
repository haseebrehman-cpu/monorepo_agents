import { MODULES, REQUEST_TYPES } from "../constants";
import { addDays, DAY_MS, HOUR_MS, startOfDay } from "../lib/date";
import type {
  Currency,
  RequestEvent,
  RequestRecord,
  RequestStatus,
  RequestType,
  SalesChannel,
} from "../types";

/** Reference time for all mock data, so relative timestamps stay consistent. */
export const MOCK_NOW = new Date();

const HISTORY_DAYS = 180;

/** Earliest day covered by the mock data; bounds the custom date range. */
export const MOCK_HISTORY_START = addDays(startOfDay(MOCK_NOW), -(HISTORY_DAYS - 1));

const DAILY_VOLUME: Record<RequestType, number> = {
  tracking: 48,
  refund: 16,
  return: 11,
  resend: 8,
};

/** Share of settled requests that end negatively (rejected or failed). */
const NEGATIVE_RATE: Record<RequestType, number> = {
  tracking: 0.06,
  refund: 0.14,
  return: 0.11,
  resend: 0.08,
};

const FIRST_NAMES = [
  "Oliver", "Amelia", "Harry", "Isla", "Jack", "Ava", "Noah", "Mia", "Leo", "Grace",
  "Arthur", "Freya", "Oscar", "Sophia", "George", "Lily", "Muhammad", "Emily", "Theo", "Ella",
  "Charlie", "Poppy", "Jacob", "Evie", "Thomas", "Ivy", "Lucas", "Chloe", "Henry", "Hannah",
  "Aarav", "Zara", "Daniel", "Sara", "Mateo", "Lena", "Lukas", "Camille", "Hugo", "Elena",
];

const LAST_NAMES = [
  "Smith", "Jones", "Taylor", "Brown", "Williams", "Wilson", "Johnson", "Davies", "Patel", "Robinson",
  "Wright", "Thompson", "Evans", "Walker", "White", "Roberts", "Green", "Hall", "Wood", "Jackson",
  "Clarke", "Khan", "Hughes", "Edwards", "Turner", "Murphy", "O'Brien", "Müller", "Schmidt", "Dubois",
  "Martin", "Bernard", "García", "Fernández", "de Vries", "Jansen", "Rossi", "Ahmed", "Kowalski", "Byrne",
];

const EMAIL_DOMAINS = ["gmail.com", "outlook.com", "yahoo.co.uk", "icloud.com", "hotmail.com", "proton.me"];

const AGENTS = ["Ayesha Khan", "Daniel Price", "Maria Lopez", "Omar Siddiqui", "Chloe Bennett", "Ravi Patel"];

const CHANNELS: readonly [SalesChannel, number][] = [
  ["Website", 0.46],
  ["Amazon", 0.31],
  ["eBay", 0.15],
  ["TikTok Shop", 0.08],
];

const COUNTRIES: readonly [string, Currency, number][] = [
  ["United Kingdom", "GBP", 0.58],
  ["Germany", "EUR", 0.1],
  ["France", "EUR", 0.08],
  ["Ireland", "EUR", 0.07],
  ["Netherlands", "EUR", 0.06],
  ["Spain", "EUR", 0.05],
  ["United States", "USD", 0.06],
];

const COURIERS: Record<string, readonly string[]> = {
  "United Kingdom": ["Royal Mail", "Evri", "DPD", "DHL Express"],
  "United States": ["UPS", "FedEx", "DHL Express"],
  default: ["DHL Express", "DPD", "UPS", "GLS"],
};

const REASONS: Record<RequestType, readonly string[]> = {
  tracking: [
    "Where is my order",
    "Delayed delivery",
    "Tracking not updating",
    "Marked delivered, not received",
    "Delivery address query",
  ],
  refund: [
    "Item damaged on arrival",
    "Item not received",
    "Wrong item sent",
    "Order cancelled before dispatch",
    "Late delivery compensation",
  ],
  return: ["Changed mind", "Wrong size", "Faulty item", "Not as described", "Duplicate order"],
  resend: [
    "Lost in transit",
    "Damaged in transit",
    "Returned to sender",
    "Missing item in parcel",
    "Address corrected by customer",
  ],
};

/** Relative weight of request creation by hour of day (business-hours peak). */
const HOUR_WEIGHTS = [
  0.2, 0.1, 0.08, 0.06, 0.06, 0.1, 0.3, 0.6, 1.1, 1.6, 1.9, 2, 1.8, 1.9, 2, 1.8, 1.6, 1.4, 1.2, 1.1,
  1, 0.9, 0.6, 0.35,
];

const EVENT_NOTES: Record<RequestType, Record<RequestStatus, string>> = {
  tracking: {
    pending: "Tracking request logged from customer enquiry",
    processing: "Courier confirmed parcel is in transit",
    completed: "Courier confirmed delivery",
    rejected: "Request closed as duplicate",
    failed: "Courier could not locate the parcel",
  },
  refund: {
    pending: "Refund claim submitted",
    processing: "Refund sent to payment provider",
    completed: "Refund approved and issued",
    rejected: "Claim did not meet refund policy",
    failed: "Payment provider declined the refund",
  },
  return: {
    pending: "Return request submitted",
    processing: "Return approved, label sent to customer",
    completed: "Item received and inspected",
    rejected: "Return window had expired",
    failed: "Return label could not be generated",
  },
  resend: {
    pending: "Replacement requested",
    processing: "Replacement picked at warehouse",
    completed: "Replacement dispatched",
    rejected: "Resend not approved",
    failed: "Item out of stock at warehouse",
  },
};

/** Mulberry32: tiny deterministic PRNG so mock data is stable between reloads. */
function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = createRandom(20261030);

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(random() * items.length)];
}

function pickWeighted<T extends readonly unknown[]>(items: readonly T[], weightIndex: number): T {
  const total = items.reduce((sum, item) => sum + (item[weightIndex] as number), 0);
  let roll = random() * total;
  for (const item of items) {
    roll -= item[weightIndex] as number;
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

function pickHour(maxHour: number): number {
  const weights = HOUR_WEIGHTS.slice(0, maxHour + 1);
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let roll = random() * total;
  for (let hour = 0; hour < weights.length; hour += 1) {
    roll -= weights[hour];
    if (roll <= 0) return hour;
  }
  return maxHour;
}

function negativeStatus(type: RequestType): RequestStatus {
  return MODULES[type].statuses.includes("rejected") ? "rejected" : "failed";
}

/** Younger requests are more likely to still be open. */
function statusForAge(type: RequestType, ageHours: number): RequestStatus {
  const roll = random();
  const negative = NEGATIVE_RATE[type];
  if (ageHours < 6) return roll < 0.62 ? "pending" : "processing";
  if (ageHours < 48) {
    if (roll < 0.28) return "pending";
    if (roll < 0.7) return "processing";
    return roll < 0.7 + negative * 0.6 ? negativeStatus(type) : "completed";
  }
  if (ageHours < 24 * 7) {
    if (roll < 0.08) return "pending";
    if (roll < 0.3) return "processing";
    return roll < 0.3 + negative ? negativeStatus(type) : "completed";
  }
  if (roll < 0.015) return "pending";
  if (roll < 0.05) return "processing";
  return roll < 0.05 + negative ? negativeStatus(type) : "completed";
}

function clampToNow(time: number): Date {
  return new Date(Math.min(time, MOCK_NOW.getTime()));
}

function buildHistory(
  type: RequestType,
  status: RequestStatus,
  createdAt: Date,
  assignee: string,
): RequestEvent[] {
  const notes = EVENT_NOTES[type];
  const events: RequestEvent[] = [
    { status: "pending", at: createdAt, note: notes.pending, actor: "Customer portal" },
  ];
  if (status === "pending") return events;

  const age = MOCK_NOW.getTime() - createdAt.getTime();
  const processingAt = clampToNow(createdAt.getTime() + Math.min(age * 0.35, (2 + random() * 20) * HOUR_MS));
  const reachedProcessing = status === "processing" || status === "completed" || random() < 0.6;
  if (reachedProcessing) {
    events.push({ status: "processing", at: processingAt, note: notes.processing, actor: assignee });
  }
  if (status === "processing") return events;

  const settledAt = clampToNow(
    processingAt.getTime() + Math.min(age * 0.5, (6 + random() * 110) * HOUR_MS),
  );
  events.push({
    status,
    at: settledAt,
    note: notes[status],
    actor: status === "failed" ? "System" : assignee,
  });
  return events;
}

function buildAmount(type: RequestType): number | null {
  if (type === "refund") return Math.round((9 + random() * random() * 280) * 100) / 100;
  if (type === "return") return Math.round((14 + random() * random() * 210) * 100) / 100;
  return null;
}

interface DraftRecord extends Omit<RequestRecord, "id" | "orderId"> {
  orderSeed: number;
}

function draftsForDay(type: RequestType, dayStart: Date, daysAgo: number): DraftRecord[] {
  const weekday = dayStart.getDay();
  const weekendFactor = weekday === 0 ? 0.62 : weekday === 6 ? 0.74 : weekday === 1 ? 1.12 : 1;
  const growth = 0.86 + 0.14 * (1 - daysAgo / HISTORY_DAYS);
  const noise = 0.84 + random() * 0.32;
  const isToday = daysAgo === 0;
  const maxHour = isToday ? MOCK_NOW.getHours() : 23;
  const elapsedShare = isToday
    ? HOUR_WEIGHTS.slice(0, maxHour + 1).reduce((sum, weight) => sum + weight, 0) /
      HOUR_WEIGHTS.reduce((sum, weight) => sum + weight, 0)
    : 1;
  const count = Math.round(DAILY_VOLUME[type] * weekendFactor * growth * noise * elapsedShare);

  const drafts: DraftRecord[] = [];
  for (let index = 0; index < count; index += 1) {
    const hour = pickHour(maxHour);
    const createdAt = clampToNow(
      dayStart.getTime() + hour * HOUR_MS + Math.floor(random() * 60) * 60 * 1000 + Math.floor(random() * 60) * 1000,
    );
    const ageHours = (MOCK_NOW.getTime() - createdAt.getTime()) / HOUR_MS;
    const status = statusForAge(type, ageHours);
    const assignee = pick(AGENTS);
    const history = buildHistory(type, status, createdAt, assignee);
    const firstName = pick(FIRST_NAMES);
    const lastName = pick(LAST_NAMES);
    const [country, currency] = pickWeighted(COUNTRIES, 2);
    const emailName = `${firstName}.${lastName}`.toLowerCase().normalize("NFD").replace(/[^a-z.]/g, "");

    drafts.push({
      type,
      customerName: `${firstName} ${lastName}`,
      customerEmail: `${emailName}@${pick(EMAIL_DOMAINS)}`,
      status,
      createdAt,
      updatedAt: history[history.length - 1].at,
      channel: pickWeighted(CHANNELS, 1)[0],
      country,
      courier: pick(COURIERS[country] ?? COURIERS.default),
      reason: pick(REASONS[type]),
      amount: buildAmount(type),
      currency,
      assignee,
      history,
      // Orders are placed a few days before the request is raised.
      orderSeed: createdAt.getTime() - (1 + random() * 9) * DAY_MS,
    });
  }
  return drafts;
}

function generateRequests(): RequestRecord[] {
  const today = startOfDay(MOCK_NOW);
  const drafts: DraftRecord[] = [];
  for (let daysAgo = HISTORY_DAYS - 1; daysAgo >= 0; daysAgo -= 1) {
    const dayStart = addDays(today, -daysAgo);
    for (const type of REQUEST_TYPES) drafts.push(...draftsForDay(type, dayStart, daysAgo));
  }
  drafts.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const sequence: Record<RequestType, number> = { tracking: 48210, refund: 17340, return: 9120, resend: 6050 };
  const firstOrderTime = Math.min(...drafts.map((draft) => draft.orderSeed));

  return drafts.map(({ orderSeed, ...draft }) => {
    sequence[draft.type] += 1;
    const orderNumber = 4_100_000 + Math.floor((orderSeed - firstOrderTime) / 12_000);
    return {
      ...draft,
      id: `${MODULES[draft.type].idPrefix}-${sequence[draft.type]}`,
      orderId: `ORD-${orderNumber}`,
    };
  });
}

/** Sorted by creation time, oldest first. */
export const MOCK_REQUESTS: readonly RequestRecord[] = generateRequests();
