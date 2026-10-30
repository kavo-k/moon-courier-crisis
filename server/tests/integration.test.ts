import test from "node:test";
import assert from "node:assert/strict";
import { createTestDatabase } from "./helpers/testDatabase.js";
import { applyMigrations } from "../src/db/migrationRunner.js";

test(
  "PostgreSQL game lifecycle, locks and rollback",
  { skip: process.env.RUN_DB_TESTS !== "1" },
  async (t) => {
    const db = await createTestDatabase();
    process.env.DATABASE_URL = db.connectionString;
    process.env.PGOPTIONS = db.options;
    const { pool } = await import("../src/db/pool.js");
    const { getGameSnapshot, endDay, resetGame } = await import(
      "../src/services/gameService.js"
    );
    const { launchDelivery, completeDelivery, createDeliveryPreview } =
      await import("../src/services/deliveryService.js");
    const { HttpError } = await import("../src/errors/httpError.js");
    const originalRandom = Math.random;
    Math.random = () => 0.99;
    const conflict = (error: unknown) =>
      error instanceof HttpError && error.statusCode === 409;
    const selectPair = async () => {
      const snapshot = await getGameSnapshot();
      const order = snapshot.orders.find(
        (order) => order.destination === "Alpha Station",
      )!;
      const rover = snapshot.rovers.find(
        (rover) => rover.name === "Pathfinder",
      )!;
      return { snapshot, order, rover };
    };
    try {
      await t.test(
        "migration runner can be repeated without changing game data",
        async () => {
          await applyMigrations(db.pool);
          assert.equal(
            (await db.pool.query("SELECT name FROM schema_migrations")).rows
              .length,
            2,
          );
          assert.equal((await getGameSnapshot()).orders.length, 5);
        },
      );
      await t.test(
        "preview rejects overweight orders without changing state",
        async () => {
          const { snapshot } = await selectPair();
          const order = snapshot.orders.find((order) => order.weight === 42)!;
          const preview = await createDeliveryPreview(
            order.id,
            snapshot.rovers[0]!.id,
          );
          assert.equal(preview.possible, false);
          assert.ok(
            preview.problems.some(
              (problem) => problem.code === "CAPACITY_EXCEEDED",
            ),
          );
          assert.equal((await getGameSnapshot()).game.deliveriesToday, 0);
        },
      );
      await t.test(
        "simultaneous launches cannot use the same rover twice",
        async () => {
          const { order, rover } = await selectPair();
          const results = await Promise.all([
            launchDelivery(order.id, rover.id),
            launchDelivery(order.id, rover.id),
          ]);
          assert.equal(results.filter((result) => result.launched).length, 1);
          const snapshot = await getGameSnapshot();
          assert.equal(snapshot.activeDeliveries.length, 1);
          assert.equal(snapshot.game.deliveriesToday, 1);
          await assert.rejects(endDay(1), conflict);
        },
      );
      await t.test(
        "completion updates all entities and cannot pay twice",
        async () => {
          const before = await getGameSnapshot();
          const delivery = before.activeDeliveries[0]!;
          const result = await completeDelivery(delivery.id);
          assert.equal(result.outcome, "SUCCESS");
          assert.equal(result.rewardReceived, 240);
          assert.equal(result.ratingChange, 0); // Already at the rating cap.
          const after = await getGameSnapshot();
          assert.equal(after.activeDeliveries.length, 0);
          assert.equal(after.game.money, 240);
          assert.equal(after.stats.successfulDeliveries, 1);
          assert.equal(
            after.rovers.find((rover) => rover.id === delivery.roverId)!.status,
            "AVAILABLE",
          );
          assert.ok(
            after.rovers.find((rover) => rover.id === delivery.roverId)!
              .battery <
              before.rovers.find((rover) => rover.id === delivery.roverId)!
                .battery,
          );
          await assert.rejects(completeDelivery(delivery.id), conflict);
          assert.equal((await getGameSnapshot()).game.money, 240);
        },
      );
      await t.test(
        "End Day expires orders, charges fleet and rejects an old day",
        async () => {
          const before = await getGameSnapshot();
          const result = await endDay(1);
          assert.equal(result.game.day, 2);
          assert.equal(result.game.deliveriesToday, 0);
          assert.equal(result.expiredOrderIds.length, 1);
          assert.equal(result.createdOrderIds.length, 3);
          const after = await getGameSnapshot();
          assert.equal(after.stats.expiredOrders, 1);
          for (const rover of after.rovers) {
            const previous = before.rovers.find(
              (item) => item.id === rover.id,
            )!;
            assert.equal(rover.battery, Math.min(previous.battery + 30, 100));
            assert.equal(rover.x, 45);
            assert.equal(rover.y, 50);
          }
          await assert.rejects(endDay(1), conflict);
        },
      );
      await t.test("zero-distance station delivery is allowed", async () => {
        await resetGame();
        const { order, rover } = await selectPair();
        await pool.query("UPDATE rovers SET x=$1,y=$2 WHERE id=$3", [
          order.x,
          order.y,
          rover.id,
        ]);
        const preview = await createDeliveryPreview(order.id, rover.id);
        assert.equal(preview.distance, 0);
        assert.equal(preview.batteryCost, 0);
        const result = await launchDelivery(order.id, rover.id);
        assert.equal(result.launched, true);
        if (result.launched) await completeDelivery(result.delivery.id);
      });
      await t.test(
        "a late SQL failure rolls back the whole launch",
        async () => {
          await resetGame();
          const { order, rover } = await selectPair();
          await pool.query(
            "CREATE FUNCTION reject_event() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test rollback'; END; $$",
          );
          await pool.query(
            "CREATE TRIGGER reject_event BEFORE INSERT ON events FOR EACH ROW EXECUTE FUNCTION reject_event()",
          );
          try {
            await assert.rejects(
              launchDelivery(order.id, rover.id),
              /test rollback/,
            );
            const after = await getGameSnapshot();
            assert.equal(after.game.deliveriesToday, 0);
            assert.equal(after.activeDeliveries.length, 0);
            assert.equal(
              after.orders.find((item) => item.id === order.id)!.status,
              "AVAILABLE",
            );
            assert.equal(
              after.rovers.find((item) => item.id === rover.id)!.status,
              "AVAILABLE",
            );
          } finally {
            await pool.query("DROP TRIGGER reject_event ON events");
            await pool.query("DROP FUNCTION reject_event()");
          }
        },
      );
      await t.test(
        "Reset cancels active missions and does not reuse their IDs",
        async () => {
          const { order, rover } = await selectPair();
          const launched = await launchDelivery(order.id, rover.id);
          assert.equal(launched.launched, true);
          if (!launched.launched) return;
          await resetGame();
          const after = await getGameSnapshot();
          assert.equal(after.rovers.length, 3);
          assert.equal(after.orders.length, 5);
          assert.equal(after.activeDeliveries.length, 0);
          assert.equal(after.recentEvents.length, 1);
          assert.equal(after.game.day, 1);
          assert.equal(after.game.money, 0);
          const pair = await selectPair();
          const next = await launchDelivery(pair.order.id, pair.rover.id);
          assert.equal(next.launched, true);
          if (next.launched) assert.ok(next.delivery.id > launched.delivery.id);
          await assert.rejects(
            completeDelivery(launched.delivery.id),
            (error) => error instanceof HttpError && error.statusCode === 404,
          );
        },
      );
      await t.test(
        "day five wins at the exact money target, loses at rating 50",
        async () => {
          await resetGame();
          await pool.query("UPDATE game_state SET day=5,money=2500,rating=51");
          assert.equal((await endDay(5)).game.status, "WON");
          await assert.rejects(endDay(5), conflict);
          await resetGame();
          await pool.query("UPDATE game_state SET day=5,money=2500,rating=50");
          assert.equal((await endDay(5)).game.status, "LOST");
        },
      );
      await t.test("HTTP validation returns JSON 400/404", async () => {
        const { app } = await import("../src/app.js");
        const server = app.listen(0, "127.0.0.1");
        await new Promise<void>((resolve) => server.once("listening", resolve));
        const address = server.address();
        assert.ok(address && typeof address !== "string");
        const url = `http://127.0.0.1:${address.port}`;
        try {
          const invalid = await fetch(`${url}/api/deliveries`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "{",
          });
          assert.equal(invalid.status, 400);
          assert.equal(
            typeof ((await invalid.json()) as { error: unknown }).error,
            "string",
          );
          const unknown = await fetch(`${url}/api/not-a-route`);
          assert.equal(unknown.status, 404);
          const missingDay = await fetch(`${url}/api/game/end-day`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "{}",
          });
          assert.equal(missingDay.status, 400);
        } finally {
          await new Promise<void>((resolve, reject) =>
            server.close((error) => (error ? reject(error) : resolve())),
          );
        }
      });
    } finally {
      Math.random = originalRandom;
      await pool.end();
      await db.cleanup();
    }
  },
);
