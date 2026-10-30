import express from "express";
import { healthRouter } from "./routes/healthRoutes.js";
import { gameRouter } from "./routes/gameRoutes.js";
import type { Request, Response, NextFunction } from "express";
import { HttpError } from "./errors/httpError.js";
import { deliveryRouter } from "./routes/deliveryRoutes.js";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const app = express();

app.use(express.json());

app.use("/api", healthRouter);

app.use("/api", gameRouter);

app.use("/api", deliveryRouter);

app.use("/api", (_request, response) => {
  response.status(404).json({ error: "API-маршрут не найден." });
});

const clientDirectory = fileURLToPath(
  new URL("../../client/dist/", import.meta.url),
);
const clientIndex = fileURLToPath(
  new URL("../../client/dist/index.html", import.meta.url),
);
if (existsSync(clientIndex)) {
  app.use(express.static(clientDirectory));
  app.use((request, response, next) => {
    if (request.method === "GET" && request.accepts("html")) {
      response.sendFile(clientIndex);
    } else next();
  });
}

app.use(
  (
    error: unknown,
    _request: Request,
    response: Response,
    _next: NextFunction,
  ) => {
    if (error instanceof HttpError) {
      return response.status(error.statusCode).json({ error: error.message });
    }
    if (
      error instanceof SyntaxError &&
      "status" in error &&
      error.status === 400
    ) {
      response.status(400).json({ error: "Некорректный JSON в теле запроса." });
      return;
    }

    console.error(error);
    response.status(500).json({ error: "внутренняя ошибка сервера." });
  },
);

export { app };
