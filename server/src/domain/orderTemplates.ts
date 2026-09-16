import type { Order } from "../types/game.js";

type OrderTemplate = Omit<Order, "id" | "status" | "expiresDay">;

export const DAILY_ORDER_TEMPLATES: OrderTemplate[] = [
    { destination: "Alpha Station", x: 65, y: 25, weight: 12, reward: 240, urgency: "HIGH", baseRisk: 10, terrain: "ROCKY" },
    { destination: "Research Camp", x: 20, y: 70, weight: 8, reward: 180, urgency: "MEDIUM", baseRisk: 5, terrain: "SAFE" },
    { destination: "Crater-7", x: 75, y: 75, weight: 28, reward: 420, urgency: "LOW", baseRisk: 20, terrain: "CRATER" }]