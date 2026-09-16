import { Router } from "express"
import { endDayController, getGame } from "../controllers/gameController.js";

const gameRouter = Router()

gameRouter.get('/game', getGame);

gameRouter.post('/game/end-day', endDayController);

export { gameRouter }