import sanitizeHtml from "sanitize-html";

const COLOR = [/^#[0-9a-f]{3,8}$/i, /^rgba?\(\s*[\d.\s,%]+\)$/i, /^[a-z]+$/i];

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "a",
    "b",
    "blockquote",
    "br",
    "div",
    "em",
    "font",
    "i",
    "li",
    "ol",
    "p",
    "s",
    "span",
    "strike",
    "strong",
    "sub",
    "sup",
    "u",
    "ul",
  ],
  allowedAttributes: {
    a: ["href", "rel", "target"],
    font: ["color", "size"],
    div: ["align", "style"],
    p: ["align", "style"],
    span: ["style"],
    li: ["style"],
  },
  allowedStyles: {
    "*": {
      color: COLOR,
      "background-color": COLOR,
      "text-align": [/^(left|right|center|justify|start|end)$/],
      "font-size": [/^\d+(\.\d+)?(px|em|rem|%)$/, /^(x{0,2}-)?(small|large)$|^medium$/],
      "font-weight": [/^(normal|bold|\d{3})$/],
      "font-style": [/^(normal|italic)$/],
      "text-decoration": [/^[a-z\s-]+$/],
      "text-decoration-line": [/^[a-z\s-]+$/],
    },
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowProtocolRelative: false,
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }),
  },
};

/** Strips markup the rich-text editor cannot produce (scripts, handlers, iframes, unsafe URLs). */
export function sanitizeRichText(html: string | null | undefined): string {
  if (!html) return "";
  return sanitizeHtml(html, OPTIONS);
}
