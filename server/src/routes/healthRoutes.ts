import { Router } from "express";
import { pool } from "../db/pool.js";

const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
})

healthRouter.get('/health/db', async (_req, res) => {
    try {
        const data = await pool.query('SELECT NOW() AS database_time');

        const result = data.rows[0];

        res.status(200).json({status: 'ok', result})
    } catch (err) {
        res.status(400).json({ error: 'ошибка на стороне сервера'})
    }
})

export { healthRouter };