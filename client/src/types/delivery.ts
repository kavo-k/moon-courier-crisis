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

export type StartedDelivery = {
  id: number;
  orderId: number;
  roverId: number;
  distance: number;
  batteryCost: number;
  finalRisk: number;
  status: "IN_PROGRESS";
  startedAt: string;
};

export type DeliveryOutcome =
  | "SUCCESS"
  | "SOLAR_STORM"
  | "MINOR_DAMAGE"
  | "DELIVERY_FAILED";

export type CompleteDeliveryResult = {
  deliveryId: number;
  outcome: DeliveryOutcome;
  deliveryStatus: "COMPLETED" | "FAILED";
  orderStatus: "DELIVERED" | "FAILED";
  rewardReceived: number;
  scoreGained: number;
  ratingChange: number;
  batterySpent: number;

  rover: {
    id: number;
    battery: number;
    status: "AVAILABLE";
    x: number;
    y: number;
  };

  game: {
    money: number;
    score: number;
    rating: number;
  };
};
