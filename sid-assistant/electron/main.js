const os = require("node:os");
const path = require("node:path");
const { execFile } = require("node:child_process");
const { app, BrowserWindow, ipcMain, shell } = require("electron");

const appRoot = path.resolve(__dirname, "..");
const preloadPath = path.join(__dirname, "preload.js");
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 1060,
    minHeight: 680,
    title: "SID Assistant",
    autoHideMenuBar: true,
    backgroundColor: "#071115",
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });

  mainWindow.loadFile(path.join(appRoot, "index.html"));
}

function runPowerShell(args) {
  return new Promise((resolve) => {
    execFile(
      "powershell.exe",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", ...args],
      { windowsHide: true, timeout: 10000 },
      (error, stdout, stderr) => {
        resolve({
          ok: !error,
          message: stdout.trim() || stderr.trim() || (error ? error.message : "Done."),
        });
      },
    );
  });
}

const desktopActions = {
  async openUrl(payload) {
    const url = String(payload.url || "").trim();
    if (!/^https?:\/\//i.test(url)) {
      return { ok: false, message: "SID can open only http or https links for now." };
    }

    await shell.openExternal(url);
    return { ok: true, message: `Opened ${url}` };
  },

  async openApp(payload) {
    const appName = String(payload.appName || "").trim().toLowerCase();
    const knownApps = {
      calculator: "calc.exe",
      notepad: "notepad.exe",
      paint: "mspaint.exe",
      explorer: "explorer.exe",
    };
    const executable = knownApps[appName];
    if (!executable) {
      return {
        ok: false,
        message: "I can open Calculator, Notepad, Paint, or Explorer in this first build.",
      };
    }

    return runPowerShell(["-Command", `Start-Process ${JSON.stringify(executable)}`]);
  },

  async systemInfo() {
    return {
      ok: true,
      message: [
        `Computer: ${os.hostname()}`,
        `User: ${os.userInfo().username}`,
        `Platform: ${os.platform()} ${os.release()}`,
        `Memory: ${Math.round(os.totalmem() / 1024 / 1024 / 1024)} GB`,
      ].join("\n"),
    };
  },
};

ipcMain.handle("sid:desktop-action", async (_event, payload = {}) => {
  const action = String(payload.action || "");
  const handler = desktopActions[action];
  if (!handler) {
    return { ok: false, message: `Unknown desktop action: ${action}` };
  }

  try {
    return await handler(payload);
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
});

app.whenReady().then(createWindow);

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
