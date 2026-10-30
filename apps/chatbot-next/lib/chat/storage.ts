type StorageKind = "local" | "session";

function storage(kind: StorageKind): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function readJson<T>(kind: StorageKind, key: string): T | undefined {
  const raw = storage(kind)?.getItem(key);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

export function writeJson(kind: StorageKind, key: string, value: unknown): void {
  try {
    storage(kind)?.setItem(key, JSON.stringify(value));
  } catch {
    // Quota or privacy mode: the chat still works, it just isn't restored on reload.
  }
}

export function removeItem(kind: StorageKind, key: string): void {
  storage(kind)?.removeItem(key);
}
