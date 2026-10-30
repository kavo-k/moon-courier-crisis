import "dotenv/config";
import { randomBytes } from "node:crypto";
import { Pool } from "pg";
import { applyMigrations } from "../../src/db/migrationRunner.js";
import { insertInitialRoversAndOrders } from "../../src/db/initialData.js";

export async function createTestDatabase() {
  const connectionString =
    process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!connectionString)
    throw new Error(
      "Для интеграционных тестов нужен DATABASE_URL или TEST_DATABASE_URL.",
    );
  const schema = `mcc_test_${randomBytes(8).toString("hex")}`;
  if (!/^mcc_test_[a-f0-9]{16}$/.test(schema))
    throw new Error("Invalid temporary schema name");
  const admin = new Pool({ connectionString });
  await admin.query(`CREATE SCHEMA ${schema}`);
  const options = `-c search_path=${schema}`;
  const pool = new Pool({ connectionString, options });
  async function cleanup() {
    await pool.end();
    // Only the schema generated above is ever removed; the live game is untouched.
    await admin.query(`DROP SCHEMA ${schema} CASCADE`);
    await admin.end();
  }
  try {
    await applyMigrations(pool);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "INSERT INTO game_state (day,money,score,rating,deliveries_today,status) VALUES (1,0,0,100,0,'ACTIVE')",
      );
      await insertInitialRoversAndOrders(client);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    await cleanup();
    throw error;
  }
  return { pool, schema, connectionString, options, cleanup };
}
