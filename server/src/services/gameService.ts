import { pool } from "../db/pool.js";
import type { GameSnapshot, GameState, Rover, Order } from "../types/game.js";

export async function getGameSnapshot(): Promise<GameSnapshot> {

    const [gameResult, roversResult, ordersResult] = await Promise.all([
        pool.query<GameState>('SELECT id, day, money, score, rating, deliveries_today AS "deliveriesToday", status FROM game_state WHERE id = 1'),
        pool.query<Rover>('SELECT id, name, battery, capacity, status, x, y FROM rovers ORDER BY id'),
        pool.query<Order>('SELECT id, destination, x, y, weight, reward, urgency, base_risk AS "baseRisk", terrain, status, expires_day AS "expiresDay" FROM orders ORDER BY id')
    ]);

    const game = gameResult.rows[0];
    const rovers = roversResult.rows;
    const orders = ordersResult.rows;

    if (!game) { throw new Error("Game state not found"); }

    return {
        game,
        rovers,
        orders
    }
}