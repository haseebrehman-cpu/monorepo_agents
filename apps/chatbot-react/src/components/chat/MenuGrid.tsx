import type { SVGProps } from "react";
import { OPTIONS, type MenuOption } from "./constants";

interface MenuGridProps {
  disabled: boolean;
  onSelect: (option: MenuOption) => void;
}

function MenuArt(props: SVGProps<SVGSVGElement>) {
  return <svg fill="none" className="rdx-menu-art" aria-hidden="true" {...props} />;
}

function MenuGlyph({ id }: { id: string }) {
  switch (id) {
    case "track-order":
      return (
        <MenuArt viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="22" fill="#FFF0F1" />
          <path d="M12 17L24 10L36 16.5L24 23.5Z" fill="white" stroke="#202127" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M12 17V31L24 38V23.5Z" fill="white" stroke="#202127" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M24 23.5L36 16.5V30.5L24 38Z" fill="white" stroke="#202127" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M18 20.5V29L24 32.5" stroke="#DF2429" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </MenuArt>
      );
    case "find-products":
    case "product-info":
      return (
        <MenuArt viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="22" fill="#FFECEE" />
          <circle cx="21" cy="20.5" r="9.5" stroke="#DF2429" strokeWidth="3.2" />
          <path d="M28 28L35.5 35.5" stroke="#DF2429" strokeWidth="3.5" strokeLinecap="round" />
        </MenuArt>
      );
    case "refund-return":
      return (
        <MenuArt viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="22" fill="#FFF0F1" />
          <path d="M16 25a8.5 8.5 0 1 0 2.4-6" stroke="#DF2429" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16 14.5V21h6.5" stroke="#DF2429" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </MenuArt>
      );
    case "damaged-product":
      return (
        <MenuArt viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#FFF0F1" />
          <path
            d="M50 18 C66 18 80 24 80 36 C80 56 66 74 50 82 C34 74 20 56 20 36 C20 24 34 18 50 18 Z"
            fill="#E53935"
          />
          <path d="M53 32 L42 50 H50 L45 66 L61 46 H52 Z" fill="#FFFFFF" />
        </MenuArt>
      );
    default:
      return (
        <MenuArt viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#FFF0F1" />
          <path d="M32 50 C32 36 68 36 68 50" fill="none" stroke="#202127" strokeWidth="5" strokeLinecap="round" />
          <rect x="26" y="46" width="11" height="20" rx="4" fill="#DF2429" />
          <rect x="63" y="46" width="11" height="20" rx="4" fill="#DF2429" />
        </MenuArt>
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
