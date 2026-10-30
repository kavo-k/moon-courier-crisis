import { expect, test } from "@playwright/test";
import type { GameSnapshot } from "../src/types/game";

test.beforeEach(async ({ request }) => {
  expect((await request.post("/api/game/reset")).ok()).toBeTruthy();
});

test("preview, animation, reload, completion, End Day and Reset", async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Лунный сектор" }),
  ).toBeVisible();
  await page.locator(".order-card").filter({ hasText: "Mining Site" }).click();
  await page.locator(".rover-card").filter({ hasText: "Scout" }).click();
  await expect(
    page.getByText(/Груз превышает допустимую вместимость/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Запустить доставку" }),
  ).toBeDisabled();
  await page.screenshot({
    path: "../docs/screenshots/impossible-delivery.png",
    fullPage: true,
  });

  await page
    .locator(".order-card")
    .filter({ hasText: "Alpha Station" })
    .click();
  await page.locator(".rover-card").filter({ hasText: "Pathfinder" }).click();
  await expect(
    page.getByRole("button", { name: "Запустить доставку" }),
  ).toBeEnabled();
  await page.screenshot({
    path: "../docs/screenshots/dashboard.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Запустить доставку" }).click();
  await expect(
    page.getByRole("heading", { name: "Активные доставки" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Завершить день" }),
  ).toBeDisabled();
  await page.reload();
  await expect(page.locator(".delivery-result")).toContainText(
    "Доставка выполнена",
  );
  await expect(page.locator(".active-panel")).toHaveCount(0);
  const snapshot = (await (
    await request.get("/api/game")
  ).json()) as GameSnapshot;
  expect(snapshot.game.money).toBe(240);
  expect(snapshot.stats.successfulDeliveries).toBe(1);
  await page.screenshot({
    path: "../docs/screenshots/delivery-result.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Завершить день" }).click();
  await expect(page.locator(".day-panel h2")).toHaveText("День 2 / 5");
  for (let day = 2; day < 5; day++) {
    await page.getByRole("button", { name: "Завершить день" }).click();
    await expect(page.locator(".day-panel h2")).toHaveText(
      `День ${day + 1} / 5`,
    );
  }
  await page.getByRole("button", { name: "Подвести итоги" }).click();
  await expect(
    page.getByRole("heading", { name: "Миссия не удалась." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Новая игра", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Продолжить игру" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Новая экспедиция" }).click();
  await page.getByRole("button", { name: "Начать заново" }).click();
  await expect(page.locator(".game-finale")).toHaveCount(0);
  await expect(page.locator(".day-panel h2")).toHaveText("День 1 / 5");
  await expect(page.locator(".order-card")).toHaveCount(5);
  expect(errors).toEqual([]);
});

test("mobile layout, empty log, and network error recovery", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".moon-map")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "../docs/screenshots/mobile.png",
    fullPage: true,
  });
  await page.route("**/api/game", (route) => route.abort());
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Связь с базой потеряна" }),
  ).toBeVisible();
  await page.unroute("**/api/game");
  await page.getByRole("button", { name: "Повторить подключение" }).click();
  await expect(
    page.getByRole("heading", { name: "Лунный сектор" }),
  ).toBeVisible();
});

test("failed automatic completion can be retried without duplicate launch", async ({
  page,
  request,
}) => {
  let launches = 0;
  page.on("request", (req) => {
    if (req.method() === "POST" && req.url().endsWith("/api/deliveries"))
      launches++;
  });
  await page.route("**/api/deliveries/*/complete", (route) => route.abort());
  await page.goto("/");
  await page
    .locator(".order-card")
    .filter({ hasText: "Alpha Station" })
    .click();
  await page.locator(".rover-card").filter({ hasText: "Pathfinder" }).click();
  const launch = page.getByRole("button", { name: "Запустить доставку" });
  await expect(launch).toBeEnabled();
  await launch.evaluate((button) => {
    if (button instanceof HTMLButtonElement) {
      button.click();
      button.click();
    }
  });
  await expect(page.getByRole("alert")).toContainText("Нет связи с базой");
  expect(launches).toBe(1);
  await expect(page.locator(".active-mission")).toHaveCount(1);
  await page.unroute("**/api/deliveries/*/complete");
  await page.getByRole("button", { name: "Повторить завершение" }).click();
  await expect(page.locator(".delivery-result")).toContainText(
    "Доставка выполнена",
  );
  expect(
    ((await (await request.get("/api/game")).json()) as GameSnapshot).game
      .money,
  ).toBe(240);
});

test("a five-day strategy can win using only the public API", async ({
  page,
  request,
}) => {
  for (let day = 1; day <= 5; day++) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const snapshot = (await (
        await request.get("/api/game")
      ).json()) as GameSnapshot;
      let selection: { orderId: number; roverId: number } | undefined;
      const orders = snapshot.orders
        .filter((order) => order.status === "AVAILABLE")
        .sort((a, b) => b.reward - a.reward);
      for (const order of orders) {
        for (const rover of snapshot.rovers) {
          const response = await request.post("/api/deliveries/preview", {
            data: { orderId: order.id, roverId: rover.id },
          });
          const preview = (await response.json()) as { possible: boolean };
          if (preview.possible) {
            selection = { orderId: order.id, roverId: rover.id };
            break;
          }
        }
        if (selection) break;
      }
      if (!selection) break;
      const response = await request.post("/api/deliveries", {
        data: selection,
      });
      expect(response.status()).toBe(201);
      const delivery = (await response.json()) as { id: number };
      expect(
        (await request.post(`/api/deliveries/${delivery.id}/complete`)).ok(),
      ).toBeTruthy();
    }
    expect(
      (
        await request.post("/api/game/end-day", { data: { expectedDay: day } })
      ).ok(),
    ).toBeTruthy();
  }
  const final = (await (await request.get("/api/game")).json()) as GameSnapshot;
  expect(final.game.status).toBe("WON");
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Миссия выполнена." }),
  ).toBeVisible();
  await page.screenshot({
    path: "../docs/screenshots/mission-complete.png",
    fullPage: true,
  });
});
