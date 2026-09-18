const SESSION_STORAGE_KEY = "rdx-shopper-session-id";
const INVALID_SESSION_IDS = new Set(["", "anon", "string"]);

let memorySessionId: string | null = null;

function createShopperId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `shopper_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

export function isValidSessionId(value: string | null | undefined): boolean {
  const id = value?.trim() ?? "";
  return !INVALID_SESSION_IDS.has(id.toLowerCase());
}

export function getShopperSessionId(): string {
  if (typeof sessionStorage !== "undefined") {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (isValidSessionId(stored)) return stored as string;
    const next = createShopperId();
    sessionStorage.setItem(SESSION_STORAGE_KEY, next);
    return next;
  }
  if (!isValidSessionId(memorySessionId)) {
    memorySessionId = createShopperId();
  }
  return memorySessionId as string;
}
