import { Router } from "express";
import { deliveryPreview, launchDeliveryController } from "../controllers/deliveryController.js";

const deliveryRouter = Router()

deliveryRouter.post('/deliveries', launchDeliveryController)

deliveryRouter.post('/deliveries/preview', deliveryPreview)

export { deliveryRouter }