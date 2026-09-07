import type { Request, Response, NextFunction } from "express";
import { HttpError } from "../errors/httpError.js";
import { isDeliverySelectionRequest } from "../schemas/deliverySchemas.js";
import { completeDelivery, createDeliveryPreview, launchDelivery } from "../services/deliveryService.js";
import type { DeliveryOutcome } from "../domain/deliveryRules.js";

export async function deliveryPreview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const body: unknown = req.body;
        if (!isDeliverySelectionRequest(body)) { throw new HttpError(400, 'недопустимое тело запроса') }

        const preview = await createDeliveryPreview(body.orderId, body.roverId)

        res.status(200).json(preview);
    } catch (err) {
        next(err)
    }
}

export async function launchDeliveryController(req: Request, res: Response, next: NextFunction) {
    try {
        const body: unknown = req.body;
        if (!isDeliverySelectionRequest(body)) { throw new HttpError(400, 'недопустимое тело запроса') }

        const result = await launchDelivery(
            body.orderId,
            body.roverId
        );

        if (!result.launched) {
            return res.status(409).json({
                error: "невозможно запустить доставку",
                problems: result.problems
            })
        }

        return res.status(201).json(result.delivery)
    } catch (err) {
        next(err)
    }
}

export async function completeDeliveryController(req: Request, res: Response, next: NextFunction) {
    try {
        const id = Number(req.params.id)

        if (!Number.isSafeInteger(id) || id <= 0) { throw new HttpError(400, 'Недопустимый ID доставки') }

        const result = await completeDelivery(id);

        if (!result) {
            throw new HttpError(409, "невозможно завершить доставку")
        }

        return res.status(200).json(result)
    } catch (err) {
        next(err)
    }
}