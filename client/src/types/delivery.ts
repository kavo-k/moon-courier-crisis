import type { Terrain } from "./game";

export type DeliverySelectionRequest = {
    orderId: number;
    roverId: number;
};

export type DeliveryPreview = {
    order: {
        id: number;
        destination: string;
        weight: number;
        reward: number;
        terrain: Terrain;
    };

    rover: {
        id: number;
        name: string;
        battery: number;
        capacity: number;
    };

    distance: number;
    batteryCost: number;
    risk: number;
    possible: boolean;
    problems: DeliveryProblem[];
};

export type DeliveryProblem = {
    code: DeliveryProblemCode;
    message: string;
};

export type DeliveryProblemCode =
    | "ORDER_NOT_AVAILABLE"
    | "ROVER_NOT_AVAILABLE"
    | "CAPACITY_EXCEEDED"
    | "INSUFFICIENT_BATTERY"
    | "GAME_NOT_ACTIVE"
    | "DAILY_LIMIT_REACHED";
