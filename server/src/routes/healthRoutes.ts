import { Router } from "express";
import { pool } from "../db/pool.js";

type DatabaseTimeRow = {
    database_time: Date;
};

const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
})

healthRouter.get('/health/db', async (_req, res, next) => {
    try {
        const data = await pool.query<DatabaseTimeRow>('SELECT NOW() AS database_time');

        const row = data.rows[0];

        if (!row) throw new Error('запрос не вернул корректный результат');

        const result = {
            status: 'ok',
            databaseTime: row.database_time
        };

        res.status(200).json(result)
    } catch (err) {
        next(err)
    }
})

export { healthRouter };