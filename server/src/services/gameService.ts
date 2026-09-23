import { pool } from "../db/pool.js";
import type { Delivery, EndDayResult, GameSnapshot, GameState, Rover, Order, GameEvent, GameStats } from "../types/game.js";
import { HttpError } from "../errors/httpError.js";
import { calculateExpiresDay, calculateRechargedBattery, determineFinalStatus, TOTAL_DAYS } from "../domain/gameRules.js";
import { BASE_POSITION } from "../domain/deliveryRules.js";
import { DAILY_ORDER_TEMPLATES } from "../domain/orderTemplates.js";
import { insertInitialRoversAndOrders } from "../db/initialData.js";

export async function getGameSnapshot(): Promise<GameSnapshot> {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const gameResult = await client.query<GameState>('SELECT id, day, money, score, rating, deliveries_today AS "deliveriesToday", status FROM game_state WHERE id = 1 FOR SHARE');
        const game = gameResult.rows[0];

        if (!game) { throw new Error("Game state not found"); }

        const roversResult = await client.query<Rover>('SELECT id, name, battery, capacity, status, x, y FROM rovers ORDER BY id');
        const ordersResult = await client.query<Order>('SELECT id, destination, x, y, weight, reward, urgency, base_risk AS "baseRisk", terrain, status, expires_day AS "expiresDay" FROM orders ORDER BY id');
        const activeDeliveriesResult = await client.query<Delivery>(`SELECT id, order_id AS "orderId", rover_id AS "roverId", distance, battery_cost AS "batteryCost", final_risk AS "finalRisk", status, started_at AS "startedAt" FROM deliveries WHERE status = 'IN_PROGRESS' ORDER BY id`);
        const recentEventsResult = await client.query<GameEvent>(`SELECT id, delivery_id AS "deliveryId", type, message, created_at AS "createdAt" FROM events ORDER BY created_at DESC, id DESC LIMIT 20`);

        const rovers = roversResult.rows;
        const orders = ordersResult.rows;
        const activeDeliveries = activeDeliveriesResult.rows;
        const recentEvents = recentEventsResult.rows;

        const successfulDeliveries = orders.filter(delivery => delivery.status === "DELIVERED").length
        const failedDeliveries = orders.filter(delivery => delivery.status === "FAILED").length
        const expiredOrders = orders.filter(delivery => delivery.status === "EXPIRED").length


        const stats: GameStats = {
            successfulDeliveries,
            failedDeliveries,
            expiredOrders
        }

        const GameSnapshot = {
            game,
            rovers,
            orders,
            activeDeliveries,
            recentEvents,
            stats
        }

        await client.query("COMMIT");
        return GameSnapshot
    } catch (err) {
        await client.query("ROLLBACK");
        throw err
    } finally {
        await client.release()
    }
}

export async function endDay(
    expectedDay: number,
): Promise<EndDayResult> {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const gameResult = await client.query<GameState>('SELECT id, day, money, score, rating, deliveries_today AS "deliveriesToday", status FROM game_state WHERE id = 1 FOR UPDATE');
        const game = gameResult.rows[0];

        if (!game) { throw new Error("Game state not found"); }
        if (game.status !== "ACTIVE") { throw new HttpError(409, "Игра не активна") };
        if (game.day !== expectedDay) { throw new HttpError(409, "Ошибка с совпадением дней") };

        const deliveryResult = await client.query<Delivery>(`SELECT status FROM deliveries`);

        deliveryResult.rows.forEach(element => {
            if (!element) { throw new HttpError(404, "Delivery not found"); };
            if (element.status === "IN_PROGRESS") { throw new HttpError(409, "Есть незавершенный заказ") };
        });

        const expiredResult = await client.query<{ id: number }>(`UPDATE orders SET status = 'EXPIRED' WHERE status = 'AVAILABLE' AND expires_day <= $1 RETURNING id`, [game.day]);
        const roverResult = await client.query<Rover>(`SELECT id, name, battery, capacity, status, x, y FROM rovers WHERE status = 'AVAILABLE' FOR UPDATE`);

        const expiredOrders = expiredResult.rows.map(row => row.id);
        let createdOrders: number[] = [];
        const rovers = roverResult.rows;

        if (game.day === TOTAL_DAYS) {
            const result = determineFinalStatus(game.money, game.rating);

            await client.query(`UPDATE game_state SET status = $1 WHERE id = $2`, [result, game.id]);
        } else {
            const nextDay = game.day + 1;

            for (const rover of rovers) {
                const battery = calculateRechargedBattery(rover.battery);

                await client.query(
                    `UPDATE rovers
                    SET battery = $1, x = $2, y = $3
                    WHERE id = $4`,
                    [battery, BASE_POSITION.x, BASE_POSITION.y, rover.id],
                );
            };

            for (const order of DAILY_ORDER_TEMPLATES) {
                const expiresDay = calculateExpiresDay(nextDay, order.urgency);
                const createdOrdersResult = await client.query<{ id: number }>(`INSERT INTO orders ( destination, x, y, weight, reward, urgency, base_risk, terrain, status, expires_day ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, 'AVAILABLE', $9) RETURNING id`, [order.destination, order.x, order.y, order.weight, order.reward, order.urgency, order.baseRisk, order.terrain, expiresDay])
                const createdOrder = createdOrdersResult.rows[0];
                if (!createdOrder) {
                    throw new Error("Заказ не был создан");
                }
                createdOrders.push(createdOrder.id);
            };

            await client.query(`UPDATE game_state SET day = $1, deliveries_today = $2 WHERE id = 1`, [nextDay, 0])
        }

        const updatedGameResult = await client.query<GameState>('SELECT id, day, money, score, rating, deliveries_today AS "deliveriesToday", status FROM game_state WHERE id = 1')

        const updatedGame = updatedGameResult.rows[0]

        if (!updatedGame) { throw new Error("Game state not found"); }
        const data = {
            game: updatedGame,
            expiredOrderIds: expiredOrders,
            createdOrderIds: createdOrders
        }

        if (game.day < TOTAL_DAYS) {
            await client.query(`INSERT INTO events (
                type,
                message
            ) VALUES ($1, $2)
            `, ["DAY_STARTED", `День ${game.day + 1} начат. просроченных заказов: ${expiredOrders.length}. Новых заказов: ${createdOrders.length}`]);
        } else {
            await client.query(`INSERT INTO events (
                    type,
                    message
                ) VALUES ($1, $2)
                `, ["GAME_FINISHED", `День ${TOTAL_DAYS} закончен. просроченных заказов: ${expiredOrders.length}. Новых заказов: ${createdOrders.length}. Результат: ${updatedGame.status == "WON" ? "Победа" : "Поражение"}`]);
        }

        await client.query("COMMIT");
        return data
    } catch (err) {
        await client.query("ROLLBACK");
        throw err
    } finally {
        await client.release()
    }
};

export async function resetGame(): Promise<GameState> {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const gameResult = await client.query<GameState>(`SELECT id, day, money, score, rating, deliveries_today AS "deliveriesToday", status FROM game_state WHERE id = 1 FOR UPDATE`);
        const game = gameResult.rows[0];

        if (!game) { throw new Error("Game state not found"); }

        await client.query(`DELETE FROM events`);
        await client.query(`DELETE FROM deliveries`);
        await client.query(`DELETE FROM orders`);
        await client.query(`DELETE FROM rovers`);

        const gameStateResult = await client.query<GameState>(`UPDATE game_state
        SET
            day = 1,
            money = 0,
            score = 0,
            rating = 100,
            deliveries_today = 0,
            status = 'ACTIVE'
        WHERE id = 1
        RETURNING id, day, money, score, rating, deliveries_today AS "deliveriesToday", status`);

        const gameState = gameStateResult.rows[0];

        if (!gameState) { throw new Error("Game state not found"); }

        await insertInitialRoversAndOrders(client);

        await client.query(`INSERT INTO events (
            type,
            message
        ) VALUES ($1, $2)
        `, ["RESET_GAME", `Начата новая игра`]);

        const data: GameState = {
            id: gameState.id,
            day: gameState.day,
            money: gameState.money,
            score: gameState.score,
            rating: gameState.rating,
            deliveriesToday: gameState.deliveriesToday,
            status: gameState.status
        }

        await client.query('COMMIT');
        return data
    } catch (err) {
        await client.query("ROLLBACK");
        throw err
    } finally {
        await client.release()
    }
}