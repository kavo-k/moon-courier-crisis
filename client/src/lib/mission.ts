import type { Delivery } from "../types/game";

// Visual travel time only. The server still owns the result and all calculations.
export function missionDuration(distance: number): number {
  return Math.round(2200 + Math.min(Math.max(distance, 0), 90) * 20);
}

export function missionProgress(delivery: Delivery, now: number): number {
  return Math.max(
    0,
    Math.min(
      1,
      (now - Date.parse(delivery.startedAt)) /
        missionDuration(delivery.distance),
    ),
  );
}
