import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto("http://localhost:5174/", { waitUntil: "networkidle" });

const checks = {};
checks.overviewHeading = await page.getByRole("heading", { name: "Overview" }).isVisible();
checks.mainNav = await page.getByRole("navigation", { name: "Main" }).isVisible();
checks.mainContent = await page.locator("#main-content").isVisible();
checks.userChip = await page.getByText("Admin").isVisible();
checks.placeholder = await page.getByText("Main content area").isVisible();

await page.screenshot({ path: "apps/dashboard/.verify-desktop.png", fullPage: true });

await page.getByRole("button", { name: "Conversations" }).click();
checks.conversationsHeading = await page
  .getByRole("heading", { name: "Conversations" })
  .isVisible();
checks.placeholderReady = await page
  .getByText("Content")
  .isVisible();

await page.getByRole("button", { name: "Collapse sidebar" }).click();
checks.expandControl = await page
  .getByRole("button", { name: "Expand sidebar" })
  .isVisible();
await page.screenshot({ path: "apps/dashboard/.verify-collapsed.png" });

await page.getByRole("button", { name: "Expand sidebar" }).click();

await page.setViewportSize({ width: 390, height: 844 });
checks.mobileMenu = await page.getByRole("button", { name: "Open navigation" }).isVisible();
checks.mobileNavHidden = !(await page.getByRole("button", { name: "Knowledge" }).isVisible());
await page.screenshot({ path: "apps/dashboard/.verify-mobile.png" });

await page.getByRole("button", { name: "Open navigation" }).click();
checks.mobileNavOpen = await page.getByRole("button", { name: "Knowledge" }).isVisible();
await page.screenshot({ path: "apps/dashboard/.verify-mobile-open.png" });

await page.getByRole("button", { name: "Settings" }).click();
checks.settingsHeading = await page.getByRole("heading", { name: "Settings" }).isVisible();
checks.drawerClosedAfterNav = !(await page
  .getByRole("button", { name: "Knowledge" })
  .isVisible());

console.log(JSON.stringify(checks, null, 2));
await browser.close();
