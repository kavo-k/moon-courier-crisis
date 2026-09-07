import { pool } from "../db/pool.js";
import { calculateBatteryCost, calculateDeliveryEffects, calculateDistance, calculateRisk, resolveDeliveryOutcome, validateDelivery } from "../domain/deliveryRules.js";
import { HttpError } from "../errors/httpError.js";
import type { CompleteDeliveryResult, DeliveryPreview, LaunchDeliveryResult, StartedDelivery } from "../types/delivery.js";
import type { Delivery, GameState, Order, Rover } from "../types/game.js";

function buildDeliveryPreview(
    game: GameState,
    order: Order,
    rover: Rover,
): DeliveryPreview {
    const distance = calculateDistance(
        { x: rover.x, y: rover.y },
        { x: order.x, y: order.y }
    );

    const batteryCost = calculateBatteryCost(distance, order.weight, rover.capacity, order.terrain);

    const risk = calculateRisk(order.baseRisk, order.terrain);

    const validationInput = {
        orderStatus: order.status,
        roverStatus: rover.status,
        orderWeight: order.weight,
        roverCapacity: rover.capacity,
        roverBattery: rover.battery,
        batteryCost: batteryCost,
        gameStatus: game.status,
        deliveriesToday: game.deliveriesToday,
    };

    const validate = validateDelivery(validationInput)

    const orderData = {
        id: order.id,
        destination: order.destination,
        weight: order.weight,
        reward: order.reward,
        terrain: order.terrain
    }

    const roverData = {
        id: rover.id,
        name: rover.name,
        battery: rover.battery,
        capacity: rover.capacity
    }

    return { order: orderData, rover: roverData, distance, batteryCost, risk, possible: validate.possible, problems: validate.problems }
}

export async function createDeliveryPreview(
    orderId: number,
    roverId: number,
): Promise<DeliveryPreview> {
    const [gameResult, orderResult, roverResult] = await Promise.all([
        pool.query<GameState>('SELECT id, day, money, score, rating, deliveries_today AS "deliveriesToday", status FROM game_state WHERE id = 1'),
        pool.query<Order>(`SELECT id, destination, x, y, weight, reward, urgency, base_risk AS "baseRisk", terrain, status, expires_day AS "expiresDay" FROM orders WHERE id = $1`, [orderId]),
        pool.query<Rover>(`SELECT id, name, battery, capacity, status, x, y FROM rovers WHERE id = $1`, [roverId],)
    ]);
    const game = gameResult.rows[0];
    const orderData = orderResult.rows[0];
    const roverData = roverResult.rows[0];

    if (!game) { throw new Error("Game state not found"); }
    if (!orderData) { throw new HttpError(404, "несуществующий заказ"); };
    if (!roverData) { throw new HttpError(404, "несуществующий ровер"); };

    const data = buildDeliveryPreview(game, orderData, roverData);

    return data
}

export async function launchDelivery(
    orderId: number,
    roverId: number,
): Promise<LaunchDeliveryResult> {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const gameResult = await client.query<GameState>('SELECT id, day, money, score, rating, deliveries_today AS "deliveriesToday", status FROM game_state WHERE id = 1 FOR UPDATE');
        const orderResult = await client.query<Order>(`SELECT id, destination, x, y, weight, reward, urgency, base_risk AS "baseRisk", terrain, status, expires_day AS "expiresDay" FROM orders WHERE id = $1 FOR UPDATE`, [orderId]);
        const roverResult = await client.query<Rover>(`SELECT id, name, battery, capacity, status, x, y FROM rovers WHERE id = $1 FOR UPDATE`, [roverId]);

        const game = gameResult.rows[0];
        const orderData = orderResult.rows[0];
        const roverData = roverResult.rows[0];

        if (!game) { throw new Error("Game state not found"); }
        if (!orderData) { throw new HttpError(404, "Order not found"); };
        if (!roverData) { throw new HttpError(404, "Rover not found"); };

        const preview = buildDeliveryPreview(game, orderData, roverData);

        if (preview.possible === false) {
            await client.query("ROLLBACK");
            return { launched: false, problems: preview.problems }
        }

        const deliveryResult = await client.query<StartedDelivery>(`
            INSERT INTO deliveries (
        order_id,
        rover_id,
        distance,
        battery_cost,
        final_risk,
        status
    )
        VALUES ($1, $2, $3, $4, $5, 'IN_PROGRESS')
        RETURNING
      id,
      order_id AS "orderId",
      rover_id AS "roverId",
      distance,
      battery_cost AS "batteryCost",
      final_risk AS "finalRisk",
      status,
      started_at AS "startedAt"`, [preview.order.id, preview.rover.id, preview.distance, preview.batteryCost, preview.risk])
        const delivery = deliveryResult.rows[0];

        if (!delivery) { throw new Error("Заказ не создан"); }

        await client.query(`UPDATE orders
        SET status = $1
        WHERE id = $2`, ['IN_DELIVERY', preview.order.id]);

        await client.query(`UPDATE rovers
        SET status = $1
        WHERE id = $2`, ['DELIVERING', preview.rover.id]);

        await client.query(`UPDATE game_state
        SET deliveries_today = deliveries_today + 1
        WHERE id = $1`, [game.id]
        );

        await client.query(`INSERT INTO events (
            delivery_id,
            type,
            message
        ) VALUES ($1, $2, $3)
        `, [delivery.id, "DELIVERY_STARTED", `${roverData.name} departed for ${orderData.destination}`]);

        await client.query("COMMIT");

        return { launched: true, delivery }
    } catch (err) {
        await client.query("ROLLBACK");
        throw err
    } finally {
        await client.release()
    }
}


export async function completeDelivery(
    deliveryId: number,
): Promise<CompleteDeliveryResult> {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const gameResult = await client.query<GameState>('SELECT id, day, money, score, rating, deliveries_today AS "deliveriesToday", status FROM game_state WHERE id = 1 FOR UPDATE');
        const deliveryResult = await client.query<Delivery>(`SELECT id,
            order_id AS "orderId",
            rover_id AS "roverId",
            distance,
            battery_cost AS "batteryCost",
            final_risk AS "finalRisk",
            status,
            started_at AS "startedAt"
            FROM deliveries WHERE id = $1 FOR UPDATE`, [deliveryId]);

        const game = gameResult.rows[0];
        const deliveryData = deliveryResult.rows[0];

        if (!game) { throw new Error("Game state not found"); }
        if (!deliveryData) { throw new HttpError(404, "Delivery not found"); };
        if (deliveryData.status !== "IN_PROGRESS") { throw new HttpError(409, "Доставка не в процессе") };

        const orderResult = await client.query<Order>(`SELECT id, destination, x, y, weight, reward, urgency, base_risk AS "baseRisk", terrain, status, expires_day AS "expiresDay" FROM orders WHERE id = $1 FOR UPDATE`, [deliveryData.orderId]);
        const roverResult = await client.query<Rover>(`SELECT id, name, battery, capacity, status, x, y FROM rovers WHERE id = $1 FOR UPDATE`, [deliveryData.roverId]);

        const orderData = orderResult.rows[0];
        const roverData = roverResult.rows[0];

        if (!orderData) { throw new HttpError(404, "Order not found"); };
        if (!roverData) { throw new HttpError(404, "Rover not found"); };

        if (orderData.status !== "IN_DELIVERY") { throw new HttpError(409, "Заказ не в процессе") };
        if (roverData.status !== "DELIVERING") { throw new HttpError(409, "Ровер не в процессе") };

        const roll = Math.random() * 100;

        const outcome = resolveDeliveryOutcome(deliveryData.finalRisk, roll)

        const effects = calculateDeliveryEffects(outcome, orderData.reward, deliveryData.finalRisk, deliveryData.batteryCost)

        const requestedBattery = deliveryData.batteryCost + effects.extraBatteryCost;

        const batterySpent = Math.min(roverData.battery, requestedBattery);
        const remainingBattery = roverData.battery - batterySpent;

        const deliveryStatus =
            outcome === "DELIVERY_FAILED" ? "FAILED" : "COMPLETED";

        const orderStatus =
            outcome === "DELIVERY_FAILED" ? "FAILED" : "DELIVERED";

        await client.query('UPDATE deliveries SET status = $1, outcome = $2, reward_received = $3, battery_cost = $4, completed_at = NOW()  WHERE id = $5', [deliveryStatus, outcome, effects.rewardReceived, batterySpent, deliveryData.id])
        await client.query('UPDATE orders SET status = $1 WHERE id = $2', [orderStatus, orderData.id])
        const updateRover = await client.query<CompleteDeliveryResult["rover"]>('UPDATE rovers SET battery = $1, status = $2, x = $3, y = $4 WHERE id = $5 RETURNING id, battery, status, x, y', [remainingBattery, "AVAILABLE", orderData.x, orderData.y, roverData.id]);
        const updateGame = await client.query<CompleteDeliveryResult["game"]>(`UPDATE game_state
            SET
              money = money + $1,
              score = score + $2,
              rating = LEAST(100, GREATEST(0, rating + $3))
            WHERE id = $4
            RETURNING money, score, rating`, [effects.rewardReceived, effects.scoreGained, effects.ratingChange, game.id]);
        await client.query(`INSERT INTO events (
            delivery_id,
            type,
            message
        ) VALUES ($1, $2, $3)
        `, [deliveryData.id, outcome, `${roverData.name} arrived at ${orderData.destination}`]);

        const resultRover = updateRover.rows[0];
        const resultGame = updateGame.rows[0];

        if (!resultRover) { throw new HttpError(404, "Rover not found"); };
        if (!resultGame) { throw new Error("Game state not found"); }

        const data: CompleteDeliveryResult = {
            deliveryId: deliveryData.id,
            outcome,
            deliveryStatus: deliveryStatus,
            orderStatus: orderStatus,
            rewardReceived: effects.rewardReceived,
            scoreGained: effects.scoreGained,
            ratingChange: effects.ratingChange,
            batterySpent: batterySpent,
            rover: resultRover,
            game: resultGame

        }

        await client.query("COMMIT");

        return data
    } catch (err) {
        await client.query("ROLLBACK");
        throw err
    } finally {
        await client.release()
    }
}