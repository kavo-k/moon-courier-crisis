import { Router } from "express"
import { getGame } from "../controllers/gameController.js";

const gameRouter = Router()

gameRouter.get('/game', getGame);

export { gameRouter }