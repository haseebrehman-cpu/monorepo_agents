import { useEffect, type RefObject } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

export function getFocusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter((el) => el.tabIndex !== -1);
}

/**
 * Modal keyboard behavior: move focus in, trap Tab, close on Escape,
 * restore focus to the launcher on unmount/close.
 */
export function useDialogFocus({
  isOpen,
  onClose,
  panelId,
  launcherRef,
}: {
  isOpen: boolean;
  onClose: () => void;
  panelId: string;
  launcherRef: RefObject<HTMLButtonElement | null>;
}) {
  useEffect(() => {
    if (!isOpen) return;

    const panel = document.getElementById(panelId);
    if (!panel) return;
    const dialog: HTMLElement = panel;

    const launcher = launcherRef.current;
    const initial = getFocusableElements(dialog);
    (initial[0] ?? dialog).focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const nodes = getFocusableElements(dialog);
      if (nodes.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === dialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      launcher?.focus();
    };
  }, [isOpen, onClose, panelId, launcherRef]);
}
