const MENU_PHRASES = new Set([
  "m",
  "menu",
  "menus",
  "main menu",
  "mainmenu",
  "the menu",
  "the main menu",
  "show menu",
  "show me the menu",
  "back to menu",
  "go to menu",
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

export function isMainMenuRequest(text: string): boolean {
  const normalized = normalize(text).replace(/^please\s+|\s+please$/g, "");
  return MENU_PHRASES.has(normalized);
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}
