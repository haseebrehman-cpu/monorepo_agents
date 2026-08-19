import type { ChatAttachment } from "@rdx/chat-contract";
import { isAllowedChatHref } from "@/lib/url-allowlist";

interface SizeChartAttachmentProps {
  attachment: ChatAttachment;
}

export default function SizeChartAttachment({
  attachment,
}: SizeChartAttachmentProps) {
  if (attachment.kind !== "size_chart" || !isAllowedChatHref(attachment.url)) {
    return null;
  }

  const width = attachment.width ?? undefined;
  const height = attachment.height ?? undefined;

  return (
    <figure className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
      <figcaption className="border-b border-slate-200 px-3 py-2 text-left text-[12px] font-medium text-slate-700">
        Size chart — {attachment.productTitle}
      </figcaption>
      <img
        src={attachment.url}
        alt={attachment.altText}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className="mx-auto max-h-80 w-full bg-white object-contain p-2"
      />
      <div className="border-t border-slate-200 px-3 py-2 text-left">
        <a
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[12px] font-medium text-indigo-600 underline underline-offset-2 hover:text-indigo-500"
        >
          Open full size chart
        </a>
      </div>
    </figure>
  );
}
