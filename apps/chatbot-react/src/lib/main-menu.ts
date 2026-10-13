const EXACT = new Set([
  "m",
  "menu",
  "menus",
  "main menu",
  "mainmenu",
  "the menu",
  "the main menu",
]);

function normalize(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** True when the shopper is asking for the main menu, not a product answer. */
export function isMainMenuRequest(text: string): boolean {
  const normalized = normalize(text);
  if (!normalized || normalized.length > 80) return false;
  if (EXACT.has(normalized)) return true;

  const stripped = normalized
    .replace(
      /^(?:please\s+)?(?:(?:can|could|would)\s+(?:you|u)\s+)?(?:please\s+)?/,
      "",
    )
    .replace(/\s+please$/, "")
    .trim();

  if (EXACT.has(stripped)) return true;

  return /^(?:show|open|display|view|see|give me|get me|bring up|pull up|i want|i need|id like|take me to|go to|go back to|back to|return to|back|what is|whats|where is|wheres)\s+(?:me\s+)?(?:back\s+to\s+)?(?:the\s+|a\s+)?(?:main\s+)?menus?$/.test(
    stripped,
  );
}
