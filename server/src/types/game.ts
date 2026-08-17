export type GameStatus = "ACTIVE" | "WON" | "LOST";

export type RoverStatus =
    | "AVAILABLE"
    | "DELIVERING"
    | "CHARGING"
    | "BROKEN";

export type OrderStatus =
    | "AVAILABLE"
    | "IN_DELIVERY"
    | "DELIVERED"
    | "FAILED"
    | "EXPIRED";

export type Urgency = "LOW" | "MEDIUM" | "HIGH";
export type Terrain = "SAFE" | "ROCKY" | "CRATER";

export type GameState = {
    id: number,
    day: number,
    money: number,
    score: number,
    rating: number,
    deliveriesToday: number,
    status: GameStatus
}

export type Rover = {
    id: number,
    name: string,
    battery: number,
    capacity: number,
    status: RoverStatus,
    x: number,
    y: number
}
export type Order = {
    id: number,
    destination: string,
    x: number,
    y: number,
    weight: number,
    reward: number,
    urgency: Urgency,
    baseRisk: number,
    terrain: Terrain,
    status: OrderStatus,
    expiresDay: number
}

export type GameSnapshot = {
    game: GameState;
    rovers: Rover[];
    orders: Order[];
};