import type { EndDayResult, GameSnapshot, GameState } from "../types/game";
import { post, request } from "./request";

export const getGameSnapshot = (signal?: AbortSignal) =>
  request<GameSnapshot>("/game", { signal });

export const endDay = (expectedDay: number) =>
  post<EndDayResult>("/game/end-day", { expectedDay });

export const resetGame = () => post<{ game: GameState }>("/game/reset");
