import type { Request, Response, NextFunction } from "express";
import { getGameSnapshot } from "../services/gameService.js";

export async function getGame(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const data = await getGameSnapshot()
        res.status(200).json(data);
    }
    catch (err) {
        next(err)
    }
}