import type { SupportMenu, SupportMenuItem } from "@rdx/chat-contract";
import { ChevronRightIcon } from "./icons";

interface ReplyMenuProps {
  menu: SupportMenu;
  disabled: boolean;
  onSelect: (item: SupportMenuItem) => void;
}

export default function ReplyMenu({ menu, disabled, onSelect }: ReplyMenuProps) {
  return (
    <div className="mt-3">
      {menu.title && <p className="mb-2 text-xs font-semibold text-neutral-900">{menu.title}</p>}
      <div className="grid gap-1.5 group-data-[expanded=true]/panel:grid-cols-2">
        {menu.items.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(item)}
            className="group/item flex cursor-pointer items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-left transition hover:border-rdx-red/40 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-semibold text-neutral-900">{item.label}</span>
              {item.description && (
                <span className="block text-[11px] text-neutral-500">{item.description}</span>
              )}
            </span>
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-neutral-300 transition group-hover/item:text-rdx-red" />
          </button>
        ))}
      </div>
    </div>
  );
}
