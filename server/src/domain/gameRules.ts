import type { Urgency } from "../types/game.js";

export const TOTAL_DAYS = 5;
export const TARGET_MONEY = 2500;
export const MIN_WINNING_RATING = 50;
export const DAILY_RECHARGE = 30;

export function calculateRechargedBattery(battery: number): number {
    return Math.min(battery += DAILY_RECHARGE, 100);
};

export function calculateExpiresDay(
    createdDay: number,
    urgency: Urgency,
): number {
    let result = createdDay;
    if (urgency === "HIGH") { result = createdDay }
    if (urgency === "MEDIUM") { result = createdDay + 1 }
    if (urgency === "LOW") { result = createdDay + 2 }
    return Math.min(result, TOTAL_DAYS);
};

export function determineFinalStatus(
    money: number,
    rating: number,
): "WON" | "LOST" {
    if (money >= TARGET_MONEY && rating > MIN_WINNING_RATING) {
        return "WON"
    } else {
        return "LOST"
    }
};