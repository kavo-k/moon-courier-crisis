import { readFile } from "node:fs/promises";
import { pool } from "./pool.js";

async function migrate() {
    try {
        const path = new URL("./migrations/001_initial_schema.sql", import.meta.url)
        const sql = await readFile(path, "utf8");

        await pool.query(sql);

        console.log('migration completed');
    } catch (error) {
        console.error('migration error: ', error);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

migrate();