import type { ReactNode } from "react";
import { isSafeHref } from "@/lib/chat/links";

const INLINE_PATTERN = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\)|https?:\/\/[^\s<>()]+[^\s<>().,!?;:'"])/g;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  return text.split(INLINE_PATTERN).map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={key} className="font-semibold text-neutral-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
    if (link) {
      const [, label, href] = link;
      return isSafeHref(href) ? (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-rdx-red underline underline-offset-2 hover:text-rdx-red-hover"
        >
          {label}
        </a>
      ) : (
        <span key={key}>{label}</span>
      );
    }
    if (/^https?:\/\//.test(part) && isSafeHref(part)) {
      return (
        <a
          key={key}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium break-all text-rdx-red underline underline-offset-2 hover:text-rdx-red-hover"
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

type Block =
  | { kind: "p"; lines: string[] }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[]; start: number };

function parseBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  for (const raw of source.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trim();
    const last = blocks.at(-1);
    if (!line) {
      blocks.push({ kind: "p", lines: [] });
      continue;
    }
    const bullet = /^[-*•]\s+(.*)$/.exec(line);
    const numbered = /^(\d+)[.)]\s+(.*)$/.exec(line);
    if (bullet) {
      if (last?.kind === "ul") last.items.push(bullet[1]);
      else blocks.push({ kind: "ul", items: [bullet[1]] });
    } else if (numbered) {
      if (last?.kind === "ol") last.items.push(numbered[2]);
      else blocks.push({ kind: "ol", items: [numbered[2]], start: Number(numbered[1]) });
    } else if (last?.kind === "p") {
      last.lines.push(line);
    } else {
      blocks.push({ kind: "p", lines: [line] });
    }
  }
  return blocks.filter((b) => (b.kind === "p" ? b.lines.length > 0 : true));
}

export default function Markdown({ content }: { content: string }) {
  const blocks = parseBlocks(content);
  return (
    <div className="space-y-2 text-[13px] leading-relaxed text-neutral-700">
      {blocks.map((block, index) => {
        const key = `b${index}`;
        if (block.kind === "ul") {
          return (
            <ul key={key} className="list-disc space-y-1 pl-4 marker:text-rdx-red">
              {block.items.map((item, i) => (
                <li key={i}>{renderInline(item, `${key}-${i}`)}</li>
              ))}
            </ul>
          );
        }
        if (block.kind === "ol") {
          return (
            <ol
              key={key}
              start={block.start}
              className="list-decimal space-y-1 pl-4 marker:font-semibold marker:text-neutral-900"
            >
              {block.items.map((item, i) => (
                <li key={i}>{renderInline(item, `${key}-${i}`)}</li>
              ))}
            </ol>
          );
        }
        return (
          <p key={key}>
            {block.lines.map((line, i) => (
              <span key={i}>
                {i > 0 && <br />}
                {renderInline(line, `${key}-${i}`)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
