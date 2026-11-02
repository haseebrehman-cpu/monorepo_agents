import { describe, expect, it } from "vitest";
import { createRefreshGate } from "./refresh-gate.ts";

describe("createRefreshGate", () => {
  it("runs one refresh for overlapping failures, then allows the next expiry", async () => {
    let calls = 0;
    let release: () => void = () => undefined;
    const refreshOnce = createRefreshGate(
      () =>
        new Promise<void>((resolve) => {
          calls += 1;
          release = resolve;
        })
    );

    const first = refreshOnce();
    const second = refreshOnce();
    const third = refreshOnce();
    expect(calls).toBe(1);

    release();
    await Promise.all([first, second, third]);

    const next = refreshOnce();
    release();
    await next;
    expect(calls).toBe(2);
  });
});
