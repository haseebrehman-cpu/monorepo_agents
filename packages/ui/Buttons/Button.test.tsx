import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Button from "./Button";

describe("Button", () => {
  it("renders its label", () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole("button", { name: "Save" })).toBeTruthy();
  });

  it("defaults to type=button", () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole("button", { name: "Save" })).toHaveProperty(
      "type",
      "button",
    );
  });

  it("forwards className and native attributes", () => {
    render(
      <Button className="extra" aria-label="Confirm" disabled>
        Save
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Confirm" });
    expect(button.className).toContain("extra");
    expect(button).toHaveProperty("disabled", true);
  });
});
