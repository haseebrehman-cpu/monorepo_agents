import { useEffect, useId, useRef } from "react";
import { cn } from "@rdx/ui";
import { XIcon } from "lucide-react";
import type { SupportMember } from "./types";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600";

export default function TransferDialog({
  customerName,
  members,
  onClose,
  onTransfer,
}: {
  customerName: string;
  members: SupportMember[];
  onClose: () => void;
  onTransfer: (memberId: string) => void;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-pointer bg-slate-900/40"
        aria-label="Close transfer"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[min(28rem,calc(100%-2rem))] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div>
            <h2 id={titleId} className="text-sm font-semibold text-slate-900">
              Transfer chat
            </h2>
            <p className="mt-0.5 text-xs text-slate-600">
              {customerName} stays in the same thread. Only the person you choose can reply after this.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className={cn(
              "inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-slate-600 hover:bg-slate-100",
              focusRing,
            )}
            aria-label="Close transfer"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2" role="listbox" aria-label="Transfer to">
          {members.map((member) => (
            <button
              key={member.id}
              type="button"
              role="option"
              aria-selected={false}
              onClick={() => onTransfer(member.id)}
              className={cn("flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-slate-50", focusRing)}
            >
              <span>
                <span className="block text-sm font-medium text-slate-900">{member.name}</span>
                <span className="block text-xs text-slate-500">
                  {member.role === "admin" ? "Support admin" : "Agent"}
                  {member.accepting ? "" : " · Not accepting new handoffs"}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
