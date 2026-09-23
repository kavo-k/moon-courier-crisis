import type { Request, Response, NextFunction } from "express";
import { endDay, getGameSnapshot, resetGame } from "../services/gameService.js";
import { HttpError } from "../errors/httpError.js";
import { TOTAL_DAYS } from "../domain/gameRules.js";

export async function getGame(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const data = await getGameSnapshot()
        res.status(200).json(data);
    }
    catch (err) {
        next(err)
    }
}

export async function endDayController(req: Request, res: Response, next: NextFunction) {
    try {
        const body: unknown = req.body;

        if (typeof body !== "object" || body === null || !("expectedDay" in body)) {
            throw new HttpError(400, "Недопустимое тело запроса");
        }

        const expectedDay = body.expectedDay;

        if (typeof expectedDay !== "number" || !Number.isSafeInteger(expectedDay) || expectedDay < 1 || expectedDay > TOTAL_DAYS) { throw new HttpError(400, 'Недопустимый текущий день') }

        const data = await endDay(expectedDay);
        return res.status(200).json(data);
    } catch (err) {
        next(err);
    }
}

export async function resetGameController(_req: Request, res: Response, next: NextFunction) {
    try {
        const data = await resetGame()
        res.status(200).json({ game: data });
    }
    catch (err) {
        next(err)
    }
}