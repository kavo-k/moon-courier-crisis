import type { DeliveryOutcome } from "../types/delivery";
import type { RoverStatus, Terrain, Urgency } from "../types/game";

export const terrainLabels: Record<Terrain, string> = {
  SAFE: "Равнина",
  ROCKY: "Скалы",
  CRATER: "Кратеры",
};
export const urgencyLabels: Record<Urgency, string> = {
  HIGH: "Срочный",
  MEDIUM: "Обычный",
  LOW: "Несрочный",
};
export const roverLabels: Record<RoverStatus, string> = {
  AVAILABLE: "Готов",
  DELIVERING: "В пути",
  CHARGING: "Заряжается",
  BROKEN: "Повреждён",
};
export const outcomeLabels: Record<DeliveryOutcome, string> = {
  SUCCESS: "Доставка выполнена",
  SOLAR_STORM: "Солнечная буря",
  MINOR_DAMAGE: "Небольшое повреждение",
  DELIVERY_FAILED: "Доставка потеряна",
};

export const money = (amount: number) => `$${amount.toLocaleString("ru-RU")}`;
export const signed = (amount: number) =>
  amount > 0 ? `+${amount}` : String(amount);
