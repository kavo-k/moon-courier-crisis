import { pool } from "../db/pool.js";
import { calculateBatteryCost, calculateDistance, calculateRisk, validateDelivery } from "../domain/deliveryRules.js";
import { HttpError } from "../errors/httpError.js";
import type { DeliveryPreview } from "../types/delivery.js";
import type { GameState, Order, Rover } from "../types/game.js";

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
    if (!orderData) { throw new HttpError(404, "Order not found"); };
    if (!roverData) { throw new HttpError(404, "Rover not found"); };

    const distance = calculateDistance(
        { x: roverData.x, y: roverData.y },
        { x: orderData.x, y: orderData.y }
    );

    const batteryCost = calculateBatteryCost(distance, orderData.weight, roverData.capacity, orderData.terrain);

    const risk = calculateRisk(orderData.baseRisk, orderData.terrain);

    const validationInput = {
        orderStatus: orderData.status,
        roverStatus: roverData.status,
        orderWeight: orderData.weight,
        roverCapacity: roverData.capacity,
        roverBattery: roverData.battery,
        batteryCost: batteryCost,
        gameStatus: game.status,
        deliveriesToday: game.deliveriesToday,
    };

    const validate = validateDelivery(validationInput)

    const order = {
        id: orderData.id,
        destination: orderData.destination,
        weight: orderData.weight,
        reward: orderData.reward,
        terrain: orderData.terrain
    }

    const rover = {
        id: roverData.id,
        name: roverData.name,
        battery: roverData.battery,
        capacity: roverData.capacity
    }

    return { order, rover, distance, batteryCost, risk, possible: validate.possible, problems: validate.problems }
}