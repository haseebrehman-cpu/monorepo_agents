import { isAllowedImageUrl } from "@/lib/url-allowlist";

interface SizeChartAttachmentProps {
  productTitle: string;
  url: string;
  altText: string;
  width?: number | null;
  height?: number | null;
}

export default function SizeChartAttachment({
  productTitle,
  url,
  altText,
  width,
  height,
}: SizeChartAttachmentProps) {
  if (!isAllowedImageUrl(url)) {
    return null;
  }

  return (
    <figure className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
      <figcaption className="border-b border-slate-200 px-3 py-2 text-left text-[12px] font-medium text-slate-700">
        Size chart — {productTitle}
      </figcaption>
      <img
        src={url}
        alt={altText}
        width={width ?? undefined}
        height={height ?? undefined}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className="rdx-size-chart mx-auto max-h-80 w-full bg-white object-contain p-2"
      />
      <div className="border-t border-slate-200 px-3 py-2 text-left">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[12px] font-medium text-rdx-red underline underline-offset-2 hover:text-rdx-red-hover"
        >
          Open full size chart
        </a>
      </div>
    </figure>
  );
}
