import type { ChatCitation } from "@rdx/chat-contract";
import { isAllowedChatHref } from "@/lib/url-allowlist";

export default function CitationList({ citations }: { citations: ChatCitation[] }) {
  const items = citations
    .map((citation) => {
      const href = citation.source_uri || citation.url || "";
      return {
        title: citation.title || href,
        href: isAllowedChatHref(href) ? href : null,
      };
    })
    .filter((item) => item.title);

  if (items.length === 0) return null;

  return (
    <ul className="mt-2 space-y-1 text-left">
      {items.map((item, index) => (
        <li key={`${item.title}-${index}`} className="text-[11px] text-slate-500">
          {item.href ? (
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-rdx-red"
            >
              {item.title}
            </a>
          ) : (
            item.title
          )}
        </li>
      ))}
    </ul>
  );
}
