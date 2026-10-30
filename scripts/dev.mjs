import { spawn } from "node:child_process";

const npmCli = process.env.npm_execpath;
if (!npmCli)
  throw new Error("Запускай dev-серверы через npm run dev из корня проекта.");
const children = ["server", "client"].map((directory) =>
  spawn(process.execPath, [npmCli, "--prefix", directory, "run", "dev"], {
    stdio: "inherit",
  }),
);
let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode !== null || !child.pid) continue;
    if (process.platform === "win32") {
      spawn("taskkill.exe", ["/pid", String(child.pid), "/T", "/F"], {
        stdio: "ignore",
      });
    } else child.kill("SIGTERM");
  }
}
for (const child of children) {
  child.on("error", (error) => {
    console.error(error);
    process.exitCode = 1;
    stop();
  });
  child.on("exit", (code) => {
    if (!stopping) {
      process.exitCode = code ?? 1;
      stop();
    }
  });
}
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
