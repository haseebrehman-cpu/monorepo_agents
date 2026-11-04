import type { SupportReply } from "@rdx/chat-contract";
import { describe, expect, it } from "vitest";
import { liveChatHandoffFromReply } from "./handoff";

const reply = (handoff: SupportReply["handoff"]): SupportReply =>
  ({ text: "Passed to the team.", handoff }) as SupportReply;

describe("liveChatHandoffFromReply", () => {
  it("opens a live chat from the handoff id when the channel is LiveChat", () => {
    expect(
      liveChatHandoffFromReply(
        reply({
          reference: "a8c30f68-25d6-450a-8d57-51cf34381491",
          channel: "LiveChat",
          handoff_id: "a8c30f68-25d6-450a-8d57-51cf34381491",
        }),
        true,
      ),
    ).toEqual({
      handoffId: "a8c30f68-25d6-450a-8d57-51cf34381491",
      reference: "a8c30f68-25d6-450a-8d57-51cf34381491",
      token: null,
    });
  });

  it("keeps a token that the assistant already passed through", () => {
    const session = liveChatHandoffFromReply(
      reply({
        reference: "ref",
        channel: "LiveChat",
        handoff_id: "id",
        customer_token: "jwt",
      }),
      true,
    );
    expect(session?.token).toBe("jwt");
  });

  it("stays on the assistant when live chat is off or the reply is not a live channel", () => {
    const handoff = {
      reference: "ref",
      channel: "Email",
      handoff_id: "id",
    };
    expect(liveChatHandoffFromReply(reply(handoff), true)).toBeNull();
    expect(
      liveChatHandoffFromReply(
        reply({ ...handoff, channel: "LiveChat" }),
        false,
      ),
    ).toBeNull();
  });
});
