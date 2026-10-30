import { readFile, readdir } from "node:fs/promises";
import type { Pool } from "pg";

export async function applyMigrations(pool: Pool) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(947281)");
    await client.query(
      "CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())",
    );
    const applied = new Set(
      (
        await client.query<{ name: string }>(
          "SELECT name FROM schema_migrations",
        )
      ).rows.map((row) => row.name),
    );
    // Adopt databases created by the original one-file migration runner.
    const tables = await client.query<{ name: string | null }>(
      "SELECT to_regclass($1)::text AS name",
      ["game_state"],
    );
    if (!applied.size && tables.rows[0]?.name) {
      const existing = await client.query<{ count: string }>(
        "SELECT count(*) FROM information_schema.tables WHERE table_schema = current_schema() AND table_name IN ('game_state', 'rovers', 'orders', 'deliveries', 'events')",
      );
      if (Number(existing.rows[0]?.count) !== 5)
        throw new Error(
          "Найдена неполная схема: проверь существующие таблицы перед миграцией.",
        );
      await client.query("INSERT INTO schema_migrations(name) VALUES ($1)", [
        "001_initial_schema.sql",
      ]);
      applied.add("001_initial_schema.sql");
    }
    const directory = new URL("./migrations/", import.meta.url);
    for (const name of (await readdir(directory))
      .filter((name) => /^\d+.*\.sql$/.test(name))
      .sort()) {
      if (applied.has(name)) continue;
      await client.query(await readFile(new URL(name, directory), "utf8"));
      await client.query("INSERT INTO schema_migrations(name) VALUES ($1)", [
        name,
      ]);
      console.log(`Applied ${name}`);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
