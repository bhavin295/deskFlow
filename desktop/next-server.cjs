const { spawn } = require("node:child_process");
const http = require("node:http");
const path = require("node:path");
const fs = require("node:fs");
const { app } = require("electron");

let serverProcess = null;

function getStandaloneDir() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "app.asar.unpacked", ".next", "standalone");
  }
  return path.join(__dirname, "..", ".next", "standalone");
}

function waitForUrl(url, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;

  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() >= deadline) {
          reject(new Error(`DeskFlow UI server did not start at ${url}`));
          return;
        }
        setTimeout(attempt, 350);
      });
      req.setTimeout(2500, () => {
        req.destroy();
        if (Date.now() >= deadline) {
          reject(new Error(`DeskFlow UI server timed out at ${url}`));
          return;
        }
        setTimeout(attempt, 350);
      });
    };
    attempt();
  });
}

async function startNextServer(port) {
  if (!app.isPackaged) {
    return process.env.ELECTRON_APP_URL || `http://127.0.0.1:${port}`;
  }

  const standaloneDir = getStandaloneDir();
  const serverJs = path.join(standaloneDir, "server.js");
  if (!fs.existsSync(serverJs)) {
    throw new Error(
      `Missing production server at ${serverJs}. Rebuild with npm run electron:build.`,
    );
  }

  const url = `http://127.0.0.1:${port}`;
  process.env.ELECTRON_APP_URL = url;
  process.env.PORT = String(port);
  process.env.HOSTNAME = "127.0.0.1";

  serverProcess = spawn(process.execPath, [serverJs], {
    cwd: standaloneDir,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      NODE_ENV: "production",
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  serverProcess.stdout?.on("data", (chunk) => {
    const line = chunk.toString().trim();
    if (line) console.log("[DeskFlow UI]", line);
  });
  serverProcess.stderr?.on("data", (chunk) => {
    const line = chunk.toString().trim();
    if (line) console.error("[DeskFlow UI]", line);
  });
  serverProcess.on("exit", (code, signal) => {
    console.log(`[DeskFlow UI] server exited (code=${code ?? "null"}, signal=${signal ?? "null"})`);
    serverProcess = null;
  });

  await waitForUrl(url);
  console.log(`[DeskFlow] UI server ready at ${url}`);
  return url;
}

function stopNextServer() {
  if (!serverProcess || serverProcess.killed) return;
  serverProcess.kill("SIGTERM");
  serverProcess = null;
}

module.exports = { startNextServer, stopNextServer };
