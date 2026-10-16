import type { SVGProps } from "react";
import { OPTIONS, type MenuOption } from "./constants";

interface MenuGridProps {
  disabled: boolean;
  onSelect: (option: MenuOption) => void;
}

function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
      {...props}
    />
  );
}

function MenuGlyph({ id }: { id: string }) {
  switch (id) {
    case "track-order":
      return (
        <Icon>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 8.5 12 4l8.5 4.5L12 13 3.5 8.5Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 8.5V16L12 20.5 20.5 16V8.5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 13v7.5" />
        </Icon>
      );
    case "find-products":
      return (
        <Icon>
          <circle cx="11" cy="11" r="6.5" />
          <path strokeLinecap="round" d="m16 16 4 4" />
        </Icon>
      );
    case "product-info":
      return (
        <Icon>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 3.5h7l4.5 4.5V20a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 20V5A1.5 1.5 0 0 1 7 3.5Z" />
          <path strokeLinecap="round" d="M14 3.5V8h4.5M8.5 12.5h7M8.5 16h5" />
        </Icon>
      );
    case "refund-return":
      return (
        <Icon>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 1 0 2.1-5.2" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 4.5v4h4" />
        </Icon>
      );
    case "damaged-product":
      return (
        <Icon>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.5 5 6.5v5.2c0 4.2 2.9 7.1 7 8.8 4.1-1.7 7-4.6 7-8.8V6.5L12 3.5Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.5v4.2M12 15.8h.01" />
        </Icon>
      );
    default:
      return (
        <Icon>
          <path strokeLinecap="round" d="M4 13a8 8 0 0 1 16 0" />
          <rect x="3" y="12.5" width="4" height="6" rx="1.3" />
          <rect x="17" y="12.5" width="4" height="6" rx="1.3" />
          <path strokeLinecap="round" d="M19 16.2v1.3a3 3 0 0 1-3 3h-2.2" />
        </Icon>
      );
  }
}

function Chevron({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={`rdx-menu-chevron ${className} h-4 w-4 shrink-0 text-neutral-400`} aria-hidden="true">
      <path d="m7.5 4.5 5 5.5-5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function MenuGrid({ disabled, onSelect }: MenuGridProps) {
  return (
    <div className="rdx-menu-grid" role="group" aria-label="How can we help">
      {OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onSelect(option)}
          disabled={disabled || !option.enabled}
          className="rdx-menu-card"
        >
          <span className="rdx-menu-icon">
            <MenuGlyph id={option.id} />
          </span>
          <span className="rdx-menu-copy">
            <span className="rdx-menu-label rdx-menu-label-short">{option.label}</span>
            <span className="rdx-menu-label rdx-menu-label-full">{option.fullLabel}</span>
            <span className="rdx-menu-desc">{option.description}</span>
          </span>
          <Chevron className="rdx-menu-chevron-short" />
        </button>
      ))}
    </div>
  );
}
