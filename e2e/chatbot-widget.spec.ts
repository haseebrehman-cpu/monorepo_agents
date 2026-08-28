import { expect, test } from "@playwright/test";

test("home page renders the shopping assistant", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /RDX Sports/i }),
  ).toBeVisible();
});

test("opens and closes the chat widget", async ({ page }) => {
  await page.goto("/");

  const launcher = page.getByRole("button", { name: "Toggle chat widget" });
  await expect(launcher).toBeVisible();
  await expect(launcher).toHaveAttribute("aria-expanded", "false");

  await launcher.click();

  await expect(launcher).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("dialog", { name: /assistant/i })).toBeVisible();
  await expect(page.getByText(/how can i help you today/i)).toBeVisible();
  await expect(page.getByRole("group", { name: "Quick options" })).toBeVisible();
  await expect(page.getByPlaceholder(/ask about gloves/i)).toBeVisible();

  await launcher.click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("closes the chat widget on Escape and returns focus to the launcher", async ({
  page,
}) => {
  await page.goto("/");

  const launcher = page.getByRole("button", { name: "Toggle chat widget" });
  await launcher.click();
  await expect(page.getByRole("dialog", { name: /assistant/i })).toBeVisible();

  await page.keyboard.press("Escape");

  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(launcher).toBeFocused();
});
