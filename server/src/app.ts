import express from "express";
import { healthRouter } from "./routes/healthRoutes.js";
import { gameRouter } from "./routes/gameRoutes.js";
import type { Request, Response, NextFunction, } from "express";
import { HttpError } from "./errors/httpError.js";
import { deliveryRouter } from "./routes/deliveryRoutes.js";

const app = express();

app.use(express.json());

app.use('/api', healthRouter);

app.use('/api', gameRouter);

app.use("/api", deliveryRouter);

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction,) => {
    if (error instanceof HttpError) {
        return response.status(error.statusCode).json({ error: error.message })
    }
    console.error(error);
    response.status(500).json({ error: 'внутренняя ошибка сервера.' })
});

export { app };