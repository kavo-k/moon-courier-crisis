import express from "express";
import { healthRouter } from "./routes/healthRoutes.js";
import { gameRouter } from "./routes/gameRoutes.js";
import type { Request, Response, NextFunction, } from "express";

const app = express();

app.use(express.json());

app.use('/api', healthRouter);

app.use('/api', gameRouter);


app.use((error: unknown, _request: Request, response: Response, _next: NextFunction,) => {
    console.error(error);

    response.status(500).json({
        error: "Internal server error",
    });
});

export { app };