import type { DeliveryProblem } from "../domain/deliveryRules.js";
import type { Terrain } from "./game.js";

export type DeliveryPreviewRequest = {
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