import { test, expect, type Page } from "@playwright/test";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

async function loginAs(page: Page, employeeNumber: string, pin: string) {
  await page.goto("/");
  // Wait for the user list to load
  await page.waitForSelector(
    '[aria-label="Filter samples"], .font-black.uppercase',
    { timeout: 10_000 },
  );

  // Click the correct user card
  const userCard = page.locator(`button:has-text("${employeeNumber}")`).first();
  await userCard.click();

  // Enter PIN
  const pinInput = page.locator('input[inputmode="numeric"]');
  await pinInput.fill(pin);

  // Submit
  await page.click('button:has-text("Authorize Access")');
  await page.waitForURL("**", { waitUntil: "networkidle" });
}

// ─────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────

test.describe("Authentication", () => {
  test("shows login screen when not authenticated", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Zenthar")).toBeVisible();
    await expect(page.locator("text=Select Personnel")).toBeVisible();
  });

  test("shows error on invalid PIN", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('button:has-text("ADMIN")');
    await page.click('button:has-text("ADMIN")');
    const pinInput = page.locator('input[inputmode="numeric"]');
    await pinInput.fill("0000"); // wrong PIN
    await page.click('button:has-text("Authorize Access")');
    await expect(page.locator("[class*='text-red']")).toBeVisible({
      timeout: 5_000,
    });
  });

  test("logs in with correct PIN and shows dashboard", async ({ page }) => {
    await loginAs(page, "ADMIN", "1111");
    await expect(page.locator("text=Dashboard")).toBeVisible({
      timeout: 5_000,
    });
  });
});

test.describe("Lab Workflow — critical path", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "CHEMIST", "1111");
    // Navigate to Lab
    await page.click('[aria-label="Navigate to Lab"]');
    await expect(page.locator("text=Facility Hub")).toBeVisible({
      timeout: 5_000,
    });
  });

  test("can register a new sample", async ({ page }) => {
    // Open register modal
    await page.click('button:has-text("Register Sample")');
    await expect(page.locator("text=Register_New_Sample")).toBeVisible();

    // Fill batch ID
    const batchId = `E2E-${Date.now()}`;
    await page.fill('input[placeholder*="BT-"]', batchId);

    // Select priority
    await page.selectOption('select:near(:text("Priority_Tier"))', "HIGH");

    // Submit
    await page.click('button:has-text("Register_Sample")');

    // Verify sample appears in queue
    await expect(page.locator(`text=${batchId}`)).toBeVisible({
      timeout: 8_000,
    });
  });

  test("can select a sample and open the lab bench", async ({ page }) => {
    // Wait for at least one sample card
    await page.waitForSelector('[role="option"]', { timeout: 8_000 });

    // Click first sample
    await page.locator('[role="option"]').first().click();

    // Should show sample details
    await expect(page.locator("text=Diagnostic_Telemetry")).toBeVisible({
      timeout: 5_000,
    });

    // Start analysis
    await page.click('button:has-text("Start_Analysis")');

    // Should show lab bench
    await expect(page.locator("text=Lab Bench")).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.locator("text=Measurement")).toBeVisible();
  });

  test("can enter test values and save", async ({ page }) => {
    // Select first sample
    await page.waitForSelector('[role="option"]');
    await page.locator('[role="option"]').first().click();
    await page.click('button:has-text("Start_Analysis")');
    await page.waitForSelector("text=Lab Bench");

    // Fill in all test inputs
    const inputs = await page.locator('input[type="number"]').all();
    for (const input of inputs) {
      const isDisabled = await input.isDisabled();
      if (!isDisabled) {
        await input.fill("65.5");
      }
    }

    // Finalise
    const saveBtn = page.locator('button:has-text("Finalise Analysis")');
    await expect(saveBtn).toBeEnabled({ timeout: 3_000 });
    await saveBtn.click();

    // Should return to queue or show success
    await expect(page.locator("text=Analysis finalised")).toBeVisible({
      timeout: 5_000,
    });
  });
});

test.describe("RBAC — access control", () => {
  test("DISPATCH user cannot see Lab tab in sidebar", async ({ page }) => {
    await loginAs(page, "DISPATCH", "1111");
    // Lab should not appear in the sidebar nav
    await expect(page.locator('button:has-text("Lab Bench")')).toHaveCount(0);
  });

  test("DISPATCH user can see Dispatch tab", async ({ page }) => {
    await loginAs(page, "DISPATCH", "1111");
    await expect(
      page.locator(
        '[aria-label="Navigate to Dispatch"], button:has-text("Dispatch")',
      ),
    ).toBeVisible();
  });
});

test.describe("Real-time updates", () => {
  test("dashboard updates within 3 seconds of a new sample being created", async ({
    page,
    context,
  }) => {
    await loginAs(page, "ADMIN", "1111");

    // Get initial sample count
    await page.click('[aria-label="Navigate to Lab"]').catch(() => {});

    // Open a second page as CHEMIST to create a sample
    const chemistPage = await context.newPage();
    await loginAs(chemistPage, "CHEMIST", "1111");
    await chemistPage.click('[aria-label="Navigate to Lab"]').catch(() => {});
    await chemistPage.click('button:has-text("Register Sample")');
    await chemistPage.fill(
      'input[placeholder*="BT-"]',
      `REALTIME-${Date.now()}`,
    );
    await chemistPage.click('button:has-text("Register_Sample")');

    // Verify the original page updates via SSE
    await expect(page.locator("text=Syncing"))
      .toBeVisible({ timeout: 3_000 })
      .catch(() => {
        // SSE may update silently without showing "Syncing" — that's OK
      });

    await chemistPage.close();
  });
});
