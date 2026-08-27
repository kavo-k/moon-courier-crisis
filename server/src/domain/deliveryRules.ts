import type {
  GameStatus,
  OrderStatus,
  RoverStatus,
  Terrain,
} from "../types/game.js";

const DISTANCE_SCALE = 1;
const BATTERY_PER_KM = 0.55;
const MAX_RISK = 95;
export const MAX_DELIVERIES_PER_DAY = 3;

const TERRAIN_RULES = {
  SAFE: {
    batteryMultiplier: 1,
    riskBonus: 0,
  },
  ROCKY: {
    batteryMultiplier: 1.2,
    riskBonus: 10,
  },
  CRATER: {
    batteryMultiplier: 1.35,
    riskBonus: 20,
  },
} satisfies Record<
  Terrain,
  {
    batteryMultiplier: number;
    riskBonus: number;
  }
>;

export const BASE_POSITION = {
  x: 45,
  y: 50,
} satisfies Point;

export type Point = {
  x: number;
  y: number;
};

export function calculateDistance(from: Point, to: Point,): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  const mapDistance = Math.sqrt(dx ** 2 + dy ** 2)
  const kilometers = mapDistance * DISTANCE_SCALE;

  const rounded = Math.round(kilometers * 10) / 10;

  return rounded
}


export function calculateBatteryCost(
  distance: number,
  orderWeight: number,
  roverCapacity: number,
  terrain: Terrain,
): number {

  if (roverCapacity <= 0) { throw new Error("Грузоподъёмность ровера должна быть больше 0") };

  const baseCost = distance * BATTERY_PER_KM

  const loadRatio = orderWeight / roverCapacity

  const weightMultiplier = 1 + loadRatio * 0.5

  const batteryCost = Math.ceil(baseCost * weightMultiplier * TERRAIN_RULES[terrain].batteryMultiplier);

  return batteryCost
}

export function calculateRisk(
  baseRisk: number,
  terrain: Terrain,
): number {
  const finalRisk = baseRisk + TERRAIN_RULES[terrain].riskBonus;
  return Math.min(MAX_RISK, Math.max(0, finalRisk))
}

export type DeliveryValidationInput = {
  orderStatus: OrderStatus;
  roverStatus: RoverStatus;
  orderWeight: number;
  roverCapacity: number;
  roverBattery: number;
  batteryCost: number;
  gameStatus: GameStatus;
  deliveriesToday: number;
};

export type DeliveryProblemCode =
  | "ORDER_NOT_AVAILABLE"
  | "ROVER_NOT_AVAILABLE"
  | "CAPACITY_EXCEEDED"
  | "INSUFFICIENT_BATTERY"
  | "GAME_NOT_ACTIVE"
  | "DAILY_LIMIT_REACHED";

export type DeliveryProblem = {
  code: DeliveryProblemCode;
  message: string;
};

export type DeliveryValidation = {
  possible: boolean;
  problems: DeliveryProblem[];
};

export function validateDelivery(
  input: DeliveryValidationInput,
): DeliveryValidation {
  const problems: DeliveryProblem[] = [];

  if (input.gameStatus !== 'ACTIVE') { problems.push({ code:'GAME_NOT_ACTIVE', message: 'Игра завершена.'})}

  if (input.deliveriesToday >= MAX_DELIVERIES_PER_DAY) { problems.push({ code:'DAILY_LIMIT_REACHED', message: 'Достигнут дневной лимит доставок.'})}

  if (input.orderStatus !== 'AVAILABLE') { problems.push({ code: 'ORDER_NOT_AVAILABLE', message: 'Заказ недоступен.' }) }

  if (input.roverStatus !== 'AVAILABLE') { problems.push({ code: 'ROVER_NOT_AVAILABLE', message: 'Ровер недоступен.' }) }

  if (input.orderWeight > input.roverCapacity) { problems.push({ code: 'CAPACITY_EXCEEDED', message: `Груз превышает допустимую вместимость на ${input.orderWeight - input.roverCapacity} кг.` }) }

  if (input.batteryCost > input.roverBattery) { problems.push({ code: 'INSUFFICIENT_BATTERY', message: `Недостаточный заряд батареи, Требуется: ${input.batteryCost}%. Доступно: ${input.roverBattery}%.` }) }

  return {
    possible: problems.length === 0,
    problems
  };
}