import { readFile } from "node:fs/promises";
import { pool } from "./pool.js";

async function seed() {
    try {
        const path = new URL("./seeds/001_initial_data.sql", import.meta.url)
        const sql = await readFile(path, "utf8");

        await pool.query(sql);

        console.log('seed completed');
    } catch (error) {
        console.error('seed error: ', error);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

seed();