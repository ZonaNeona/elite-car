import { test, expect } from "@playwright/test";
test("under hood: anchor navigation in an already open app", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Открыть как собственник", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Обзор бизнеса." })).toBeVisible({ timeout: 30000 });
  await page.goto("/#under");
  await expect(page.getByRole("heading", { name: "Под капотом." })).toBeVisible();
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Обзор бизнеса." })).toBeVisible();
});
test("under hood: real RAG, role-bound agent, n8n trace, themes and mobile", async ({
  page,
  context,
}) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page
    .getByRole("button", { name: "Под капотом · RAG, AI-агент и интеграции" })
    .click();
  await expect(page.getByRole("heading", { name: "Под капотом." })).toBeVisible(
    { timeout: 30000 },
  );
  await expect(page).toHaveURL(/#under$/);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Под капотом." })).toBeVisible();
  await expect(
    page.getByRole("tab", { name: "Карта системы" }),
  ).toHaveAttribute("aria-selected", "true");
  await page.screenshot({
    path: "reports/under-map-light.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Для инженера", exact: true }).click();
  await expect(page.getByText("OpenAPI ↗")).toBeVisible();
  await page.getByRole("tab", { name: "RAG-песочница" }).click();
  await page
    .getByRole("button", {
      name: "Какие документы нужны водителю?",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Запустить", exact: true }).click();
  await expect(page.locator(".uh-answer")).toBeVisible({ timeout: 65000 });
  await expect(page.locator(".uh-answer")).toContainText(/паспорт/i);
  await expect(
    page.getByText("Проверка ссылок", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "reports/under-rag-light.png",
    fullPage: true,
  });
  await page.getByRole("tab", { name: "Агент", exact: true }).click();
  await page
    .getByRole("button", { name: "Сколько я должен?", exact: true })
    .click();
  await page.getByRole("button", { name: "Запустить", exact: true }).click();
  await expect(page.locator(".uh-answer")).toBeVisible({ timeout: 65000 });
  await expect(page.locator(".uh-trace")).toContainText("get_balance");
  await page.screenshot({
    path: "reports/under-agent-light.png",
    fullPage: true,
  });
  await page.getByRole("tab", { name: "Интеграции", exact: true }).click();
  await page.getByRole("button", { name: "Запустить", exact: true }).click();
  await expect(page.locator(".uh-runs [data-status=done]").first()).toBeVisible(
    { timeout: 35000 },
  );
  await expect(page.locator(".uh-reconcile")).toContainText("3 расхождений");
  await page.getByRole("button", { name: "Проиграть по узлам" }).click();
  await page.screenshot({
    path: "reports/under-integrations-light.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Сегодня", exact: true }).click();
  await expect(page.locator(".uh-sources-widget")).toContainText("Завершено");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: "reports/under-dashboard-light.png", fullPage: true });
  await page.locator(".sidebar").getByRole("button", { name: "Под капотом", exact: true }).click();
  await page.getByRole("tab", { name: "Журнал", exact: true }).click();
  await expect(page.locator(".uh-log-row").first()).toBeVisible();
  await page.screenshot({
    path: "reports/under-log-light.png",
    fullPage: true,
  });
  // Theme control comes from the existing app, not a separate laboratory theme.
  const theme = page.getByRole("button", { name: /тёмн.*тем/i });
  await theme.click();
  for (const [tab, file] of [
    ["Карта системы", "map"],
    ["RAG-песочница", "rag"],
    ["Агент", "agent"],
    ["Интеграции", "integrations"],
    ["Журнал", "log"],
  ]) {
    await page.getByRole("tab", { name: tab, exact: true }).click();
    await page.screenshot({
      path: `reports/under-${file}-dark.png`,
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [tab, file] of [["Карта системы","map"],["RAG-песочница","rag"],["Агент","agent"],["Интеграции","integrations"],["Журнал","log"]]) {
    await page.getByRole("tab", { name: tab, exact: true }).click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({path:`reports/under-mobile-${file}-dark.png`,fullPage:true});
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  }
  expect(errors).toEqual([]);
});
