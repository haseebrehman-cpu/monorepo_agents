import type { SupportSource } from "@rdx/chat-contract";
import { isSafeHref } from "@/lib/chat/links";
import { ExternalIcon } from "./icons";

export default function SourceList({ sources }: { sources: SupportSource[] }) {
  const links = sources.filter((source) => isSafeHref(source.url));
  if (links.length === 0) return null;

  return (
    <div className="mt-3 border-t border-neutral-100 pt-2">
      <p className="text-[10px] font-semibold tracking-[0.12em] text-neutral-400 uppercase">Sources</p>
      <ul className="mt-1 flex flex-wrap gap-1.5">
        {links.map((source) => (
          <li key={source.url}>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-700 transition hover:bg-rdx-red/10 hover:text-rdx-red"
            >
              {source.title || new URL(source.url).hostname}
              <ExternalIcon className="h-3 w-3" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
