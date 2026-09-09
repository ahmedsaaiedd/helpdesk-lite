import { expect, test } from "@playwright/test";

const password = "HelpDesk123!";

async function login(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}

async function signOut(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Open user menu" }).click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login/);
}

test.describe.configure({ mode: "serial" });

test("employee creates a persistent request and can find it", async ({ page }) => {
  await login(page, "employee@helpdesklite.local");
  await expect(page).toHaveURL(/\/employee$/);
  await page.getByRole("link", { name: "New request", exact: true }).first().click();
  await page.getByLabel(/Title/).fill("Printer queue pauses after every document");
  await page.getByLabel(/Description/).fill("The third-floor printer completes one document, then the Windows queue changes to paused until I resume it manually.");
  await page.getByRole("combobox", { name: /Category/ }).click();
  await page.getByRole("option", { name: "IT Hardware" }).click();
  await page.getByRole("button", { name: "Create request" }).click();
  await expect(page).toHaveURL(/\/employee\/requests\//);
  await expect(page.getByText("Printer queue pauses after every document")).toBeVisible();
  await signOut(page);
});

test("support can claim, update, and resolve a ticket", async ({ page }) => {
  await login(page, "support@helpdesklite.local");
  await expect(page).toHaveURL(/\/support$/);
  await page.getByRole("link", { name: "Ticket Queue" }).click();
  await page.getByLabel("Search tickets").fill("Printer queue pauses");
  await expect(page.getByText("Printer queue pauses after every document")).toBeVisible();
  await page.getByText("Printer queue pauses after every document").click();
  await page.getByRole("button", { name: "Take ownership" }).click();
  await page.getByLabel("Progress update").fill("The queue policy was reset and a test page completed successfully.");
  await page.getByRole("button", { name: "Post update" }).click();
  await page.getByRole("button", { name: "Resolve ticket" }).click();
  await page.getByPlaceholder("Optional resolution note").fill("Printer queue is stable after the policy reset.");
  await page.getByRole("button", { name: "Resolve", exact: true }).click();
  await expect(page.getByText("Resolution complete")).toBeVisible();
  await signOut(page);
});

test("employee sees the support resolution and cannot open protected areas", async ({ page }) => {
  await login(page, "employee@helpdesklite.local");
  await page.getByRole("link", { name: "My Requests" }).click();
  await page.getByLabel("Search tickets").fill("Printer queue pauses");
  await page.getByText("Printer queue pauses after every document").click();
  await expect(page.getByText("Resolved", { exact: true })).toBeVisible();
  await expect(page.getByText("Printer queue is stable after the policy reset.")).toBeVisible();
  await page.goto("/support/tickets");
  await expect(page).toHaveURL(/\/forbidden/);
});

test("manager can inspect open work, workload, and unassigned requests", async ({ page }) => {
  await login(page, "manager@helpdesklite.local");
  await expect(page).toHaveURL(/\/manager$/);
  await page.getByRole("link", { name: "Open Requests" }).click();
  await expect(page.getByRole("heading", { name: "Open Requests" })).toBeVisible();
  await page.getByRole("link", { name: "Team Workload" }).click();
  await expect(page.getByRole("heading", { name: "Team Workload" })).toBeVisible();
  await page.getByRole("link", { name: "Unassigned" }).click();
  await expect(page.getByRole("heading", { name: "Unassigned" })).toBeVisible();
});
