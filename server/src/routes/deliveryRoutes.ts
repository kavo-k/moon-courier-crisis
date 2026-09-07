import { Router } from "express";
import { completeDeliveryController, deliveryPreview, launchDeliveryController } from "../controllers/deliveryController.js";

const deliveryRouter = Router()

deliveryRouter.post('/deliveries', launchDeliveryController)

deliveryRouter.post('/deliveries/preview', deliveryPreview)

deliveryRouter.post('/deliveries/:id/complete', completeDeliveryController)

export { deliveryRouter }