import ReactMarkdown from "react-markdown";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { normalizeOrderedListNumbering } from "@/lib/ordered-lists";
import { stripAssistantMedia } from "@/lib/sanitize";
import { isAllowedChatHref } from "@/lib/url-allowlist";

const schema = {
  ...defaultSchema,
  tagNames: (defaultSchema.tagNames ?? []).filter(
    (tag) => tag !== "img" && tag !== "script" && tag !== "iframe",
  ),
  attributes: {
    ...defaultSchema.attributes,
    a: ["href", "rel", "target"],
  },
};

export default function MessageContent({ content }: { content: string }) {
  const cleaned = normalizeOrderedListNumbering(stripAssistantMedia(content));

  return (
    <div className="rdx-chat-copy w-full text-left text-[11px] leading-relaxed text-slate-700">
      <ReactMarkdown
        rehypePlugins={[[rehypeSanitize, schema]]}
        urlTransform={(url) => (isAllowedChatHref(url) ? url : "")}
        components={{
          p: ({ children }) => (
            <p className="mb-2.5 text-left last:mb-0 text-xs">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-slate-900 text-xs">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-slate-700 text-xs">{children}</em>
          ),
          ul: ({ children }) => (
            <ul className="mb-2.5 list-disc space-y-1 pl-4 text-left last:mb-0 text-xs">
              {children}
            </ul>
          ),
          ol: ({ children, start }) => (
            <ol
              start={typeof start === "number" ? start : undefined}
              className="mb-3 list-decimal space-y-3 pl-4 text-left last:mb-0 text-xs"
            >
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="pl-0.5 text-left marker:font-semibold marker:text-slate-900 text-xs">
              {children}
            </li>
          ),
          a: ({ href, children }) =>
            href && isAllowedChatHref(href) ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-rdx-red underline underline-offset-2 hover:text-rdx-red-hover text-xs"
              >
                {children}
              </a>
            ) : (
              <span className="font-medium text-slate-800 text-xs">{children}</span>
            ),
          img: () => null,
          h1: ({ children }) => (
            <p className="mb-2 text-left text-[15px] font-semibold text-slate-900 text-xs">
              {children}
            </p>
          ),
          h2: ({ children }) => (
            <p className="mb-2 text-left text-[14px] font-semibold text-slate-900 text-xs">
              {children}
            </p>
          ),
          h3: ({ children }) => (
            <p className="mb-1.5 text-left text-[13.5px] font-semibold text-slate-900 text-xs">
              {children}
            </p>
          ),
          table: () => null,
          thead: () => null,
          tbody: () => null,
          tr: () => null,
          th: () => null,
          td: () => null,
        }}
      >
        {cleaned}
      </ReactMarkdown>
    </div>
  );
}
