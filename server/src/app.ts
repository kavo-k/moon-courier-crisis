import express from "express";
import { healthRouter } from "./routes/healthRoutes.js";

const app = express();

app.use(express.json());

app.use('/api', healthRouter);

export { app };