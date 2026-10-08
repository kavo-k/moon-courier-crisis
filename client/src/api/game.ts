import type { GameSnapshot } from "../types/game";

export async function getGameSnapshot(): Promise<GameSnapshot> {
    const response = await fetch('/api/game');

    if (response.ok === false) {
        throw new Error(`Не удалось загрузить игру: HTTP ${response.status}`);
    }

    const data = await response.json();
    return data
}