import { createTestDatabase } from "./helpers/testDatabase.js";

const db = await createTestDatabase();
process.env.DATABASE_URL = db.connectionString;
process.env.PGOPTIONS = db.options;
// Predictable outcomes only in this isolated browser-test process.
Math.random = () => 0.99;
const { app } = await import("../src/app.js");
const { pool } = await import("../src/db/pool.js");
const server = app.listen(3101, "127.0.0.1", () =>
  console.log("E2E_READY http://127.0.0.1:3101"),
);
let closing = false;
function close() {
  if (closing) return;
  closing = true;
  server.close(() => {
    void pool
      .end()
      .then(() => db.cleanup())
      .then(() => process.exit(0));
  });
}
process.on("SIGINT", close);
process.on("SIGTERM", close);
// Await schema cleanup before responding, because Playwright terminates the
// Windows process tree immediately after globalTeardown returns.
app.post("/__test__/shutdown", async (_request, response) => {
  if (closing) {
    response.status(409).json({ error: "Already shutting down" });
    return;
  }
  closing = true;
  await pool.end();
  await db.cleanup();
  response.json({ ok: true });
  server.close(() => process.exit(0));
});
