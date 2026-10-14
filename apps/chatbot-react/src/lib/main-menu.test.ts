import { describe, expect, it } from "vitest";
import { isMainMenuRequest } from "./main-menu";

describe("isMainMenuRequest", () => {
  it.each([
    "m",
    "M",
    "menu",
    "Menu!",
    "main menu",
    "mainmenu",
    "the main menu",
    "show menu",
    "show the menu",
    "please show the main menu",
    "open main menu",
    "go to menu",
    "back to the menu",
    "can you show me the menu",
    "what's the menu",
    "menu please",
  ])("treats %j as a menu request", (text) => {
    expect(isMainMenuRequest(text)).toBe(true);
  });

  it.each([
    "boxing gloves",
    "show me gloves",
    "menu of boxing gloves",
    "track my order",
    "mm",
    "",
    "   ",
  ])("leaves %j for the assistant", (text) => {
    expect(isMainMenuRequest(text)).toBe(false);
  });
});
