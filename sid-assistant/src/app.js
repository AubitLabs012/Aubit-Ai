const chatLog = document.getElementById("chatLog");
const commandForm = document.getElementById("commandForm");
const commandInput = document.getElementById("commandInput");
const micButton = document.getElementById("micButton");
const sidMood = document.getElementById("sidMood");
const sidLine = document.getElementById("sidLine");
const statusPill = document.getElementById("statusPill");
const memoryList = document.getElementById("memoryList");
const missionList = document.getElementById("missionList");
const permissionModal = document.getElementById("permissionModal");
const permissionTitle = document.getElementById("permissionTitle");
const permissionText = document.getElementById("permissionText");
const allowAction = document.getElementById("allowAction");
const denyAction = document.getElementById("denyAction");

const storageKeys = {
  memory: "sid.memory.v1",
  missions: "sid.missions.v1",
};

const state = {
  memory: loadJson(storageKeys.memory, []),
  missions: loadJson(storageKeys.missions, [
    { title: "Voice interface", detail: "Listen through browser speech recognition and answer with speech synthesis." },
    { title: "Guarded tools", detail: "Ask permission before desktop actions." },
    { title: "LLM brain", detail: "Ready for an API-backed model in the next phase." },
  ]),
  recognition: null,
  listening: false,
};

function loadJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch (_error) {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function addMessage(role, text) {
  const item = document.createElement("article");
  item.className = `message ${role}`;
  item.innerHTML = `<strong>${role === "user" ? "You" : "SID"}</strong><p></p>`;
  item.querySelector("p").textContent = text;
  chatLog.append(item);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function speak(text) {
  if (!("speechSynthesis" in window)) {
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1.08;
  utterance.volume = 0.95;
  const voices = window.speechSynthesis.getVoices();
  utterance.voice = voices.find((voice) => /female|zira|susan|samantha|aria/i.test(voice.name)) || voices[0] || null;
  window.speechSynthesis.speak(utterance);
}

function setSidStatus(mood, line, status = "Online") {
  sidMood.textContent = mood;
  sidLine.textContent = line;
  statusPill.textContent = status;
}

function renderMemory() {
  memoryList.innerHTML = "";
  if (!state.memory.length) {
    memoryList.innerHTML = `<article class="memory-item"><strong>No memories yet</strong><p>Say "remember that..." and SID will keep it here.</p></article>`;
    return;
  }

  state.memory.forEach((memory, index) => {
    const item = document.createElement("article");
    item.className = "memory-item";
    item.innerHTML = `<strong>Memory ${index + 1}</strong><p></p>`;
    item.querySelector("p").textContent = memory;
    memoryList.append(item);
  });
}

function renderMissions() {
  missionList.innerHTML = "";
  state.missions.forEach((mission, index) => {
    const item = document.createElement("article");
    item.className = "mission-item";
    item.innerHTML = `<strong>${index + 1}. ${mission.title}</strong><p></p>`;
    item.querySelector("p").textContent = mission.detail;
    missionList.append(item);
  });
}

function requestPermission(title, text) {
  permissionTitle.textContent = title;
  permissionText.textContent = text;
  permissionModal.hidden = false;

  return new Promise((resolve) => {
    const cleanup = () => {
      permissionModal.hidden = true;
      allowAction.removeEventListener("click", onAllow);
      denyAction.removeEventListener("click", onDeny);
    };
    const onAllow = () => {
      cleanup();
      resolve(true);
    };
    const onDeny = () => {
      cleanup();
      resolve(false);
    };

    allowAction.addEventListener("click", onAllow);
    denyAction.addEventListener("click", onDeny);
  });
}

async function runDesktopAction(payload, label) {
  if (!window.sidDesktop?.isDesktopShell) {
    return "Desktop shell is not available. Start SID through Electron to use system tools.";
  }

  const allowed = await requestPermission("Run desktop action?", label);
  if (!allowed) {
    return "Cancelled. I will not run that action.";
  }

  const result = await window.sidDesktop.runAction(payload);
  return result.message || (result.ok ? "Done." : "That action failed.");
}

function buildPlan(topic) {
  return [
    `Define the exact outcome for ${topic}.`,
    "Break the work into research, build, test, and polish.",
    "Do the smallest useful version first.",
    "Verify it, then expand features one by one.",
  ].join("\n");
}

async function answerCommand(rawText) {
  const text = rawText.trim();
  const lower = text.toLowerCase();

  if (!text) {
    return "";
  }

  if (lower.startsWith("remember that ") || lower.startsWith("remember ")) {
    const memory = text.replace(/^remember that\s+/i, "").replace(/^remember\s+/i, "").trim();
    state.memory.unshift(memory);
    saveJson(storageKeys.memory, state.memory);
    renderMemory();
    return `Remembered: ${memory}`;
  }

  if (lower.includes("what can you do") || lower.includes("capabilities")) {
    return [
      "I can talk, listen, remember notes, plan work, open selected apps, open web links, and report basic system info.",
      "The next phase is connecting my brain to a real LLM and adding file, calendar, browser, and project tools with permission gates.",
    ].join("\n\n");
  }

  if (lower.startsWith("plan ")) {
    const topic = text.slice(5).trim() || "the mission";
    return buildPlan(topic);
  }

  if (lower.includes("system info")) {
    return runDesktopAction({ action: "systemInfo" }, "SID will read basic computer information.");
  }

  const openAppMatch = lower.match(/^open\s+(calculator|notepad|paint|explorer|files)$/);
  if (openAppMatch) {
    const appName = openAppMatch[1] === "files" ? "explorer" : openAppMatch[1];
    return runDesktopAction({ action: "openApp", appName }, `SID will open ${appName}.`);
  }

  const openUrlMatch = text.match(/^open\s+(https?:\/\/\S+)$/i);
  if (openUrlMatch) {
    return runDesktopAction({ action: "openUrl", url: openUrlMatch[1] }, `SID will open ${openUrlMatch[1]} in your browser.`);
  }

  if (lower.includes("friday") || lower.includes("ultron")) {
    return "FRIDAY is the inspiration. SID will be the practical version: voice, memory, tools, screen awareness, and real work automation.";
  }

  return [
    "I understand the command, but my full LLM brain is not connected yet.",
    "For now try: remember that..., plan <topic>, open calculator, open notepad, open https://chatgpt.com, system info, or what can you do.",
  ].join("\n\n");
}

async function handleCommand(text) {
  addMessage("user", text);
  setSidStatus("Thinking", "Processing your request...", "Working");
  const response = await answerCommand(text);
  addMessage("sid", response);
  setSidStatus("Ready", response.split("\n")[0], "Online");
  speak(response);
}

function setupSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    micButton.title = "Speech recognition is not available in this browser engine.";
    return;
  }

  state.recognition = new SpeechRecognition();
  state.recognition.continuous = false;
  state.recognition.interimResults = false;
  state.recognition.lang = "en-US";

  state.recognition.onstart = () => {
    state.listening = true;
    micButton.classList.add("active");
    setSidStatus("Listening", "I am listening.", "Voice active");
  };

  state.recognition.onend = () => {
    state.listening = false;
    micButton.classList.remove("active");
    setSidStatus("Ready", "Voice channel closed.", "Online");
  };

  state.recognition.onresult = (event) => {
    const transcript = event.results?.[0]?.[0]?.transcript || "";
    commandInput.value = transcript;
    handleCommand(transcript);
  };
}

commandForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = commandInput.value.trim();
  commandInput.value = "";
  handleCommand(text);
});

micButton.addEventListener("click", () => {
  if (!state.recognition) {
    setSidStatus("Voice unavailable", "Speech recognition is not available here.", "Text only");
    return;
  }

  if (state.listening) {
    state.recognition.stop();
    return;
  }

  state.recognition.start();
});

document.querySelectorAll("[data-panel]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-panel]").forEach((item) => item.classList.toggle("active", item === button));
    document.querySelectorAll(".panel").forEach((panel) => panel.classList.remove("active"));
    document.getElementById(`${button.dataset.panel}Panel`).classList.add("active");
  });
});

document.querySelectorAll("[data-quick]").forEach((button) => {
  button.addEventListener("click", () => {
    handleCommand(button.dataset.quick);
  });
});

renderMemory();
renderMissions();
setupSpeechRecognition();
addMessage("sid", "Hello. I am SID, your new assistant. My first build can listen, speak, remember, plan, and run guarded desktop tools.");
