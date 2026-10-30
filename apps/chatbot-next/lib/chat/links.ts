const SAFE_PROTOCOLS = new Set(["https:", "http:", "mailto:"]);

export function isSafeHref(href: string | null | undefined): href is string {
  if (!href) return false;
  try {
    return SAFE_PROTOCOLS.has(new URL(href).protocol);
  } catch {
    return false;
  }
}
