import type { DeliveryProblem } from "../domain/deliveryRules.js";
import type { Terrain } from "./game.js";

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

export type StartedDelivery = {
  id: number;
  orderId: number;
  roverId: number;
  distance: number;
  batteryCost: number;
  finalRisk: number;
  status: "IN_PROGRESS";
  startedAt: Date;
};

export type LaunchDeliveryResult =
  | {
    launched: true;
    delivery: StartedDelivery;
  }
  | {
    launched: false;
    problems: DeliveryProblem[];
  };