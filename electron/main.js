const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const os = require("node:os");
const { spawn } = require("node:child_process");
const { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage, screen, session, shell } = require("electron");

const appRoot = path.resolve(__dirname, "..");
const preloadPath = path.join(__dirname, "preload.js");
const mainEntryPath = path.join(appRoot, "index.html");
const widgetEntryPath = path.join(appRoot, "widget.html");
const backendRootPath = app.isPackaged ? path.join(process.resourcesPath, "backend") : path.join(appRoot, "backend");
const appIconPngPath = path.join(appRoot, "build", "icon.png");
const appIconIcoPath = path.join(appRoot, "build", "icon.ico");
const appIconPath = process.platform === "win32" ? appIconIcoPath : appIconPngPath;
const trayIconPath = appIconPngPath;
const backendHost = "127.0.0.1";
const backendPort = 8000;
const backendHealthPath = `/api/health`;

let mainWindow = null;
let widgetWindow = null;
let tray = null;
let automationWindow = null;
let isQuitting = false;
let backendProcess = null;
let backendStartPromise = null;
let backendStopRequested = false;
let consolePipeBroken = false;
const startupLogPath = path.join(os.tmpdir(), "aubit-startup.log");

function debugLog(...parts) {
  const line = `[${new Date().toISOString()}] ${parts.map((part) => {
    if (part instanceof Error) {
      return `${part.name}: ${part.message}\n${part.stack || ""}`;
    }

    if (typeof part === "string") {
      return part;
    }

    try {
      return JSON.stringify(part);
    } catch (_error) {
      return String(part);
    }
  }).join(" ")}\n`;

  try {
    fs.appendFileSync(startupLogPath, line, "utf8");
  } catch (_error) {
  }
}

function isBrokenPipeError(error) {
  return error?.code === "EPIPE"
    || error?.errno === -4047
    || /broken pipe/i.test(String(error?.message || ""));
}

function markConsolePipeBroken() {
  consolePipeBroken = true;
}

function installConsolePipeGuards() {
  [process.stdout, process.stderr].forEach((stream) => {
    if (!stream || typeof stream.on !== "function") {
      return;
    }

    stream.on("error", (error) => {
      if (isBrokenPipeError(error)) {
        markConsolePipeBroken();
        return;
      }

      setImmediate(() => {
        throw error;
      });
    });
  });

  process.on("uncaughtException", (error) => {
    debugLog("uncaughtException", error);
    if (isBrokenPipeError(error)) {
      markConsolePipeBroken();
      return;
    }

    throw error;
  });

  process.on("unhandledRejection", (reason) => {
    debugLog("unhandledRejection", reason);
  });
}

installConsolePipeGuards();
debugLog("main.js loaded", {
  appRoot,
  processResourcesPath: process.resourcesPath,
  isPackaged: app.isPackaged,
});

app.commandLine.appendSwitch("use-fake-ui-for-media-stream");

function getBackendBaseUrl() {
  return `http://${backendHost}:${backendPort}`;
}

function safeConsoleWrite(method, ...args) {
  if (consolePipeBroken) {
    return;
  }

  const writer = method === "error" ? console.error : console.log;

  try {
    writer(...args);
  } catch (error) {
    if (isBrokenPipeError(error)) {
      markConsolePipeBroken();
      return;
    }

    throw error;
  }
}

function getBackendLogPath(streamName) {
  const logDir = app.isPackaged
    ? path.join(app.getPath("userData"), "logs")
    : backendRootPath;

  fs.mkdirSync(logDir, { recursive: true });
  return path.join(logDir, `backend-${streamName}.log`);
}

function appendBackendLog(streamName, text) {
  try {
    fs.appendFileSync(getBackendLogPath(streamName), `${text}\n`, "utf8");
  } catch (_error) {
  }
}

function relayBackendLog(streamName, chunk) {
  const text = chunk.toString().trim();
  if (!text) {
    return;
  }

  appendBackendLog(streamName, text);
  safeConsoleWrite(streamName === "stderr" ? "error" : "log", `[Aubit backend] ${text}`);
}

function broadcastShellEvent(payload) {
  [mainWindow, widgetWindow].forEach((win) => {
    if (win && !win.isDestroyed()) {
      win.webContents.send("shell:event", payload);
    }
  });
}

function emitBackendStatus(status, extra = {}) {
  broadcastShellEvent({
    type: "backend-status",
    status,
    baseUrl: `${getBackendBaseUrl()}/api`,
    ...extra,
  });
}

function fileExists(targetPath) {
  try {
    return require("node:fs").existsSync(targetPath);
  } catch (_error) {
    return false;
  }
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isTrustedAppUrl(value = "") {
  return String(value || "").startsWith("file://");
}

function isTrustedAppWebContents(webContents) {
  return isTrustedAppUrl(webContents?.getURL?.());
}

function permissionDetailsIncludeAudio(details = {}) {
  const mediaTypes = Array.isArray(details?.mediaTypes) ? details.mediaTypes : [];
  return mediaTypes.length === 0 || mediaTypes.includes("audio");
}

function installPermissionHandlers() {
  const defaultSession = session.defaultSession;
  if (!defaultSession) {
    return;
  }

  defaultSession.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    const isTrustedWindow = isTrustedAppWebContents(webContents) || isTrustedAppUrl(requestingOrigin);

    if (permission === "media") {
      return isTrustedWindow && permissionDetailsIncludeAudio(details);
    }

    return isTrustedWindow && (permission === "fullscreen" || permission === "clipboard-sanitized-write");
  });

  defaultSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
    const isTrustedWindow = isTrustedAppWebContents(webContents);

    if (permission === "media") {
      callback(isTrustedWindow && permissionDetailsIncludeAudio(details));
      return;
    }

    if (permission === "fullscreen" || permission === "clipboard-sanitized-write") {
      callback(isTrustedWindow);
      return;
    }

    callback(false);
  });
}

function ensureAutomationWindow() {
  if (automationWindow && !automationWindow.isDestroyed()) {
    return automationWindow;
  }

  debugLog("creating automation window");
  automationWindow = new BrowserWindow({
    width: 1320,
    height: 900,
    minWidth: 1040,
    minHeight: 720,
    show: false,
    title: "Aubit Command Window",
    icon: appIconPath,
    autoHideMenuBar: true,
    backgroundColor: "#101418",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });

  automationWindow.on("closed", () => {
    automationWindow = null;
  });

  return automationWindow;
}

function onceDidFinishLoad(windowRef) {
  return new Promise((resolve) => {
    windowRef.webContents.once("did-finish-load", resolve);
  });
}

async function loadAutomationUrl(url) {
  const windowRef = ensureAutomationWindow();
  const ready = onceDidFinishLoad(windowRef);
  windowRef.show();
  await windowRef.loadURL(url);
  await ready;
  windowRef.focus();
  return windowRef;
}

function sanitizeFilename(value) {
  return String(value || "capture")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

function getScreenshotPath(prefix = "aubit-capture") {
  const screenshotDir = path.join(app.getPath("pictures"), "Aubit Screenshots");
  fs.mkdirSync(screenshotDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return path.join(screenshotDir, `${sanitizeFilename(prefix)}-${stamp}.png`);
}

function getDownloadsPath() {
  const targetDir = app.getPath("downloads");
  fs.mkdirSync(targetDir, { recursive: true });
  return targetDir;
}

function ensureUniqueFilePath(targetPath) {
  if (!fileExists(targetPath)) {
    return targetPath;
  }

  const directory = path.dirname(targetPath);
  const extension = path.extname(targetPath);
  const baseName = path.basename(targetPath, extension);

  for (let suffix = 1; suffix < 1000; suffix += 1) {
    const candidate = path.join(directory, `${baseName}-${suffix}${extension}`);
    if (!fileExists(candidate)) {
      return candidate;
    }
  }

  return path.join(directory, `${baseName}-${Date.now()}${extension}`);
}

function formatBytes(bytes = 0) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const precision = value >= 100 || unitIndex === 0 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(precision)} ${units[unitIndex]}`;
}

function formatUptime(seconds = 0) {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const parts = [];
  if (days) {
    parts.push(`${days}d`);
  }
  if (hours || days) {
    parts.push(`${hours}h`);
  }
  parts.push(`${minutes}m`);
  return parts.join(" ");
}

function extensionFromContentType(contentType = "") {
  const normalized = String(contentType).toLowerCase();
  if (normalized.includes("pdf")) {
    return ".pdf";
  }
  if (normalized.includes("json")) {
    return ".json";
  }
  if (normalized.includes("csv")) {
    return ".csv";
  }
  if (normalized.includes("jpeg")) {
    return ".jpg";
  }
  if (normalized.includes("png")) {
    return ".png";
  }
  if (normalized.includes("plain")) {
    return ".txt";
  }
  if (normalized.includes("html")) {
    return ".html";
  }
  return "";
}

function filenameFromUrl(rawUrl, fallbackBase = "download") {
  try {
    const parsedUrl = new URL(rawUrl);
    const baseName = path.basename(decodeURIComponent(parsedUrl.pathname || "")) || fallbackBase;
    return sanitizeFilename(baseName);
  } catch (_error) {
    return `${sanitizeFilename(fallbackBase)}.bin`;
  }
}

function getAutomationCurrentUrl() {
  if (!automationWindow || automationWindow.isDestroyed()) {
    return "";
  }

  return automationWindow.webContents.getURL() || "";
}

async function findCurrentPdfUrl() {
  const currentUrl = getAutomationCurrentUrl();
  if (/\.pdf(?:$|[?#])/i.test(currentUrl)) {
    return currentUrl;
  }

  const windowRef = ensureAutomationWindow();
  try {
    const result = await windowRef.webContents.executeJavaScript(
      `(() => {
        const selectors = [
          'embed[type="application/pdf"]',
          'iframe[src*=".pdf"]',
          'a[href*=".pdf"]',
          'object[data*=".pdf"]'
        ];
        for (const selector of selectors) {
          const node = document.querySelector(selector);
          const url = node?.src || node?.href || node?.data || "";
          if (url && /\\.pdf(?:$|[?#])/i.test(url)) {
            return { url: new URL(url, window.location.href).href };
          }
        }
        return { url: "" };
      })()`,
      true,
    );
    return typeof result?.url === "string" ? result.url : "";
  } catch (_error) {
    return "";
  }
}

async function downloadUrlToDownloads(url, options = {}) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed with status ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get("content-type") || "";
  const fallbackBase = options.fallbackBase || "download";
  let fileName = filenameFromUrl(url, fallbackBase);
  const extension = path.extname(fileName);
  if (!extension) {
    const inferredExtension = extensionFromContentType(contentType);
    fileName = `${fileName}${inferredExtension || ""}`;
  }

  const targetPath = ensureUniqueFilePath(path.join(getDownloadsPath(), fileName));
  fs.writeFileSync(targetPath, buffer);
  return {
    targetPath,
    size: buffer.byteLength,
  };
}

async function scrollAutomationWindow(direction = "down") {
  const windowRef = ensureAutomationWindow();
  windowRef.show();
  windowRef.focus();
  await wait(120);
  const result = await windowRef.webContents.executeJavaScript(
    `(() => {
      const direction = ${JSON.stringify(direction)};
      const amount = Math.max(260, Math.floor(window.innerHeight * 0.85));
      const scrollingElement = document.scrollingElement || document.documentElement || document.body;
      const before = scrollingElement.scrollTop || window.scrollY || 0;
      if (direction === "top") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (direction === "bottom") {
        window.scrollTo({ top: scrollingElement.scrollHeight, behavior: "smooth" });
      } else {
        const delta = direction === "up" ? -amount : amount;
        window.scrollBy({ top: delta, behavior: "smooth" });
      }
      const target = document.activeElement;
      if (target && target !== document.body && typeof target.blur === 'function') {
        target.blur();
      }
      return {
        title: document.title,
        url: window.location.href,
        before,
        after: scrollingElement.scrollTop || window.scrollY || 0,
        height: scrollingElement.scrollHeight,
        viewport: window.innerHeight,
      };
    })()`,
    true,
  );

  return {
    ok: true,
    message: `Scrolled ${direction} on ${result?.title || "the current page"}.`,
  };
}

async function showGoogleResults(query) {
  const searchQuery = String(query || "").trim() || "Aubit";
  await loadAutomationUrl(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`);
  return {
    ok: true,
    message: `Google results are open for ${searchQuery}.`,
  };
}

async function searchWhatsappConversation(windowRef, targetName) {
  const query = String(targetName || "").trim();
  if (!query) {
    return false;
  }

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const result = await windowRef.webContents.executeJavaScript(
      `(() => {
        const query = ${JSON.stringify(query)};
        const lowered = query.toLowerCase();
        const textboxes = [...document.querySelectorAll('div[contenteditable="true"], [role="textbox"][contenteditable="true"]')]
          .filter((node) => !node.closest('footer'));
        const searchBox = textboxes.find((node) => /search/i.test(node.getAttribute('aria-label') || node.getAttribute('title') || ''))
          || textboxes[0]
          || null;

        if (searchBox) {
          searchBox.focus();
          document.execCommand('selectAll', false, null);
          document.execCommand('delete', false, null);
          searchBox.textContent = '';
          searchBox.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'deleteContentBackward', data: null }));
          document.execCommand('insertText', false, query);
          searchBox.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: query }));
        }

        const rows = [...document.querySelectorAll('[role="listitem"], div[aria-selected], div[tabindex="0"]')];
        const match = rows.find((node) => (node.innerText || '').toLowerCase().includes(lowered));
        if (match && typeof match.click === 'function') {
          match.click();
          return { opened: true, title: document.title };
        }

        return {
          opened: false,
          typed: Boolean(searchBox),
          rowCount: rows.length,
          title: document.title,
        };
      })()`,
      true,
    );

    if (result?.opened) {
      return true;
    }

    await wait(900);
  }

  return false;
}

async function composeEmail(to, subject = "", body = "") {
  const mailto = new URL(`mailto:${to}`);
  if (subject) {
    mailto.searchParams.set("subject", subject);
  }
  if (body) {
    mailto.searchParams.set("body", body);
  }
  await shell.openExternal(mailto.toString());
  return {
    ok: true,
    message: `Email draft opened for ${to}.`,
  };
}

function getDiskFreeBytes(targetPath) {
  try {
    const stats = fs.statfsSync(targetPath);
    return Number(stats.bavail) * Number(stats.bsize);
  } catch (_error) {
    return 0;
  }
}

async function getSystemStatus() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const freeDisk = getDiskFreeBytes(app.getPath("home"));
  const cpuModel = os.cpus()?.[0]?.model || "Unknown CPU";
  const summary = [
    `${os.hostname()} looks responsive.`,
    `CPU: ${cpuModel}.`,
    `Memory: ${formatBytes(usedMemory)} used of ${formatBytes(totalMemory)}.`,
    freeDisk ? `Disk free: ${formatBytes(freeDisk)} on the home drive.` : "Disk free space could not be measured.",
    `Uptime: ${formatUptime(os.uptime())}.`,
  ].join(" ");

  return {
    ok: true,
    message: summary,
    details: {
      platform: `${os.platform()} ${os.release()}`,
      cpuModel,
      totalMemory,
      freeMemory,
      freeDisk,
      uptimeSeconds: os.uptime(),
    },
  };
}

async function captureAutomationWindow(prefix) {
  const windowRef =
    (automationWindow && !automationWindow.isDestroyed() && automationWindow)
    || (mainWindow && !mainWindow.isDestroyed() && mainWindow)
    || (widgetWindow && !widgetWindow.isDestroyed() && widgetWindow)
    || ensureAutomationWindow();
  const image = await windowRef.webContents.capturePage();
  const targetPath = getScreenshotPath(prefix);
  fs.writeFileSync(targetPath, image.toPNG());
  return targetPath;
}

async function attemptWhatsappSend(windowRef) {
  const selectors = [
    'button[aria-label="Send"]',
    'span[data-icon="send"]',
    'button span[data-icon="send"]',
  ];

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const result = await windowRef.webContents.executeJavaScript(
      `(() => {
        const selectors = ${JSON.stringify(selectors)};
        for (const selector of selectors) {
          const node = document.querySelector(selector);
          const button = node?.closest?.('button') || node;
          if (button && typeof button.click === 'function') {
            button.click();
            return { sent: true, selector };
          }
        }
        return { sent: false, title: document.title };
      })()`,
      true,
    );

    if (result?.sent) {
      return true;
    }

    await wait(1000);
  }

  return false;
}

async function prepareInstagramReel(windowRef) {
  await wait(2600);

  await windowRef.webContents.executeJavaScript(
    `(() => {
      const firstReel =
        document.querySelector('a[href*="/reel/"]') ||
        document.querySelector('a[href*="/reels/"]');
      if (firstReel && typeof firstReel.click === 'function') {
        firstReel.click();
        return { clicked: true };
      }
      return { clicked: false };
    })()`,
    true,
  );

  await wait(2600);

  return windowRef.webContents.executeJavaScript(
    `(() => {
      const video = document.querySelector('video');
      if (video) {
        if (typeof video.pause === 'function') {
          video.pause();
        }
        return {
          paused: true,
          currentTime: video.currentTime || 0,
          title: document.title,
        };
      }
      return {
        paused: false,
        title: document.title,
      };
    })()`,
    true,
  );
}

async function typeGoogleSearch(query) {
  const searchQuery = String(query || "").trim() || "Aubit";
  const windowRef = await loadAutomationUrl("https://www.google.com");
  await wait(700);

  await windowRef.webContents.executeJavaScript(
    `(() => {
      const query = ${JSON.stringify(searchQuery)};
      const input =
        document.querySelector('textarea[name="q"]') ||
        document.querySelector('input[name="q"]') ||
        document.querySelector('textarea[aria-label*="Search" i]') ||
        document.querySelector('input[aria-label*="Search" i]');
      if (!input) {
        return { typed: false };
      }

      input.focus();
      input.value = query;
      input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: query }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return { typed: true };
    })()`,
    true,
  );

  return {
    ok: true,
    message: `Typed ${searchQuery} on Google.`,
  };
}

async function clickFirstYoutubeVideo() {
  const windowRef = ensureAutomationWindow();
  if (!windowRef || windowRef.isDestroyed()) {
    return {
      ok: false,
      message: "There is no command window open for YouTube yet.",
    };
  }

  windowRef.show();
  windowRef.focus();

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const result = await windowRef.webContents.executeJavaScript(
      `(() => {
        const selectors = [
          'ytd-video-renderer a#video-title',
          'ytd-rich-grid-media a#video-title-link',
          'a#video-title',
          'a[href*="/watch?v="]'
        ];
        const candidates = selectors
          .flatMap((selector) => Array.from(document.querySelectorAll(selector)))
          .filter((node) => {
            const href = node.href || node.getAttribute('href') || '';
            const rect = node.getBoundingClientRect();
            return href.includes('/watch?v=') && rect.width > 0 && rect.height > 0;
          });
        const first = candidates[0];
        if (!first) {
          return { clicked: false, title: document.title };
        }
        first.scrollIntoView({ block: 'center', inline: 'center' });
        first.click();
        return { clicked: true, text: first.textContent?.trim?.() || '', href: first.href || '' };
      })()`,
      true,
    );

    if (result?.clicked) {
      return {
        ok: true,
        message: result.text ? `Opening the first video: ${result.text}.` : "Opening the first video.",
      };
    }

    await wait(650);
  }

  return {
    ok: false,
    message: "I could not find a visible YouTube video to click yet.",
  };
}

async function closeAutomationWindow() {
  if (!automationWindow || automationWindow.isDestroyed()) {
    return {
      ok: true,
      message: "No command window is open.",
    };
  }

  automationWindow.close();
  automationWindow = null;
  return {
    ok: true,
    message: "Closed the command window.",
  };
}

async function controlAutomationMedia(action = "toggle") {
  if (!automationWindow || automationWindow.isDestroyed()) {
    return {
      ok: false,
      message: "There is no media window open.",
    };
  }

  automationWindow.show();
  automationWindow.focus();
  const normalizedAction = action === "pause" ? "pause" : action === "play" ? "play" : "toggle";
  const result = await automationWindow.webContents.executeJavaScript(
    `(() => {
      const action = ${JSON.stringify(normalizedAction)};
      const videos = Array.from(document.querySelectorAll('video, audio'))
        .filter((media) => media.readyState > 0 || media.duration || media.currentSrc);
      const media = videos.find((item) => !item.paused) || videos[0] || null;
      if (media) {
        if (action === 'pause') {
          media.pause();
          return { ok: true, state: 'paused', title: document.title };
        }
        if (action === 'play') {
          media.play?.();
          return { ok: true, state: 'playing', title: document.title };
        }
        if (media.paused) {
          media.play?.();
          return { ok: true, state: 'playing', title: document.title };
        }
        media.pause();
        return { ok: true, state: 'paused', title: document.title };
      }

      const buttonSelectors = action === 'pause'
        ? ['button.ytp-play-button[aria-label*="Pause"]', 'button[aria-label*="Pause"]']
        : ['button.ytp-play-button[aria-label*="Play"]', 'button[aria-label*="Play"]'];
      const button = buttonSelectors.map((selector) => document.querySelector(selector)).find(Boolean);
      if (button) {
        button.click();
        return { ok: true, state: action === 'pause' ? 'paused' : 'playing', title: document.title };
      }

      return { ok: false, title: document.title };
    })()`,
    true,
  );

  return {
    ok: Boolean(result?.ok),
    message: result?.ok
      ? `${result.state === "paused" ? "Paused" : "Playing"} media.`
      : "I could not find media controls on the current page.",
  };
}

async function clickYoutubeVideoByTitle(title) {
  const targetTitle = String(title || "").trim();
  if (!targetTitle) {
    return clickFirstYoutubeVideo();
  }

  const windowRef = ensureAutomationWindow();
  if (!windowRef || windowRef.isDestroyed()) {
    return {
      ok: false,
      message: "There is no command window open for YouTube yet.",
    };
  }

  windowRef.show();
  windowRef.focus();

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const result = await windowRef.webContents.executeJavaScript(
      `(() => {
        const target = ${JSON.stringify(targetTitle)}.toLowerCase();
        const words = target.split(/\\s+/).filter(Boolean);
        const selectors = [
          'ytd-video-renderer a#video-title',
          'ytd-rich-grid-media a#video-title-link',
          'a#video-title',
          'a[href*="/watch?v="]'
        ];
        const candidates = selectors
          .flatMap((selector) => Array.from(document.querySelectorAll(selector)))
          .filter((node) => {
            const href = node.href || node.getAttribute('href') || '';
            const rect = node.getBoundingClientRect();
            return href.includes('/watch?v=') && rect.width > 0 && rect.height > 0;
          })
          .map((node) => {
            const text = (node.textContent || node.getAttribute('title') || '').trim();
            const lowered = text.toLowerCase();
            const score = lowered.includes(target)
              ? 100 + target.length
              : words.reduce((sum, word) => sum + (lowered.includes(word) ? 1 : 0), 0);
            return { node, text, score, href: node.href || '' };
          })
          .filter((item) => item.score > 0)
          .sort((a, b) => b.score - a.score);
        const best = candidates[0];
        if (!best) {
          return { clicked: false, title: document.title };
        }
        best.node.scrollIntoView({ block: 'center', inline: 'center' });
        best.node.click();
        return { clicked: true, text: best.text, href: best.href };
      })()`,
      true,
    );

    if (result?.clicked) {
      return {
        ok: true,
        message: result.text ? `Opening ${result.text}.` : `Opening the matching video.`,
      };
    }

    await wait(650);
  }

  return {
    ok: false,
    message: `I could not find a visible YouTube video matching ${targetTitle}.`,
  };
}

async function openFirstGoogleResult(query) {
  const searchQuery = String(query || "").trim() || "Aubit";
  const windowRef = await loadAutomationUrl(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`);
  await wait(900);

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const result = await windowRef.webContents.executeJavaScript(
      `(() => {
        const blockedHosts = new Set(['www.google.com', 'google.com', 'accounts.google.com', 'support.google.com']);
        const candidates = Array.from(document.querySelectorAll('#search a[href], a[href]'))
          .map((node) => {
            let href = node.href || '';
            try {
              const parsed = new URL(href);
              if (parsed.pathname === '/url') {
                href = parsed.searchParams.get('q') || href;
              }
            } catch (_error) {}
            const rect = node.getBoundingClientRect();
            const text = (node.innerText || node.textContent || '').trim();
            return { node, href, text, rect };
          })
          .filter((item) => {
            try {
              const parsed = new URL(item.href);
              return /^https?:$/.test(parsed.protocol)
                && !blockedHosts.has(parsed.hostname)
                && !parsed.hostname.endsWith('.google.com')
                && item.rect.width > 0
                && item.rect.height > 0
                && item.text.length > 0;
            } catch (_error) {
              return false;
            }
          });
        const first = candidates[0];
        if (!first) {
          return { clicked: false, title: document.title };
        }
        first.node.scrollIntoView({ block: 'center', inline: 'center' });
        first.node.click();
        return { clicked: true, text: first.text, href: first.href };
      })()`,
      true,
    );

    if (result?.clicked) {
      return {
        ok: true,
        message: result.text ? `Opening the top Google result: ${result.text}.` : `Opening the top Google result for ${searchQuery}.`,
      };
    }

    await wait(650);
  }

  return {
    ok: true,
    message: `Google results are open for ${searchQuery}, but I could not pick a top result automatically.`,
  };
}

async function openYoutubeChannel(query) {
  const channelQuery = String(query || "").trim() || "Aubit";
  const normalizedHandle = channelQuery.replace(/^youtube\s+channel\s+/i, "").trim();
  if (/^@[\w.-]{2,}$/.test(normalizedHandle)) {
    await loadAutomationUrl(`https://www.youtube.com/${encodeURIComponent(normalizedHandle).replace(/%40/i, "@")}`);
    return {
      ok: true,
      message: `Opening YouTube channel ${normalizedHandle}.`,
    };
  }

  const channelSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(channelQuery)}&sp=EgIQAg%253D%253D`;
  const windowRef = await loadAutomationUrl(channelSearchUrl);
  await wait(1800);

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const result = await windowRef.webContents.executeJavaScript(
      `(() => {
        const channelRendererLinks = Array.from(document.querySelectorAll([
          'ytd-channel-renderer a#main-link[href]',
          'ytd-channel-renderer #channel-title a[href]',
          'ytd-channel-renderer a[href^="/@"]',
          'ytd-channel-renderer a[href*="/channel/"]'
        ].join(',')));

        const fallbackLinks = Array.from(document.querySelectorAll('a[href^="/@"], a[href*="/channel/"]'));
        const candidates = [...channelRendererLinks, ...fallbackLinks]
          .map((node) => {
            const href = node.getAttribute('href') || node.href || '';
            const text = (node.textContent || node.getAttribute('title') || '').trim();
            const rect = node.getBoundingClientRect();
            return { node, href, text, visible: rect.width > 0 && rect.height > 0 };
          })
          .filter((item) =>
            item.href &&
            item.visible &&
            !item.href.includes('/watch?') &&
            !item.href.includes('/results?') &&
            (item.href.startsWith('/@') || item.href.includes('/@') || item.href.includes('/channel/'))
          );

        const first = candidates[0];
        if (!first) {
          window.scrollBy({ top: Math.floor(window.innerHeight * 0.75), behavior: 'instant' });
          return { found: false, title: document.title };
        }

        const url = new URL(first.href, window.location.origin).toString();
        return { found: true, text: first.text, href: url };
      })()`,
      true,
    );

    if (result?.found && result.href) {
      await loadAutomationUrl(result.href);
      return {
        ok: true,
        message: result.text ? `Opening YouTube channel ${result.text}.` : `Opening the YouTube channel for ${channelQuery}.`,
      };
    }

    await wait(850);
  }

  return {
    ok: true,
    message: `YouTube channel results are open for ${channelQuery}, but I could not identify the channel automatically.`,
  };
}

async function playFirstYoutubeResult(query) {
  const searchQuery = String(query || "").trim() || "music";
  await loadAutomationUrl(`https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`);
  await wait(1000);
  const clicked = await clickFirstYoutubeVideo();
  return clicked.ok
    ? {
        ...clicked,
        message: `Playing ${searchQuery}.`,
      }
    : clicked;
}

async function openCommandWindow(url) {
  await loadAutomationUrl(url);
  return {
    ok: true,
    message: `Opened ${url}.`,
  };
}

async function openDesktopApp(appName) {
  const normalizedName = String(appName || "").trim().toLowerCase();
  const appAliases = {
    "file explorer": "explorer",
    "command prompt": "cmd",
  };
  const appKey = appAliases[normalizedName] || normalizedName;
  const apps = {
    calculator: { command: "calc.exe", label: "Calculator" },
    notepad: { command: "notepad.exe", label: "Notepad" },
    explorer: { command: "explorer.exe", label: "File Explorer" },
    paint: { command: "mspaint.exe", label: "Paint" },
    settings: { command: "cmd.exe", args: ["/c", "start", "ms-settings:"], label: "Settings" },
    camera: { command: "cmd.exe", args: ["/c", "start", "microsoft.windows.camera:"], label: "Camera" },
    terminal: { command: "wt.exe", label: "Windows Terminal" },
    powershell: { command: "powershell.exe", label: "PowerShell" },
    cmd: { command: "cmd.exe", label: "Command Prompt" },
  };
  const appConfig = apps[appKey];
  if (!appConfig) {
    return {
      ok: false,
      message: `I do not know how to open ${appName || "that app"} yet.`,
    };
  }

  try {
    const child = spawn(appConfig.command, appConfig.args || [], {
      detached: true,
      stdio: "ignore",
      windowsHide: false,
    });
    child.unref();
    return {
      ok: true,
      message: `${appConfig.label} is open.`,
    };
  } catch (error) {
    return {
      ok: false,
      message: `I could not open ${appConfig.label}. ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

async function openBluetoothSettings() {
  const child = spawn("cmd.exe", ["/c", "start", "ms-settings:bluetooth"], {
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });
  child.unref();

  return {
    ok: true,
    message: "Bluetooth settings are open. Pair your phone first, then the Aubit mobile companion app can receive commands.",
  };
}

function getPhoneBridgeStatus() {
  return {
    ok: true,
    message:
      "Bluetooth phone bridge is ready on the PC side. To control the phone, pair it over Bluetooth and run the Aubit companion app on the phone so it can listen for approved commands.",
    requiresMobileApp: true,
  };
}

function runPhoneBridgeCommand(action) {
  const actionLabel = String(action || "that phone action").trim();
  return {
    ok: false,
    message:
      `I prepared the Bluetooth phone command for ${actionLabel}, but the phone companion app is not connected yet. Pair the phone and run the Aubit mobile bridge first.`,
    requiresMobileApp: true,
    action: actionLabel,
  };
}

async function runDesktopCommand(payload = {}) {
  const command = typeof payload.command === "string" ? payload.command : "";
  const contact = typeof payload.contact === "string" ? payload.contact.trim() : "";
  const phone = typeof payload.phone === "string" ? payload.phone.trim() : "";
  const message = typeof payload.message === "string" ? payload.message.trim() : "";
  const query = typeof payload.query === "string" ? payload.query.trim() : "";
  const url = typeof payload.url === "string" ? payload.url.trim() : "";
  const site = typeof payload.site === "string" ? payload.site.trim() : "";
  const direction = typeof payload.direction === "string" ? payload.direction.trim() : "";
  const targetPath = typeof payload.path === "string" ? payload.path.trim() : "";
  const to = typeof payload.to === "string" ? payload.to.trim() : "";
  const subject = typeof payload.subject === "string" ? payload.subject.trim() : "";
  const body = typeof payload.body === "string" ? payload.body.trim() : "";

  const commonSites = {
    youtube: "https://www.youtube.com",
    google: "https://www.google.com",
    instagram: "https://www.instagram.com",
    whatsapp: "https://web.whatsapp.com",
    gmail: "https://mail.google.com",
    maps: "https://maps.google.com",
    drive: "https://drive.google.com",
    docs: "https://docs.google.com",
    wikipedia: "https://www.wikipedia.org",
    chatgpt: "https://chatgpt.com",
    news: "https://news.google.com/topstories?hl=en-US&gl=US&ceid=US%3Aen",
    world_news: "https://news.google.com/search?q=world%20news&hl=en-US&gl=US&ceid=US%3Aen",
    youtube_music: "https://music.youtube.com",
    spotify: "https://open.spotify.com",
  };

  if (command === "open_youtube") {
    await loadAutomationUrl("https://www.youtube.com");
    return {
      ok: true,
      message: "YouTube is open.",
    };
  }

  if (command === "open_desktop_app") {
    return openDesktopApp(query || message);
  }

  if (command === "open_bluetooth_settings") {
    return openBluetoothSettings();
  }

  if (command === "phone_bridge_status") {
    return getPhoneBridgeStatus();
  }

  if (command === "phone_bridge_command") {
    return runPhoneBridgeCommand(query || message);
  }

  if (command === "open_youtube_search") {
    const searchQuery = query || "Aubit";
    await loadAutomationUrl(`https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`);
    return {
      ok: true,
      message: `YouTube search is open for ${searchQuery}.`,
    };
  }

  if (command === "play_youtube_result") {
    return playFirstYoutubeResult(query);
  }

  if (command === "open_youtube_channel") {
    return openYoutubeChannel(query);
  }

  if (command === "click_first_youtube_video") {
    return clickFirstYoutubeVideo();
  }

  if (command === "click_youtube_video_by_title") {
    return clickYoutubeVideoByTitle(query || message);
  }

  if (command === "close_automation_window") {
    return closeAutomationWindow();
  }

  if (command === "pause_media") {
    return controlAutomationMedia("pause");
  }

  if (command === "play_media") {
    return controlAutomationMedia("play");
  }

  if (command === "open_google") {
    await loadAutomationUrl("https://www.google.com");
    return {
      ok: true,
      message: "Google is open.",
    };
  }

  if (command === "open_google_search") {
    return openFirstGoogleResult(query);
  }

  if (command === "show_google_results") {
    return showGoogleResults(query || message);
  }

  if (command === "type_google_search") {
    return typeGoogleSearch(query || message);
  }

  if (command === "open_instagram") {
    await loadAutomationUrl("https://www.instagram.com");
    return {
      ok: true,
      message: "Instagram is open.",
    };
  }

  if (command === "open_instagram_reel_screenshot") {
    const windowRef = await loadAutomationUrl("https://www.instagram.com/reels/");
    const reelState = await prepareInstagramReel(windowRef);
    const screenshotPath = await captureAutomationWindow("instagram-reel");
    return {
      ok: true,
      message: reelState?.paused
        ? `Instagram reel paused and screenshot saved to ${screenshotPath}.`
        : `Instagram opened and screenshot saved to ${screenshotPath}. Log in if a reel was not available.`,
      screenshotPath,
    };
  }

  if (command === "open_whatsapp") {
    await loadAutomationUrl("https://web.whatsapp.com");
    return {
      ok: true,
      message: "WhatsApp Web is open.",
    };
  }

  if (command === "open_whatsapp_chat") {
    const chatName = query || contact;
    const windowRef = await loadAutomationUrl("https://web.whatsapp.com");
    await wait(2400);
    const opened = await searchWhatsappConversation(windowRef, chatName);
    return {
      ok: opened,
      message: opened
        ? `WhatsApp chat opened for ${chatName}.`
        : `WhatsApp is open, but I could not find ${chatName}. Make sure you are logged in and the chat exists.`,
    };
  }

  if (command === "send_whatsapp_message") {
    if (!phone || !message) {
      return {
        ok: false,
        message: "I need both a saved phone number and a message before I can use WhatsApp.",
      };
    }

    const windowRef = await loadAutomationUrl(
      `https://web.whatsapp.com/send?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(message)}`,
    );
    await wait(2400);
    const sent = await attemptWhatsappSend(windowRef);

    return {
      ok: true,
      message: sent
        ? `WhatsApp message sent to ${contact || phone}.`
        : `WhatsApp opened for ${contact || phone}. If you are not logged in, please scan QR and press send.`,
      delivered: sent,
    };
  }

  if (command === "scroll_automation") {
    return scrollAutomationWindow(direction || "down");
  }

  if (command === "capture_window") {
    const screenshotPath = await captureAutomationWindow("aubit-command");
    return {
      ok: true,
      message: `Screenshot saved to ${screenshotPath}.`,
      screenshotPath,
    };
  }

  if (command === "open_downloads") {
    await shell.openPath(getDownloadsPath());
    return {
      ok: true,
      message: "Downloads folder opened.",
    };
  }

  if (command === "compose_email") {
    if (!to) {
      return {
        ok: false,
        message: "I need an email address before I can open a draft.",
      };
    }

    return composeEmail(to, subject, body);
  }

  if (command === "open_named_site") {
    const siteUrl = commonSites[site.toLowerCase()];
    if (!siteUrl) {
      return {
        ok: false,
        message: `I do not have a shortcut for ${site} yet.`,
      };
    }

    await loadAutomationUrl(siteUrl);
    return {
      ok: true,
      message: site.toLowerCase() === "world_news" ? "World news is open." : `${site} is open.`,
    };
  }

  if (command === "open_path") {
    if (!targetPath) {
      return {
        ok: false,
        message: "I need a file path before I can open it.",
      };
    }

    const resolvedPath = path.resolve(targetPath);
    if (!fileExists(resolvedPath)) {
      return {
        ok: false,
        message: `I could not find ${resolvedPath}.`,
      };
    }

    const shellResult = await shell.openPath(resolvedPath);
    return {
      ok: !shellResult,
      message: shellResult ? `I could not open ${resolvedPath}. ${shellResult}` : `Opened ${resolvedPath}.`,
      path: resolvedPath,
    };
  }

  if (command === "open_pdf_url") {
    if (!url) {
      return {
        ok: false,
        message: "I need a PDF link before I can open it.",
      };
    }

    await loadAutomationUrl(url);
    return {
      ok: true,
      message: "PDF opened in the command window.",
    };
  }

  if (command === "download_pdf_url" || command === "download_url") {
    if (!url) {
      return {
        ok: false,
        message: "I need a download link before I can save it.",
      };
    }

    const download = await downloadUrlToDownloads(url, {
      fallbackBase: command === "download_pdf_url" ? "document" : "download",
    });
    return {
      ok: true,
      message: `Downloaded to ${download.targetPath}.`,
      path: download.targetPath,
      size: download.size,
    };
  }

  if (command === "open_current_pdf") {
    const pdfUrl = await findCurrentPdfUrl();
    if (!pdfUrl) {
      return {
        ok: false,
        message: "I could not find a PDF in the current command window.",
      };
    }

    await loadAutomationUrl(pdfUrl);
    return {
      ok: true,
      message: "Current PDF opened in the command window.",
      url: pdfUrl,
    };
  }

  if (command === "download_current_pdf") {
    const pdfUrl = await findCurrentPdfUrl();
    if (!pdfUrl) {
      return {
        ok: false,
        message: "I could not find a PDF in the current command window.",
      };
    }

    const download = await downloadUrlToDownloads(pdfUrl, {
      fallbackBase: "document",
    });
    return {
      ok: true,
      message: `PDF downloaded to ${download.targetPath}.`,
      path: download.targetPath,
      size: download.size,
    };
  }

  if (command === "download_current_page") {
    const currentUrl = getAutomationCurrentUrl();
    if (!currentUrl) {
      return {
        ok: false,
        message: "There is no active page open in the command window yet.",
      };
    }

    const download = await downloadUrlToDownloads(currentUrl, {
      fallbackBase: "current-page",
    });
    return {
      ok: true,
      message: `Saved the current page to ${download.targetPath}.`,
      path: download.targetPath,
      size: download.size,
    };
  }

  if (command === "system_status") {
    return getSystemStatus();
  }

  if (command === "open_url" && payload.url) {
    return openCommandWindow(String(payload.url));
  }

  return {
    ok: false,
    message: "I do not know that desktop command yet.",
  };
}

function checkBackendHealth(timeoutMs = 1200) {
  return new Promise((resolve) => {
    const request = http.get(
      `${getBackendBaseUrl()}${backendHealthPath}`,
      {
        timeout: timeoutMs,
      },
      (response) => {
        const chunks = [];
        response.on("data", (chunk) => {
          chunks.push(chunk);
        });
        response.on("end", () => {
          const rawBody = Buffer.concat(chunks).toString("utf8");
          try {
            const payload = rawBody ? JSON.parse(rawBody) : {};
            resolve({
              ok: response.statusCode === 200,
              payload,
            });
          } catch (_error) {
            resolve({
              ok: response.statusCode === 200,
              payload: null,
            });
          }
        });
      },
    );

    request.on("timeout", () => {
      request.destroy();
      resolve({ ok: false, payload: null });
    });
    request.on("error", () => {
      resolve({ ok: false, payload: null });
    });
  });
}

function getBackendLaunchCommand() {
  const appEntry = path.join(backendRootPath, "app", "main.py");
  if (!fileExists(appEntry)) {
    return null;
  }

  const env = {
    ...process.env,
    PYTHONUNBUFFERED: "1",
  };
  const candidates = [];

  if (!app.isPackaged) {
    candidates.push({
      command: path.join(backendRootPath, ".venv", "Scripts", "python.exe"),
      args: ["-m", "uvicorn", "app.main:app", "--host", backendHost, "--port", String(backendPort), "--app-dir", backendRootPath],
      cwd: backendRootPath,
      env,
      label: "backend-venv",
    });
  }

  candidates.push({
    command: "python",
    args: ["-m", "uvicorn", "app.main:app", "--host", backendHost, "--port", String(backendPort), "--app-dir", backendRootPath],
    cwd: backendRootPath,
    env,
    label: "system-python",
  });

  return candidates.find((candidate) => {
    if (candidate.command === "python") {
      return true;
    }

    return fileExists(candidate.command);
  }) || null;
}

async function ensureBackendRunning() {
  if (backendStartPromise) {
    return backendStartPromise;
  }

  backendStartPromise = (async () => {
    emitBackendStatus("checking");
    const healthyBackend = await checkBackendHealth();
    if (healthyBackend.ok) {
      emitBackendStatus("connected", {
        details: healthyBackend.payload?.data?.ai || null,
        source: "existing-backend",
      });
      return healthyBackend;
    }

    const launchConfig = getBackendLaunchCommand();
    if (!launchConfig) {
      emitBackendStatus("missing", {
        reason: "Backend files or Python runtime were not found.",
      });
      return { ok: false, payload: null };
    }

    backendStopRequested = false;
    emitBackendStatus("starting", {
      source: launchConfig.label,
    });

    backendProcess = spawn(launchConfig.command, launchConfig.args, {
      cwd: launchConfig.cwd,
      env: launchConfig.env,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    backendProcess.stdout.on("data", (chunk) => {
      relayBackendLog("stdout", chunk);
    });

    backendProcess.stderr.on("data", (chunk) => {
      relayBackendLog("stderr", chunk);
    });

    backendProcess.once("exit", (code, signal) => {
      const expected = backendStopRequested;
      backendProcess = null;
      if (!expected) {
        emitBackendStatus("stopped", {
          reason: `Backend exited unexpectedly (${signal || code || "unknown"}).`,
        });
      }
    });

    backendProcess.once("error", (error) => {
      safeConsoleWrite("error", "Failed to spawn Aubit backend:", error);
    });

    for (let attempt = 0; attempt < 30; attempt += 1) {
      await wait(500);
      const status = await checkBackendHealth();
      if (status.ok) {
        emitBackendStatus("connected", {
          details: status.payload?.data?.ai || null,
          source: launchConfig.label,
        });
        return status;
      }
    }

    emitBackendStatus("error", {
      reason: "Backend did not become healthy in time.",
    });
    return { ok: false, payload: null };
  })();

  try {
    return await backendStartPromise;
  } finally {
    backendStartPromise = null;
  }
}

function stopBackendProcess() {
  backendStopRequested = true;

  if (!backendProcess || backendProcess.killed) {
    backendProcess = null;
    return;
  }

  try {
    backendProcess.kill();
  } catch (_error) {
  }
}

function createMainWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    return mainWindow;
  }

  debugLog("creating main window", {
    mainEntryPath,
    iconPath: appIconPath,
  });
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 980,
    minWidth: 1240,
    minHeight: 760,
    show: false,
    title: "Aubit Desktop",
    icon: appIconPath,
    backgroundColor: "#f8f4ee",
    autoHideMenuBar: true,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });

  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL) => {
    debugLog("main window did-fail-load", { errorCode, errorDescription, validatedURL });
  });
  mainWindow.webContents.on("console-message", (_event, level, message, line, sourceId) => {
    debugLog("main window console-message", { level, message, line, sourceId });
  });
  mainWindow.webContents.on("render-process-gone", (_event, details) => {
    debugLog("main window render-process-gone", details);
  });

  mainWindow.loadFile(mainEntryPath);
  mainWindow.once("ready-to-show", () => {
    debugLog("main window ready-to-show");
    if (!widgetWindow?.isVisible()) {
      mainWindow.show();
    }
  });
  mainWindow.setIcon(appIconPath);
  mainWindow.setAppDetails({
    appId: "com.aubit.desktopassistant",
    appIconPath,
    appIconIndex: 0,
    relaunchCommand: process.execPath,
  });

  mainWindow.on("close", (event) => {
    debugLog("main window close requested", { isQuitting });
    if (isQuitting) {
      return;
    }

    isQuitting = true;

    if (widgetWindow && !widgetWindow.isDestroyed()) {
      widgetWindow.destroy();
      widgetWindow = null;
    }

    app.quit();
  });

  mainWindow.on("closed", () => {
    debugLog("main window closed");
    mainWindow = null;
  });

  return mainWindow;
}

function placeWidgetWindow() {
  if (!widgetWindow || widgetWindow.isDestroyed()) {
    return;
  }

  const display = screen.getPrimaryDisplay();
  const { width, height, x, y } = display.workArea;
  const bounds = widgetWindow.getBounds();
  const nextX = Math.round(x + width - bounds.width - 28);
  const nextY = Math.round(y + height - bounds.height - 42);
  widgetWindow.setPosition(nextX, nextY);
}

function createWidgetWindow() {
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    return widgetWindow;
  }

  debugLog("creating widget window", {
    widgetEntryPath,
  });
  widgetWindow = new BrowserWindow({
    width: 510,
    height: 390,
    minWidth: 420,
    minHeight: 320,
    maxWidth: 640,
    maxHeight: 500,
    show: false,
    frame: false,
    transparent: true,
    resizable: true,
    movable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    title: "Aubit Widget",
    icon: appIconPath,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });

  widgetWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL) => {
    debugLog("widget window did-fail-load", { errorCode, errorDescription, validatedURL });
  });

  widgetWindow.loadFile(widgetEntryPath);
  widgetWindow.once("ready-to-show", () => {
    debugLog("widget window ready-to-show");
    placeWidgetWindow();
  });

  widgetWindow.on("closed", () => {
    debugLog("widget window closed");
    widgetWindow = null;
  });

  widgetWindow.setAlwaysOnTop(true, "screen-saver");
  widgetWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  widgetWindow.setIcon(appIconPath);

  return widgetWindow;
}

function showMainWindow(trigger = "system") {
  createMainWindow();
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    widgetWindow.hide();
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.show();
    mainWindow.focus();
  }

  broadcastShellEvent({ type: "immersive-mode-entered", trigger });
}

function enterWidgetMode(options = {}) {
  const trigger = options.trigger || "system";
  createWidgetWindow();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.hide();
  }

  if (widgetWindow && !widgetWindow.isDestroyed()) {
    placeWidgetWindow();
    if (typeof widgetWindow.showInactive === "function") {
      widgetWindow.showInactive();
    } else {
      widgetWindow.show();
    }
  }

  broadcastShellEvent({ type: "widget-mode-entered", trigger });
}

function createTray() {
  if (tray) {
    return tray;
  }

  const trayIcon = [trayIconPath, appIconPath, process.execPath]
    .map((candidatePath) => {
      if (!candidatePath || !fileExists(candidatePath)) {
        return nativeImage.createEmpty();
      }

      return nativeImage.createFromPath(candidatePath);
    })
    .find((candidateImage) => !candidateImage.isEmpty());

  if (!trayIcon) {
    debugLog("tray icon not found");
    safeConsoleWrite("error", "Tray icon was not found. Continuing without a tray menu.");
    return null;
  }

  try {
    tray = new Tray(trayIcon.resize({ width: 16, height: 16 }));
  } catch (error) {
    debugLog("failed to create tray", error);
    safeConsoleWrite("error", "Failed to create Aubit tray icon:", error);
    return null;
  }

  tray.setToolTip("Aubit Desktop");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: "Show Widget",
        click: () => enterWidgetMode({ trigger: "tray-widget" }),
      },
      {
        label: "Open Immersive App",
        click: () => showMainWindow("tray-main"),
      },
      { type: "separator" },
      {
        label: "Quit Aubit",
        click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ]),
  );
  tray.on("double-click", () => {
    if (widgetWindow?.isVisible()) {
      showMainWindow("tray-double-click");
      return;
    }

    enterWidgetMode({ trigger: "tray-double-click" });
  });

  return tray;
}

ipcMain.handle("shell:enter-widget-mode", () => {
  enterWidgetMode({ trigger: "renderer-request" });
  return { ok: true };
});

ipcMain.handle("shell:exit-widget-mode", () => {
  showMainWindow("widget-request");
  return { ok: true };
});

ipcMain.handle("shell:open-main-window", () => {
  showMainWindow("renderer-request");
  return { ok: true };
});

ipcMain.handle("shell:open-panel", (_event, payload = {}) => {
  const panel = typeof payload.panel === "string" ? payload.panel : "";
  const topic = typeof payload.topic === "string" ? payload.topic.trim() : "";

  showMainWindow(panel ? `panel-${panel}` : "panel-request");
  broadcastShellEvent({
    type: "panel-requested",
    panel,
    topic,
    trigger: "renderer-request",
  });

  return {
    ok: true,
    panel,
    topic,
  };
});

ipcMain.handle("shell:run-command", async (_event, payload = {}) => {
  try {
    return await runDesktopCommand(payload);
  } catch (error) {
    debugLog("shell:run-command failed", error, payload);
    return {
      ok: false,
      message: `That command hit a problem: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
});

ipcMain.handle("shell:quit", () => {
  isQuitting = true;
  app.quit();
  return { ok: true };
});

ipcMain.handle("shell:widget-wake", () => {
  enterWidgetMode({ trigger: "wake-request" });
  return { ok: true };
});

app.whenReady().then(() => {
  debugLog("app.whenReady");
  app.setAppUserModelId("com.aubit.desktopassistant");
  Menu.setApplicationMenu(null);
  installPermissionHandlers();
  ensureBackendRunning();
  createMainWindow();
  createTray();
  screen.on("display-metrics-changed", () => {
    placeWidgetWindow();
  });

  app.on("activate", () => {
    debugLog("app activate");
    showMainWindow("activate");
  });
});

app.on("before-quit", () => {
  debugLog("before-quit");
  isQuitting = true;
  stopBackendProcess();
});

app.on("window-all-closed", () => {
  debugLog("window-all-closed", { platform: process.platform });
  if (process.platform !== "darwin") {
    app.quit();
  }
});
