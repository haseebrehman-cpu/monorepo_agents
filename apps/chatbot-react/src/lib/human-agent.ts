function normalize(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const EXACT = new Set([
  "human",
  "agent",
  "human agent",
  "live agent",
  "real person",
  "real human",
  "customer service",
  "customer support",
  "live support",
  "live chat",
]);

const ASK =
  /\b(?:talk|speak|chat|connect|transfer|escalate|escalation|handoff|hand off|switch|reach|get)\b(?:\s+\w+){0,8}\s+\b(?:a\s+|an\s+|the\s+|me\s+to\s+|me\s+with\s+)?(?:real\s+|live\s+|human\s+|actual\s+)?(?:human|person|agent|someone|somebody|representative|operator|advisor|adviser|support)\b/;

/** True when the shopper is asking for a person rather than the assistant. */
export function isHumanAgentRequest(text: string): boolean {
  const normalized = normalize(text);
  if (!normalized || normalized.length > 180) return false;
  if (EXACT.has(normalized)) return true;

  const stripped = normalized
    .replace(
      /^(?:please\s+)?(?:(?:can|could|would|may)\s+(?:you|u|i)\s+)?(?:please\s+)?(?:i\s+(?:want|need|would like|d like)\s+(?:to\s+)?)?/,
      "",
    )
    .replace(/\s+please$/, "")
    .trim();

  if (EXACT.has(stripped)) return true;

  return (
    ASK.test(normalized) ||
    /\b(?:human|live|real|actual)\s+(?:agent|person|human)\b/.test(normalized) ||
    /\b(?:need|want)\s+(?:a\s+|an\s+)?(?:human|person|agent|someone)\b/.test(
      normalized,
    ) ||
    /\bcustomer\s+(?:service|support)\b/.test(normalized)
  );
}

/** True when an assistant reply is offering or starting a person handoff. */
export function isHumanHandoffResponse(text: string): boolean {
  const normalized = normalize(text);
  if (!normalized || normalized.length > 800) return false;
  return (
    /\b(?:connect(?:ing)? you|transfer(?:ring)? you|hand(?:ing)? you|put you through|escalat\w*)\b[\s\S]{0,48}\b(?:human|person|agent|representative|someone|support)\b/.test(
      normalized,
    ) ||
    /\b(?:human|live)\s+agent\b/.test(normalized) ||
    /\ba (?:real )?person (?:will|can) (?:take over|help|assist)\b/.test(
      normalized,
    )
  );
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidHandoffContact(name: string, email: string): boolean {
  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  return (
    trimmedName.length >= 1 &&
    trimmedName.length <= 80 &&
    trimmedEmail.length <= 120 &&
    EMAIL.test(trimmedEmail)
  );
}

/** Message sent to the assistant so the existing escalation path can start. */
export function buildHumanHandoffMessage(
  name: string,
  email: string,
  context?: string,
): string {
  const parts = [
    "I need to talk to a human agent.",
    `My name is ${name.trim()}.`,
    `My email is ${email.trim()}.`,
  ];
  const extra = context?.trim() ?? "";
  const wordCount = extra ? normalize(extra).split(" ").length : 0;
  const alreadyCovered = Boolean(extra) && isHumanAgentRequest(extra) && wordCount <= 8;
  if (extra && !alreadyCovered) parts.push(extra);
  return parts.join(" ");
}
