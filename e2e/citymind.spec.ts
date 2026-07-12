import { test, expect } from "@playwright/test";

// Smoke walkthrough of the CityMind AI cockpit — proves the page renders RTL,
// the action queue → drawer flow works, and the LLM layer returns text
// (fallback "מוצג נוסח דמו" when no API key is configured).
test("CityMind cockpit — load, select, approve, LLM", async ({ page }) => {
  await page.goto("/citymind");

  // 4 core areas present
  await expect(page.getByRole("heading", { name: "CityMind AI" })).toBeVisible();
  await expect(page.getByText("פעולות מומלצות עכשיו")).toBeVisible();
  await expect(page.getByText("תמונת מצב עירונית חיה")).toBeVisible();
  await expect(page.getByText("אורות אדומים")).toBeVisible();
  await expect(page.getByText("מדד תחושת שירות")).toBeVisible();
  await page.screenshot({ path: "e2e/shots/1-cockpit.png" });

  // Open the details drawer via an action card
  await page.getByText("תגבור ניקיון בפארק הלאומי").first().click();
  await expect(page.getByText("שרשרת טיפול סגורה")).toBeVisible();
  await expect(page.getByText("שכבת LLM תפעולית")).toBeVisible();
  await page.screenshot({ path: "e2e/shots/2-drawer.png" });

  // LLM generation (resident update button lives only in the drawer).
  // Works live (Groq/Qwen) when a key is set, else shows the fallback badge.
  await page.getByRole("button", { name: "נסח עדכון לתושב" }).click();
  const generated = page.getByText(/נוצר על ידי LLM|מוצג נוסח דמו/);
  await expect(generated).toBeVisible({ timeout: 30000 });
  await generated.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await page.screenshot({ path: "e2e/shots/3-llm.png" });

  // Approve & close the loop
  await page.getByRole("button", { name: "אשר פעולה ושגר צוות" }).click();
  await expect(page.getByText("הפעולה אושרה ונשלחה לצוות")).toBeVisible();
  await page.screenshot({ path: "e2e/shots/4-approved.png" });
});
