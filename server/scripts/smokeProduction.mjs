import assert from "node:assert/strict";
import { app } from "../dist/app.js";
import { pool } from "../dist/db/pool.js";

const server = app.listen(0, "127.0.0.1");
await new Promise((resolve) => server.once("listening", resolve));
const address = server.address();
try {
  assert.ok(address && typeof address !== "string");
  const url = `http://127.0.0.1:${address.port}`;
  const html = await fetch(url);
  assert.equal(html.status, 200);
  assert.match(await html.text(), /Moon Courier Crisis/);
  const health = await fetch(`${url}/api/health/db`);
  assert.equal(health.status, 200);
  const game = await fetch(`${url}/api/game`);
  assert.equal(game.status, 200);
  const snapshot = await game.json();
  assert.equal(snapshot.rules.totalDays, 5);
  assert.equal(snapshot.rovers.length, 3);
  console.log(
    "Production smoke passed: compiled Express serves frontend and PostgreSQL API.",
  );
} finally {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  await pool.end();
}
