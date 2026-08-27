import { Router } from "express";
import { deliveryPreview } from "../controllers/deliveryController.js";

const deliveryRouter = Router()

deliveryRouter.post('/deliveries/preview', deliveryPreview)

export { deliveryRouter }