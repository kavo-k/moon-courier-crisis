import { Router } from "express"
import { endDayController, getGame, resetGameController } from "../controllers/gameController.js";

const gameRouter = Router()

gameRouter.get('/game', getGame);

gameRouter.post('/game/end-day', endDayController);

gameRouter.post('/game/reset', resetGameController);

export { gameRouter }