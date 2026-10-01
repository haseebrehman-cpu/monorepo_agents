/**
 * Product answers often repeat "1." and put price/stock bullets beside each
 * item. Markdown then starts a new ordered list for every product, so every
 * marker renders as 1. Renumber those items and nest the bullets under them
 * so they stay one list: 1, 2, 3…
 */
export function normalizeOrderedListNumbering(markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  let inFence = false;
  let inRun = false;
  let next = 0;
  let contentIndent = 0;

  return lines
    .map((line) => {
      if (/^(?:```|~~~)/.test(line)) {
        inFence = !inFence;
        inRun = false;
        return line;
      }
      if (inFence) return line;

      const ordered = line.match(/^(\d+)\.\s+/);
      if (ordered && /\S/.test(line.slice(ordered[0].length))) {
        next = inRun ? next + 1 : 1;
        inRun = true;
        const marker = `${next}. `;
        contentIndent = marker.length;
        return `${marker}${line.slice(ordered[0].length)}`;
      }

      if (!inRun) return line;
      if (line.trim() === "" || /^\s+\S/.test(line)) return line;

      if (/^[-*+]\s+\S/.test(line)) {
        return `${" ".repeat(contentIndent)}${line}`;
      }

      inRun = false;
      return line;
    })
    .join("\n");
}
