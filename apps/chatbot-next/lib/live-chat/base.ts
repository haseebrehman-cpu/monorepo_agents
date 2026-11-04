function normalize(value: string | null | undefined): string | null {
  const trimmed = value?.trim().replace(/\/+$/, "") ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

/** Inlined at `next build`. Empty in an image built without the Docker build arg. */
const fromBuild = normalize(process.env.NEXT_PUBLIC_LIVE_CHAT_API_BASE);

/** Set from the server at startup so a Coolify runtime variable still reaches the browser. */
let override: string | null = null;

export function setLiveChatApiBase(value: string | null | undefined) {
  override = normalize(value);
}

export function liveChatBase(): string | null {
  return override ?? fromBuild;
}

export function liveChatIsConfigured(): boolean {
  return liveChatBase() !== null;
}
