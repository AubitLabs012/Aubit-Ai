const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { spawn } = require("node:child_process");

const appRoot = path.resolve(__dirname, "..");
const backendRoot = path.join(appRoot, "backend");
const venvPython = path.join(backendRoot, ".venv", "Scripts", "python.exe");

const pythonCommand = fs.existsSync(venvPython) ? venvPython : "python";
const args = [
  "-m",
  "uvicorn",
  "app.main:app",
  "--host",
  "127.0.0.1",
  "--port",
  "8000",
  "--app-dir",
  backendRoot,
];

function checkBackendHealth(timeoutMs = 1200) {
  return new Promise((resolve) => {
    const request = http.get(
      "http://127.0.0.1:8000/api/health",
      { timeout: timeoutMs },
      (response) => {
        response.resume();
        response.on("end", () => {
          resolve(response.statusCode === 200);
        });
      },
    );

    request.on("timeout", () => {
      request.destroy();
      resolve(false);
    });
    request.on("error", () => {
      resolve(false);
    });
  });
}

async function main() {
  if (await checkBackendHealth()) {
    console.log("Aubit backend is already running at http://127.0.0.1:8000/api.");
    return;
  }

  const child = spawn(pythonCommand, args, {
    cwd: backendRoot,
    stdio: "inherit",
    windowsHide: false,
    env: {
      ...process.env,
      PYTHONUNBUFFERED: "1",
    },
  });

  child.on("close", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });

  child.on("error", (error) => {
    console.error(`Failed to launch Aubit backend with ${pythonCommand}:`, error);
    process.exit(1);
  });
}

main().catch((error) => {
  console.error("Failed to start Aubit backend:", error);
  process.exit(1);
});
