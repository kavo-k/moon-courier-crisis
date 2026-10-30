import { pool } from "./pool.js";
import { applyMigrations } from "./migrationRunner.js";

try {
  await applyMigrations(pool);
  console.log("Migrations completed");
} catch (error) {
  console.error("Migration error:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
