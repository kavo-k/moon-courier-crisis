import { pool } from "./pool.js";
import { insertInitialRoversAndOrders } from "./initialData.js";

async function seed() {
    try {
        const client = await pool.connect()
        try {
            await client.query("BEGIN");
            await client.query(`INSERT INTO game_state (
        day,
        money,
        score,
        rating,
        deliveries_today,
        status
    ) VALUES (
        1,
        0,
        0,
        100,
        0,
        'ACTIVE'
    )`);
            await insertInitialRoversAndOrders(client);
            await client.query("COMMIT");
            console.log('seed completed');
        } catch (error) {
            await client.query("ROLLBACK");
            console.error('seed error: ', error);
            process.exitCode = 1;
        } finally {
            client.release()
        }
    } catch (error) {
        console.error("seed error:", error);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

seed();