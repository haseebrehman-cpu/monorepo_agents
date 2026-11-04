export interface SseMessage {
  event: string;
  data: string;
  id: string | null;
}

/** Incremental `text/event-stream` parser. Feed it decoded chunks in order. */
export function createSseParser(onMessage: (message: SseMessage) => void) {
  let buffer = "";
  let event = "";
  let data: string[] = [];
  let id: string | null = null;

  function processLine(line: string) {
    if (line === "") {
      if (data.length > 0) onMessage({ event: event || "message", data: data.join("\n"), id });
      event = "";
      data = [];
      id = null;
      return;
    }
    if (line.startsWith(":")) return;
    const colon = line.indexOf(":");
    const field = colon < 0 ? line : line.slice(0, colon);
    let value = colon < 0 ? "" : line.slice(colon + 1);
    if (value.startsWith(" ")) value = value.slice(1);
    if (field === "event") event = value;
    else if (field === "data") data.push(value);
    else if (field === "id") id = value;
  }

  return {
    push(chunk: string) {
      buffer += chunk;
      let newline = buffer.indexOf("\n");
      while (newline >= 0) {
        const line = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);
        processLine(line.endsWith("\r") ? line.slice(0, -1) : line);
        newline = buffer.indexOf("\n");
      }
    },
  };
}
