import { describe, expect, it } from "vitest";
import { createSseParser, type SseMessage } from "./sse";

function parse(...chunks: string[]): SseMessage[] {
  const messages: SseMessage[] = [];
  const parser = createSseParser((message) => messages.push(message));
  chunks.forEach((chunk) => parser.push(chunk));
  return messages;
}

describe("createSseParser", () => {
  it("reads named events with ids", () => {
    expect(parse('id: 7\nevent: message\ndata: {"a":1}\n\n')).toEqual([
      { event: "message", data: '{"a":1}', id: "7" },
    ]);
  });

  it("joins events split across chunks and skips comments and retry", () => {
    expect(parse("retry: 3000\n\n: ping\n\nevent: sta", "tus\ndata: x\r\n", "\r\n")).toEqual([
      { event: "status", data: "x", id: null },
    ]);
  });

  it("does not dispatch until the blank line arrives", () => {
    expect(parse("event: status\ndata: x\n")).toEqual([]);
  });
});
