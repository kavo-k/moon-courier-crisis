import { app } from "./app.js";
import { env } from "./config/env.js";
import { pool } from "./db/pool.js";

const server = app.listen(env.port, () => {
  console.log(`Server is running on http://localhost:${env.port}`);
});

server.on("error", (error) => {
  console.error("Не удалось запустить сервер:", error.message);
  void pool.end().finally(() => {
    process.exitCode = 1;
  });
});

function shutdown() {
  server.close(() => {
    void pool.end();
  });
}
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
