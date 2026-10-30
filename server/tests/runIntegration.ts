import { spawn } from "node:child_process";

const child = spawn(
  process.execPath,
  ["--import", "tsx", "--test", "tests/integration.test.ts"],
  {
    stdio: "inherit",
    env: { ...process.env, RUN_DB_TESTS: "1" },
  },
);
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
