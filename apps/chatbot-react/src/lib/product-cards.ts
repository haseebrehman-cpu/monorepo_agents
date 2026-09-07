import type {
  ChatCitation,
  ChatMessage,
  ChatProductCard,
} from "@rdx/chat-contract";

const MARKDOWN_LINK = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/gi;
const MAX_PRODUCT_CARDS = 8;

function isProductHref(href: string): boolean {
  try {
    return /\/products\//i.test(new URL(href).pathname);
  } catch {
    return false;
  }
}

function handleFromUrl(href: string): string {
  try {
    const match = new URL(href).pathname.match(/\/products\/([^/?#]+)/i);
    return decodeURIComponent(match?.[1] ?? href).toLowerCase();
  } catch {
    return href.toLowerCase();
  }
}

function normalizeKey(product: Pick<ChatProductCard, "handle" | "url">): string {
  if (product.handle) return product.handle.toLowerCase();
  return handleFromUrl(product.url);
}

function asCard(partial: {
  title: string;
  url: string;
  handle?: string;
}): ChatProductCard {
  return {
    title: partial.title,
    url: partial.url,
    handle: partial.handle || handleFromUrl(partial.url),
    price_min: null,
    price_max: null,
    compare_at_min: null,
    compare_at_max: null,
    price_currency: "",
    promotions: null,
    availability: "",
    stock_status: "",
  };
}

function citationToCard(citation: ChatCitation): ChatProductCard | null {
  const url = citation.source_uri || citation.url || "";
  if (!url || !isProductHref(url)) return null;
  return asCard({
    title: citation.title?.trim() || handleFromUrl(url),
    url,
  });
}

function extractMarkdownProductCards(content: string): ChatProductCard[] {
  const cards: ChatProductCard[] = [];
  for (const match of content.matchAll(MARKDOWN_LINK)) {
    const title = match[1]?.trim();
    const url = match[2]?.trim();
    if (!title || !url || !isProductHref(url)) continue;
    cards.push(asCard({ title, url }));
  }
  return cards;
}

export function isProductCitation(citation: ChatCitation): boolean {
  const url = citation.source_uri || citation.url || "";
  return Boolean(url && isProductHref(url));
}

export function collectDisplayProducts(message: ChatMessage): ChatProductCard[] {
  const seen = new Set<string>();
  const cards: ChatProductCard[] = [];

  const add = (product: ChatProductCard | null | undefined) => {
    if (!product?.url || cards.length >= MAX_PRODUCT_CARDS) return;
    const key = normalizeKey(product);
    if (seen.has(key)) return;
    seen.add(key);
    cards.push(product);
  };

  for (const product of message.products ?? []) add(product);
  for (const citation of message.citations ?? []) add(citationToCard(citation));
  for (const product of extractMarkdownProductCards(message.content)) {
    add(product);
  }

  return cards;
}

export function nonProductCitations(
  citations: ChatCitation[] | undefined,
): ChatCitation[] {
  return (citations ?? []).filter((citation) => !isProductCitation(citation));
}

/** Remove product markdown links so they are not also shown as a link list. */
export function stripProductLinksFromAnswer(content: string): string {
  return content
    .replace(MARKDOWN_LINK, (full, _title, url: string) =>
      isProductHref(url) ? "" : full,
    )
    .replace(/^\s*(?:[-*]|•|\d+\.)\s*$/gm, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{2,}/g, "\n\n")
    .trim();
}
