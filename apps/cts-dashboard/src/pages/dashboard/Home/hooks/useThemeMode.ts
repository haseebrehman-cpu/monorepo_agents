import { useSyncExternalStore } from "react";
import type { ThemeMode } from "../types";

/** The UI kit's dark variant is driven by a `.dark` class on an ancestor; the root is the convention. */
function readMode(): ThemeMode {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

export function useThemeMode(): ThemeMode {
  return useSyncExternalStore(subscribe, readMode, () => "light");
}
