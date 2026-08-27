import type { Request, Response, NextFunction } from "express";
import { HttpError } from "../errors/httpError.js";
import { isDeliveryPreviewRequest } from "../schemas/deliverySchemas.js";
import { createDeliveryPreview } from "../services/deliveryService.js";

export async function deliveryPreview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const body: unknown = req.body;
        if (!isDeliveryPreviewRequest(body)) { throw new HttpError(400, 'недопустимое тело запроса') }

        const preview = await createDeliveryPreview(body.orderId, body.roverId)

        res.status(200).json(preview);
    } catch (err) {
        next(err)
    }
}