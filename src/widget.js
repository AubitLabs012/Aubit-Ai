const desktopShell = window.aubitDesktop || null;
const widgetShellButton = document.getElementById("widgetShellButton");
const widgetBubble = document.getElementById("widgetBubble");
const widgetDebug = document.getElementById("widgetDebug");
const AUTH_DISPLAY_NAME_STORAGE_KEY = "aubit.auth.display-name.v1";
const PREFERRED_USER_NAME_STORAGE_KEY = "aubit.user.preferred-name.v1";
let preferredUserName = "";
let widgetPrompt = "";
let widgetCommandPrompt = "";
const apiBaseCandidates = ["http://127.0.0.1:8000/api", "http://127.0.0.1:8001/api"];
const contactStorageKey = "aubit.shell.contacts.v1";
const AUTO_LISTEN_DELAY_MS = 650;
const WAKE_COMMAND_LISTEN_DELAY_MS = 900;
const RECORDING_SILENCE_TO_PROCESS_MS = 680;
const RECORDING_NO_SPEECH_TIMEOUT_MS = 8000;
const RECORDING_PASSIVE_NO_SPEECH_TIMEOUT_MS = 6000;
const RECORDING_MAX_DURATION_MS = 120000;
const RECORDING_PASSIVE_MAX_DURATION_MS = 9000;
const WAKE_PHRASE_ALIASES = [
  "aubit",
  "orbit",
  "obit",
  "aubot",
  "a bot",
  "hey bit",
  "habit",
];
const RECORDING_TIMESLICE_MS = 40;
const BARGE_IN_LISTEN_DELAY_MS = 900;
const SPEECH_RECOGNITION_LANG = "en-US";
const PREFER_SERVER_TRANSCRIPTION = true;
const VOICE_PROFILE = "natural_english";
const assistantTimerStorageKey = "aubit.shell.assistant-timers.v1";

const expressionCycle = ["curious", "happy", "thinking", "listening", "surprised", "awake"];

const state = {
  expressionIndex: 0,
  expressionTimer: null,
  emotionTimer: null,
  sleepTimer: null,
  sequenceToken: 0,
  recognition: null,
  listening: false,
  autoListenEnabled: false,
  autoListenTimer: null,
  wakeCommandTimer: null,
  manualStop: false,
  handledTranscript: false,
  authToken: "",
  authReady: null,
  apiBaseUrl: "",
  apiBaseReady: null,
  micPermission: "unknown",
  micReady: false,
  micAccessReady: null,
  voicePrimed: false,
  lastRecognitionError: "",
  mediaRecorder: null,
  recordingStream: null,
  recordingChunks: [],
  recordingMimeType: "audio/webm",
  recordingFrame: 0,
  recordingStartedAt: 0,
  recordingLastVoiceAt: 0,
  recordingNoiseFloor: 0,
  speechDetected: false,
  transcribing: false,
  awaitingCommandAfterWake: false,
  passiveWakeMode: false,
  audioUnlocked: false,
  sttMode: "idle",
  sttDetail: "idle",
  assistantTimers: [],
};

function normalizePreferredUserName(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 24);
}

function readStoredPreferredUserName() {
  try {
    return normalizePreferredUserName(
      window.localStorage.getItem(AUTH_DISPLAY_NAME_STORAGE_KEY) ||
        window.localStorage.getItem(PREFERRED_USER_NAME_STORAGE_KEY) ||
        "",
    );
  } catch (_error) {
    return "";
  }
}

function refreshPromptCopy() {
  preferredUserName = readStoredPreferredUserName();
  const greetingName = preferredUserName ? ` ${preferredUserName}` : "";
  widgetPrompt = `Hi${greetingName}, how are you today? I'm here with you for long talks, quick help, or a laugh whenever you need one.`;
  widgetCommandPrompt = preferredUserName
    ? `I'm ready, ${preferredUserName}. What would you like to do?`
    : "I'm ready. What would you like to do?";
}

refreshPromptCopy();

function pause(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function normalizeAssistantText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s:+.-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function clearExpressionTimer() {
  window.clearTimeout(state.expressionTimer);
  state.expressionTimer = null;
}

function clearEmotionTimer() {
  window.clearTimeout(state.emotionTimer);
  state.emotionTimer = null;
}

function clearSleepTimer() {
  window.clearTimeout(state.sleepTimer);
  state.sleepTimer = null;
}

function clearAutoListenTimer() {
  window.clearTimeout(state.autoListenTimer);
  state.autoListenTimer = null;
}

function clearWakeCommandTimer() {
  window.clearTimeout(state.wakeCommandTimer);
  state.wakeCommandTimer = null;
}

function clearRecordingFrame() {
  if (state.recordingFrame) {
    window.cancelAnimationFrame(state.recordingFrame);
    state.recordingFrame = 0;
  }
}

function isVoiceOutputActive() {
  return Boolean(
    activeWidgetAudio ||
      (window.speechSynthesis && (window.speechSynthesis.speaking || window.speechSynthesis.pending)),
  );
}

function formatAssistantTime(date = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function formatAssistantDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function parseDurationMs(text) {
  const normalized = normalizeAssistantText(text);
  if (!normalized) {
    return 0;
  }

  let totalMs = 0;
  const patterns = [
    { regex: /(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)/gi, multiplier: 60 * 60 * 1000 },
    { regex: /(\d+(?:\.\d+)?)\s*(?:minutes?|mins?|minute|min)/gi, multiplier: 60 * 1000 },
    { regex: /(\d+(?:\.\d+)?)\s*(?:seconds?|secs?|second|sec)/gi, multiplier: 1000 },
  ];

  patterns.forEach(({ regex, multiplier }) => {
    for (const match of normalized.matchAll(regex)) {
      totalMs += Number(match[1]) * multiplier;
    }
  });

  const plainNumber = normalized.match(/^(\d+(?:\.\d+)?)$/);
  if (!totalMs && plainNumber) {
    totalMs = Number(plainNumber[1]) * 60 * 1000;
  }

  return Number.isFinite(totalMs) ? Math.round(totalMs) : 0;
}

function describeDuration(ms) {
  const totalSeconds = Math.max(1, Math.round(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];

  if (hours) {
    parts.push(`${hours} hour${hours === 1 ? "" : "s"}`);
  }
  if (minutes) {
    parts.push(`${minutes} minute${minutes === 1 ? "" : "s"}`);
  }
  if (seconds && !hours) {
    parts.push(`${seconds} second${seconds === 1 ? "" : "s"}`);
  }

  return parts.join(" ");
}

function rememberAssistantTimers() {
  try {
    const timers = state.assistantTimers.map((timer) => ({
      id: timer.id,
      label: timer.label,
      fireAt: timer.fireAt,
    }));
    window.localStorage.setItem(assistantTimerStorageKey, JSON.stringify(timers));
  } catch (_error) {
  }
}

function clearAssistantTimer(timerId) {
  const index = state.assistantTimers.findIndex((timer) => timer.id === timerId);
  if (index < 0) {
    return false;
  }

  window.clearTimeout(state.assistantTimers[index].timeoutId);
  state.assistantTimers.splice(index, 1);
  rememberAssistantTimers();
  return true;
}

function scheduleAssistantTimer(durationMs, label = "timer") {
  const id = `timer-${Date.now()}-${Math.round(Math.random() * 10000)}`;
  const fireAt = Date.now() + durationMs;
  const timeoutId = window.setTimeout(() => {
    clearAssistantTimer(id);
    holdEmotion("happy", 5200);
    showBubble(`${label} finished. Time is up.`, { speak: true });
  }, Math.max(1000, durationMs));

  state.assistantTimers.push({
    id,
    label,
    fireAt,
    timeoutId,
  });
  rememberAssistantTimers();
  return { id, label, fireAt };
}

function restoreAssistantTimers() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(assistantTimerStorageKey) || "[]");
    if (!Array.isArray(parsed)) {
      return;
    }

    parsed.forEach((timer) => {
      const remaining = Number(timer?.fireAt || 0) - Date.now();
      if (remaining > 1000) {
        scheduleAssistantTimer(remaining, timer.label || "timer");
      }
    });
  } catch (_error) {
  }
}

function setGaze(x, y) {
  document.documentElement.style.setProperty("--gaze-x", `${x}px`);
  document.documentElement.style.setProperty("--gaze-y", `${y}px`);
}

function splitSpeechIntoChunks(text, maxLength = 95) {
  const cleaned = String(text || "").replace(/\s+/g, " ").trim();
  if (!cleaned) {
    return [];
  }

  const parts = cleaned.split(/(?<=[.!?])\s+/);
  const chunks = [];
  let current = "";

  parts.forEach((part) => {
    const next = part.trim();
    if (!next) {
      return;
    }

    if (!current) {
      current = next;
      return;
    }

    if (`${current} ${next}`.length <= maxLength) {
      current = `${current} ${next}`;
      return;
    }

    chunks.push(current);
    current = next;
  });

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

function chooseNaturalBrowserVoice(voices) {
  const availableVoices = Array.isArray(voices) ? voices : [];
  const preferredPatterns = [
    { lang: /en/i, name: /guy|davis|ryan|andrew|david|mark|alex|daniel|thomas|aaron|male/i },
    { lang: /en/i, name: /google|microsoft|natural|online/i },
  ];

  for (const pattern of preferredPatterns) {
    const voice = availableVoices.find((candidate) => (
      pattern.lang.test(candidate.lang || "") && pattern.name.test(candidate.name || "")
    ));
    if (voice) {
      return voice;
    }
  }

  return availableVoices.find((voice) => /en-US|en-GB|en-IN/i.test(voice.lang || ""))
    || availableVoices.find((voice) => /^en/i.test(voice.lang || ""))
    || null;
}

function speak(text) {
  if (!("speechSynthesis" in window) || !text) {
    return;
  }

  const chunks = splitSpeechIntoChunks(text);
  if (!chunks.length) {
    return;
  }

  window.speechSynthesis.cancel();
  window.speechSynthesis.resume();
  setVoiceSpeaking(true);

  const speakChunk = (index) => {
    if (index >= chunks.length) {
      setVoiceSpeaking(false);
      queueAutoListen(BARGE_IN_LISTEN_DELAY_MS);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(chunks[index]);
    utterance.lang = "en-US";
    utterance.rate = 1.02;
    utterance.pitch = 0.92;
    utterance.volume = 1;
    const voices = window.speechSynthesis.getVoices?.() || [];
    const preferredVoice = chooseNaturalBrowserVoice(voices);
    if (preferredVoice) {
      utterance.voice = preferredVoice;
      utterance.lang = preferredVoice.lang || utterance.lang;
    }
    utterance.onend = () => {
      window.setTimeout(() => speakChunk(index + 1), 35);
    };
    utterance.onerror = () => {
      setVoiceSpeaking(false);
      queueAutoListen(BARGE_IN_LISTEN_DELAY_MS);
    };
    window.speechSynthesis.speak(utterance);
  };

  speakChunk(0);
}

function unlockAudioPlayback() {
  state.audioUnlocked = true;
  if ("speechSynthesis" in window) {
    try {
      window.speechSynthesis.resume();
    } catch (_error) {
    }
  }
}

let activeWidgetAudio = null;

function stopWidgetSpeech() {
  setVoiceSpeaking(false);
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }

  if (activeWidgetAudio) {
    try {
      activeWidgetAudio.pause();
    } catch (_error) {
    }
    activeWidgetAudio = null;
  }
}

function playBackendVoicePreview(voicePreview, fallbackText = "") {
  const audioBase64 = voicePreview?.audio_base64;
  const mimeType = voicePreview?.mime_type || "audio/wav";
  if (!audioBase64) {
    return false;
  }

  stopWidgetSpeech();
  const audio = new Audio(`data:${mimeType};base64,${audioBase64}`);
  activeWidgetAudio = audio;
  setVoiceSpeaking(true);
  audio.addEventListener(
    "ended",
    () => {
      if (activeWidgetAudio === audio) {
        activeWidgetAudio = null;
      }
      setVoiceSpeaking(false);
      queueAutoListen();
    },
    { once: true },
  );
  audio.addEventListener(
    "error",
    () => {
      if (activeWidgetAudio === audio) {
        activeWidgetAudio = null;
      }
      setVoiceSpeaking(false);
    },
    { once: true },
  );

  audio.play().then(() => {
    state.audioUnlocked = true;
  }).catch(() => {
    if (activeWidgetAudio === audio) {
      activeWidgetAudio = null;
    }
    setVoiceSpeaking(false);
    if (fallbackText) {
      speak(fallbackText);
    }
  });
  return true;
}

function truncateBubbleText(text, maxLength = 420) {
  const cleaned = String(text || "").replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return `${cleaned.slice(0, maxLength - 1).trim()}...`;
}

function showBubble(text = widgetPrompt, options = {}) {
  widgetBubble.textContent = "";
  widgetBubble.classList.remove("is-visible");
  widgetBubble.setAttribute("aria-hidden", "true");

  if (options.speak) {
    if (!playBackendVoicePreview(options.voicePreview, text)) {
      speak(text);
    }
  }
}

function setDebugStatus(mode, detail = "") {
  state.sttMode = mode;
  state.sttDetail = detail;
  if (!widgetDebug) {
    return;
  }

  widgetDebug.textContent = "";
  widgetDebug.setAttribute("aria-hidden", "true");
}

function setSpeechProcessing(isProcessing) {
  state.transcribing = Boolean(isProcessing);
  document.body.toggleAttribute("data-speech-processing", state.transcribing);
}

function setVoiceSpeaking(isSpeaking) {
  document.body.toggleAttribute("data-speaking", Boolean(isSpeaking));
}

function setExpression(expression) {
  document.body.dataset.expression = expression;
}

function holdEmotion(expression, duration = 4200) {
  clearEmotionTimer();
  setExpression(expression);

  if (!duration) {
    return;
  }

  state.emotionTimer = window.setTimeout(() => {
    if (!state.listening) {
      setExpression("awake");
    }
  }, duration);
}

function setShellMode(mode) {
  document.body.dataset.shellMode = mode;
}

function scheduleSleepMode() {
  clearSleepTimer();
}

function scheduleNextExpression() {
  clearExpressionTimer();
  if (state.listening) {
    return;
  }

  state.expressionTimer = window.setTimeout(() => {
    if (state.listening) {
      return;
    }

    const nextExpression = expressionCycle[state.expressionIndex % expressionCycle.length];
    state.expressionIndex += 1;
    setExpression(nextExpression);
    scheduleNextExpression();
  }, 4600);
}

function refreshPresence() {
  if (!state.listening) {
    setExpression("awake");
  }
  scheduleSleepMode();
  scheduleNextExpression();
}

function getSpeechRecognitionConstructor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function readStoredContacts() {
  try {
    const raw = window.localStorage.getItem(contactStorageKey);
    const parsed = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return parsed;
  } catch (_error) {
    return {};
  }
}

function writeStoredContacts(contacts) {
  try {
    window.localStorage.setItem(contactStorageKey, JSON.stringify(contacts));
  } catch (_error) {
  }
}

function normalizeContactAlias(alias) {
  return String(alias || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePhoneNumber(phone) {
  const cleaned = String(phone || "").replace(/[^\d+]/g, "");
  if (!cleaned) {
    return "";
  }

  if (cleaned.startsWith("+")) {
    return cleaned.slice(1);
  }

  return cleaned;
}

function saveContact(alias, phone) {
  const safeAlias = normalizeContactAlias(alias);
  const safePhone = normalizePhoneNumber(phone);
  if (!safeAlias || !safePhone) {
    return false;
  }

  const contacts = readStoredContacts();
  contacts[safeAlias] = safePhone;
  writeStoredContacts(contacts);
  return true;
}

function findContactPhone(alias) {
  const contacts = readStoredContacts();
  const safeAlias = normalizeContactAlias(alias);
  return contacts[safeAlias] || "";
}

function looksLikeUrl(value) {
  return /^(https?:\/\/|www\.)/i.test(String(value || "").trim()) || /^[a-z0-9.-]+\.[a-z]{2,}(?:\/\S*)?$/i.test(String(value || "").trim());
}

function normalizeUrl(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return "";
  }

  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function looksLikeLocalPath(value) {
  const source = String(value || "").trim();
  return /^[a-z]:\\/i.test(source) || source.startsWith("\\\\") || source.startsWith("./") || source.startsWith("../");
}

function normalizeEmailAddress(value) {
  const cleaned = String(value || "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned) ? cleaned : "";
}

function resolveWhatsappTarget(target) {
  const savedPhone = findContactPhone(target);
  if (savedPhone) {
    return {
      phone: savedPhone,
      label: target,
    };
  }

  const directPhone = normalizePhoneNumber(target);
  if (directPhone) {
    return {
      phone: directPhone,
      label: target,
    };
  }

  const normalized = normalizeContactAlias(target);
  if ((normalized === "me" || normalized === "my whatsapp number" || normalized === "my number")) {
    const contacts = readStoredContacts();
    const aliases = Object.keys(contacts);
    if (aliases.length === 1) {
      return {
        phone: contacts[aliases[0]],
        label: aliases[0],
      };
    }
  }

  return null;
}

function queueAutoListen(delay = AUTO_LISTEN_DELAY_MS) {
  clearAutoListenTimer();
  if (
    !state.autoListenEnabled ||
    !state.voicePrimed ||
    state.transcribing ||
    state.listening
  ) {
    return;
  }

  state.autoListenTimer = window.setTimeout(() => {
    if (isVoiceOutputActive()) {
      queueAutoListen(Math.max(delay, 250));
      return;
    }

    if (
      !state.autoListenEnabled ||
      !state.voicePrimed ||
      state.transcribing ||
      state.listening
    ) {
      return;
    }
    startVoiceCapture({
      silent: true,
      passiveWakeMode: !state.awaitingCommandAfterWake,
    });
  }, delay);
}

function consumeWakeCommandWindow() {
  clearWakeCommandTimer();
  state.awaitingCommandAfterWake = false;
}

function armWakeCommandWindow(delay = 60000) {
  clearWakeCommandTimer();
  state.awaitingCommandAfterWake = true;
  state.autoListenEnabled = true;
  state.voicePrimed = true;
  state.wakeCommandTimer = window.setTimeout(() => {
    state.awaitingCommandAfterWake = false;
    if (!state.listening) {
      showBubble(widgetPrompt);
      queueAutoListen();
    }
  }, delay);
}

function extractWakePhraseCommand(transcript) {
  const source = String(transcript || "").trim();
  if (!source) {
    return { woke: false, command: "" };
  }

  if (state.awaitingCommandAfterWake) {
    return { woke: true, command: source };
  }

  for (const alias of WAKE_PHRASE_ALIASES) {
    const escapedAlias = escapeRegExp(alias).replace(/\\ /g, "\\s+");
    const prefixedPattern = new RegExp(`\\b(?:hello|hey|hi|ok|okay|yo)\\s+${escapedAlias}\\b[\\s,:-]*(.*)$`, "i");
    const directPattern = new RegExp(`\\b${escapedAlias}\\b\\s*(?:please)?\\b[\\s,:-]*(.*)$`, "i");
    const wakeMatch = source.match(prefixedPattern) || source.match(directPattern);
    if (wakeMatch) {
      return {
        woke: true,
        command: (wakeMatch[1] || "").trim(),
      };
    }
  }

  return {
    woke: false,
    command: "",
  };
}

function getVoiceShellPrompt() {
  return widgetPrompt;
}

function setMicrophoneState(permission, ready) {
  state.micPermission = permission;
  state.micReady = ready;
  if (ready) {
    state.voicePrimed = true;
    state.autoListenEnabled = true;
  }
}

async function syncMicrophonePermission() {
  if (!navigator.permissions?.query) {
    return state.micPermission;
  }

  try {
    const result = await navigator.permissions.query({ name: "microphone" });
    const nextState = result?.state || "unknown";
    if (nextState === "granted") {
      setMicrophoneState("granted", true);
    } else if (nextState === "denied") {
      setMicrophoneState("denied", false);
    } else {
      state.micPermission = nextState;
    }

    result.onchange = () => {
      const changedState = result?.state || "unknown";
      if (changedState === "granted") {
        setMicrophoneState("granted", true);
        queueAutoListen();
        return;
      }

      if (changedState === "denied") {
        state.micPermission = "denied";
        state.micReady = false;
        state.autoListenEnabled = false;
      }
    };

    return nextState;
  } catch (_error) {
    return state.micPermission;
  }
}

async function ensureMicrophoneAccess(options = {}) {
  if (!navigator.mediaDevices?.getUserMedia) {
    state.micPermission = "unsupported";
    return false;
  }

  if (state.micReady) {
    return true;
  }

  if (state.micAccessReady) {
    return state.micAccessReady;
  }

  state.micAccessReady = (async () => {
    await syncMicrophonePermission();

    if (state.micPermission === "denied" && !options.forcePrompt) {
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      stream.getTracks().forEach((track) => track.stop());
      setMicrophoneState("granted", true);
      return true;
    } catch (error) {
      const errorName = String(error?.name || "").toLowerCase();
      if (errorName === "notallowederror" || errorName === "securityerror") {
        state.micPermission = "denied";
      } else if (errorName === "notfounderror" || errorName === "devicesnotfounderror") {
        state.micPermission = "unavailable";
      } else {
        state.micPermission = "unknown";
      }
      state.micReady = false;
      return false;
    } finally {
      state.micAccessReady = null;
    }
  })();

  return state.micAccessReady;
}

function pauseAutoListenWithMessage(message, options = {}) {
  state.autoListenEnabled = false;
  holdEmotion("sad", 4200);
  showBubble(message, { speak: options.speak !== false });
  refreshPresence();
}

function shouldUseServerTranscription() {
  return Boolean(desktopShell && navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
}

function pickRecordingMimeType() {
  const supportedTypes = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];

  for (const mimeType of supportedTypes) {
    if (!window.MediaRecorder?.isTypeSupported || window.MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }

  return "";
}

function cleanupRecordedCapture() {
  clearRecordingFrame();

  if (state.mediaRecorder) {
    state.mediaRecorder.ondataavailable = null;
    state.mediaRecorder.onstop = null;
    state.mediaRecorder.onerror = null;
    state.mediaRecorder = null;
  }

  if (state.recordingStream) {
    state.recordingStream.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch (_error) {
      }
    });
    state.recordingStream = null;
  }

  state.recordingChunks = [];
  state.recordingStartedAt = 0;
  state.recordingLastVoiceAt = 0;
  state.recordingNoiseFloor = 0;
  state.speechDetected = false;
}

async function requestVoiceTranscript(audioBlob) {
  const accessToken = await ensureGuestSession();
  const apiBaseUrl = await resolveApiBaseUrl();
  const formData = new FormData();
  const extension = state.recordingMimeType.includes("ogg") ? "ogg" : "webm";
  formData.append("audio", audioBlob, `aubit-shell-${Date.now()}.${extension}`);
  formData.append("language", "en");

  const response = await fetch(`${apiBaseUrl}/ai-response/transcribe`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Transcription failed with status ${response.status}`);
  }

  const payload = await response.json();
  const transcript = payload?.data?.transcript;
  if (!transcript) {
    throw new Error("Transcription came back empty");
  }

  return transcript;
}

function stopRecordedVoiceCapture(reason = "done") {
  if (!state.mediaRecorder) {
    return;
  }

  state.lastRecognitionError = reason;

  try {
    if (state.mediaRecorder.state !== "inactive") {
      state.mediaRecorder.stop();
    }
  } catch (_error) {
  }
}

function monitorRecordedVoice() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass || !state.recordingStream) {
    return;
  }

  const audioContext = new AudioContextClass();
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  const source = audioContext.createMediaStreamSource(state.recordingStream);
  source.connect(analyser);
  const data = new Uint8Array(analyser.fftSize);
  const startedAt = Date.now();
  state.recordingStartedAt = startedAt;
  state.recordingLastVoiceAt = startedAt;
  state.recordingNoiseFloor = 0;
  state.speechDetected = false;

  const sample = () => {
    if (!state.mediaRecorder || state.mediaRecorder.state === "inactive") {
      try {
        audioContext.close();
      } catch (_error) {
      }
      clearRecordingFrame();
      return;
    }

    analyser.getByteTimeDomainData(data);
    let totalDeviation = 0;
    for (let index = 0; index < data.length; index += 1) {
      totalDeviation += Math.abs(data[index] - 128);
    }
    const level = totalDeviation / data.length / 128;
    const now = Date.now();
    const recordingFor = now - state.recordingStartedAt;
    const passiveWakeMode = state.passiveWakeMode;
    const calibrationWindow = recordingFor < 650;

    if (!state.speechDetected && calibrationWindow) {
      state.recordingNoiseFloor = state.recordingNoiseFloor
        ? (state.recordingNoiseFloor * 0.82) + (level * 0.18)
        : level;
    }

    const voiceThreshold = Math.max(0.018, Math.min(0.08, (state.recordingNoiseFloor || 0.012) * 2.4));

    if (!calibrationWindow && level > voiceThreshold) {
      state.speechDetected = true;
      state.recordingLastVoiceAt = now;
    }

    const idleFor = now - state.recordingLastVoiceAt;

    if (state.speechDetected && idleFor > RECORDING_SILENCE_TO_PROCESS_MS) {
      stopRecordedVoiceCapture("transcribe");
      return;
    }

    const noSpeechTimeout = passiveWakeMode
      ? RECORDING_PASSIVE_NO_SPEECH_TIMEOUT_MS
      : RECORDING_NO_SPEECH_TIMEOUT_MS;
    const maxDuration = passiveWakeMode
      ? RECORDING_PASSIVE_MAX_DURATION_MS
      : RECORDING_MAX_DURATION_MS;

    if (!state.speechDetected && recordingFor > noSpeechTimeout) {
      stopRecordedVoiceCapture("no-speech");
      return;
    }

    if (recordingFor > maxDuration) {
      stopRecordedVoiceCapture("transcribe");
      return;
    }

    state.recordingFrame = window.requestAnimationFrame(sample);
  };

  state.recordingFrame = window.requestAnimationFrame(sample);
}

async function finalizeRecordedVoiceCapture(reason) {
  const chunks = state.recordingChunks.slice();
  const mimeType = state.recordingMimeType || "audio/webm";
  const passiveWakeMode = state.passiveWakeMode;
  cleanupRecordedCapture();
  state.listening = false;
  state.passiveWakeMode = false;
  refreshPresence();

  if (reason === "cancelled") {
    setDebugStatus("idle", "capture cancelled");
    return;
  }

  const audioBlob = chunks.length ? new Blob(chunks, { type: mimeType }) : null;
  if (reason === "no-speech" || !audioBlob || audioBlob.size < 1024) {
    setDebugStatus("backend", "no speech detected");
    queueAutoListen();
    return;
  }

  holdEmotion("thinking", 4800);
  setSpeechProcessing(true);
  setDebugStatus("backend", "transcribing audio");

  try {
    const transcript = await requestVoiceTranscript(audioBlob);
    setDebugStatus("backend", `heard ${truncateBubbleText(transcript, 48)}`);
    await routeVoiceTranscript(transcript, { passiveWakeMode });
  } catch (_error) {
    if (passiveWakeMode) {
      setDebugStatus("idle", "wake transcription retry");
      setExpression("awake");
      return;
    }

    const SpeechRecognition = getSpeechRecognitionConstructor();
    if (SpeechRecognition && !state.recognition) {
      state.recognition = createRecognition();
    }

    if (SpeechRecognition && state.recognition) {
      setDebugStatus("browser", "backend fallback recovery");
      holdEmotion("curious", 2600);
      await pause(200);
      await startVoiceCapture({
        userInitiated: true,
        forceBrowserRecognition: true,
        silent: false,
      });
      return;
    }

    holdEmotion("sad", 4200);
    setDebugStatus("error", "backend transcription failed");
    showBubble(
      "I reached the microphone, but I could not turn that audio into text. The backend speech service may need a moment.",
      { speak: true },
    );
  } finally {
    setSpeechProcessing(false);
    queueAutoListen();
  }
}

async function startRecordedVoiceCapture(options = {}) {
  const passiveWakeMode = options.passiveWakeMode === true && !state.awaitingCommandAfterWake;
  const microphoneReady = await ensureMicrophoneAccess({
    forcePrompt: options.userInitiated === true,
  });

  if (!microphoneReady) {
    if (!options.silent || options.userInitiated) {
      const prompt =
        state.micPermission === "denied"
          ? "Allow microphone access for Aubit in Windows, then click me again."
          : "I could not turn on the microphone yet. Check your mic access, then click me again.";
      showBubble(prompt, { speak: options.userInitiated === true });
    }
    return;
  }

  if (state.listening || state.transcribing) {
    return;
  }

  stopWidgetSpeech();
  state.autoListenEnabled = true;
  state.voicePrimed = true;
  state.passiveWakeMode = passiveWakeMode;
  state.lastRecognitionError = "";
  state.recordingChunks = [];
  state.recordingMimeType = pickRecordingMimeType() || "audio/webm";

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });

    state.recordingStream = stream;
    const mediaRecorder = state.recordingMimeType
      ? new MediaRecorder(stream, { mimeType: state.recordingMimeType })
      : new MediaRecorder(stream);

    state.mediaRecorder = mediaRecorder;
    state.listening = true;
    state.manualStop = false;
    clearExpressionTimer();
    clearEmotionTimer();
    setShellMode("active");
    setExpression(passiveWakeMode ? "awake" : "listening");
    setDebugStatus("backend", passiveWakeMode ? "passive wake listening" : "listening");

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        state.recordingChunks.push(event.data);
      }
    };

    mediaRecorder.onerror = () => {
      state.micReady = false;
      cleanupRecordedCapture();
      state.listening = false;
      if (passiveWakeMode) {
        setDebugStatus("backend", "wake recorder retrying");
        queueAutoListen(700);
        return;
      }

      setDebugStatus("error", "media recorder failed");
      pauseAutoListenWithMessage(
        "I can see the microphone, but recording failed. Check if another app is blocking it, then click Aubit again.",
      );
    };

    mediaRecorder.onstop = () => {
      const stopReason = state.lastRecognitionError || "transcribe";
      finalizeRecordedVoiceCapture(stopReason);
    };

    mediaRecorder.start(RECORDING_TIMESLICE_MS);
    monitorRecordedVoice();
  } catch (_error) {
    state.micReady = false;
    if (passiveWakeMode) {
      setDebugStatus("backend", "microphone retrying");
      queueAutoListen(1200);
      return;
    }

    setDebugStatus("error", "microphone open failed");
    pauseAutoListenWithMessage(
      "I could not open the desktop microphone. Check Windows microphone privacy settings, then click Aubit again.",
    );
  }
}

function inferEmotionFromText(text) {
  const normalized = String(text || "").toLowerCase();

  if (/\b(cry|crying|tears|grief|grieving|heartbroken|miss someone|lost someone|death|funeral)\b/.test(normalized)) {
    return "crying";
  }

  if (/\b(angry|anger|furious|mad|annoyed|rage|hate|frustrated|irritated)\b/.test(normalized)) {
    return "angry";
  }

  if (/\b(sad|upset|depressed|lonely|hurt|bad day|unhappy|disappointed)\b/.test(normalized)) {
    return "sad";
  }

  if (/\b(happy|joy|joyful|excited|celebrate|celebration|love this|great news|awesome|wonderful)\b/.test(normalized)) {
    return "happy";
  }

  if (/\b(sleepy|sleep|tired|exhausted|rest|nap)\b/.test(normalized)) {
    return "soft";
  }

  return "thinking";
}

function getInstantShellReply(prompt) {
  const normalized = normalizeAssistantText(prompt);
  if (!normalized) {
    return "";
  }

  if (/^(hi|hello|hey|yo|aubit|orbit|are you there)\b/.test(normalized)) {
    return "I am here with you.";
  }

  if (/\bhow are you\b/.test(normalized)) {
    return "I am good, and ready.";
  }

  if (/\b(thank you|thanks|good job|nice)\b/.test(normalized)) {
    return "Anytime. I have got you.";
  }

  if (/\b(stop|quiet|be quiet|pause)\b/.test(normalized)) {
    stopWidgetSpeech();
    return "Okay, I am quiet now.";
  }

  return "";
}

function stopVoiceCapture(options = {}) {
  clearAutoListenTimer();
  if (options.resetWake !== false) {
    consumeWakeCommandWindow();
  }
  state.manualStop = true;
  state.listening = false;
  state.passiveWakeMode = false;

  if (state.mediaRecorder) {
    state.lastRecognitionError = "cancelled";
    stopRecordedVoiceCapture(state.lastRecognitionError);
  }

  if (state.recognition) {
    try {
      state.recognition.stop();
    } catch (_error) {
    }
  }

  if (!options.quiet) {
    showBubble(options.message || widgetPrompt, { speak: options.speak === true });
  }
}

async function openStudyMode(topic = "") {
  if (desktopShell?.openPanel) {
    await desktopShell.openPanel("study", { topic });
    return;
  }

  if (desktopShell?.openMainWindow) {
    await desktopShell.openMainWindow();
  }
}

function parseLocalCommand(transcript) {
  const source = transcript.trim();
  const normalized = normalizeAssistantText(source);
  const cleanedQuery = (value = "") => String(value || "")
    .replace(/\b(?:please|for me)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (/^(?:stop|stop speaking|stop talking|quiet|be quiet|shut up|cancel)$/i.test(source)) {
    return { type: "stop_speaking" };
  }

  if (/^(?:close|quit|exit|shutdown|shut down)\s+(?:yourself|aubit|app|the app)$/i.test(source)) {
    return { type: "quit_aubit" };
  }

  if (
    /\b(?:time|current time|what time|tell me the time)\b/.test(normalized)
  ) {
    return { type: "tell_time" };
  }

  if (
    /\b(?:date|today date|what date|which day|what day)\b/.test(normalized)
  ) {
    return { type: "tell_date" };
  }

  if (/\b(?:joke|jokes|funny)\b/.test(normalized)) {
    return { type: "tell_joke" };
  }

  const timerMatch =
    source.match(/^(?:set|start)\s+(?:a\s+)?(?:timer|alarm)\s+(?:for\s+)?(.+)$/i) ||
    source.match(/^(?:timer|alarm)\s+(?:set|start)\s+(?:for\s+)?(.+)$/i);
  if (timerMatch) {
    const durationMs = parseDurationMs(timerMatch[1]);
    if (durationMs > 0) {
      return { type: "set_timer", durationMs };
    }
  }

  if (/\b(?:cancel|stop|delete)\b.*\b(?:timer|alarm|reminder)\b/.test(normalized) || /\b(?:timer|alarm|reminder)\s+(?:cancel|delete|stop)\b/.test(normalized)) {
    return { type: "cancel_timer" };
  }

  const youtubeSearchMatch =
    source.match(/^open\s+youtube(?:\s+and)?\s+search\s+(.+)$/i) ||
    source.match(/^search\s+youtube\s+for\s+(.+)$/i) ||
    source.match(/^find\s+(.+?)\s+on\s+youtube$/i) ||
    source.match(/^find\s+on\s+youtube\s+(.+)$/i) ||
    source.match(/^search\s+(.+?)\s+on\s+youtube$/i) ||
    source.match(/^youtube\s+search\s+(.+)$/i);
  if (youtubeSearchMatch) {
    return {
      type: "open_youtube_search",
      query: cleanedQuery(youtubeSearchMatch[1]),
    };
  }

  const youtubePlayMatch =
    source.match(/^open\s+youtube(?:\s+and)?\s+play\s+(.+)$/i) ||
    source.match(/^play\s+(.+?)\s+on\s+youtube$/i) ||
    source.match(/^play\s+(?:the\s+)?song\s+(.+)$/i) ||
    source.match(/^play\s+(.+?)\s+song$/i);
  if (youtubePlayMatch) {
    return {
      type: "play_youtube_result",
      query: youtubePlayMatch[1].trim(),
    };
  }

  const youtubeChannelMatch =
    source.match(/^open\s+(.+?)\s+(?:youtube\s+)?channel$/i) ||
    source.match(/^open\s+youtube\s+channel\s+(.+)$/i) ||
    source.match(/^open\s+(.+?)\s+on\s+youtube\s+channel$/i);
  if (youtubeChannelMatch) {
    return {
      type: "open_youtube_channel",
      query: youtubeChannelMatch[1].trim(),
    };
  }

  if (/^(?:click|open|play)\s+(?:on\s+)?(?:the\s+)?first\s+(?:youtube\s+)?video$/i.test(source)) {
    return { type: "click_first_youtube_video" };
  }

  const youtubeVideoTitleMatch =
    source.match(/^(?:open|play|click)\s+(?:the\s+)?(?:youtube\s+)?video\s+(?:called|named|titled)\s+(.+)$/i) ||
    source.match(/^(?:open|play|click)\s+(.+?)\s+(?:youtube\s+)?video$/i) ||
    source.match(/^(?:open|play|click)\s+video\s+(.+)$/i);
  if (youtubeVideoTitleMatch) {
    return {
      type: "click_youtube_video_by_title",
      query: youtubeVideoTitleMatch[1].trim(),
    };
  }

  const googleTypeMatch =
    source.match(/^type\s+(.+?)\s+on\s+google$/i) ||
    source.match(/^type\s+on\s+google\s+(.+)$/i) ||
    source.match(/^open\s+google\s+and\s+type\s+(.+)$/i);
  if (googleTypeMatch) {
    return {
      type: "type_google_search",
      query: cleanedQuery(googleTypeMatch[1]),
    };
  }

  const googleSearchMatch =
    source.match(/^open\s+google(?:\s+and)?\s+search\s+(?:for\s+)?(.+)$/i) ||
    source.match(/^google\s+(?:for\s+)?(.+)$/i) ||
    source.match(/^search\s+(?:google\s+for\s+|the web for\s+|web for\s+|for\s+|about\s+)?(.+?)\s+on\s+google$/i) ||
    source.match(/^search\s+(?:on\s+)?google\s+(?:for\s+)?(.+)$/i) ||
    source.match(/^search\s+(?:google\s+for\s+|the web for\s+|web for\s+|for\s+|about\s+)?(.+)$/i) ||
    source.match(/^find\s+(?:google\s+for\s+|the web for\s+|web for\s+|for\s+|about\s+)?(.+)$/i) ||
    source.match(/^look\s+up\s+(.+)$/i) ||
    source.match(/^google\s+search\s+(.+)$/i);
  if (googleSearchMatch) {
    return {
      type: "show_google_results",
      query: cleanedQuery(googleSearchMatch[1]),
    };
  }

  const googleOpenFirstMatch =
    source.match(/^open\s+(?:the\s+)?(?:first|top)\s+(?:google\s+)?result\s+(?:for\s+)?(.+)$/i) ||
    source.match(/^search\s+(?:for\s+)?(.+?)\s+and\s+open\s+(?:the\s+)?(?:first|top)\s+result$/i);
  if (googleOpenFirstMatch) {
    return {
      type: "open_google_search",
      query: cleanedQuery(googleOpenFirstMatch[1]),
    };
  }

  const saveContactMatch =
    source.match(/^save\s+(.+?)\s+as\s+(\+?\d[\d\s-]{5,})$/i) ||
    source.match(/^remember\s+(.+?)\s+(?:number|phone)\s+as\s+(\+?\d[\d\s-]{5,})$/i);
  if (saveContactMatch) {
    return {
      type: "save_contact",
      contact: saveContactMatch[1].trim(),
      phone: saveContactMatch[2].trim(),
    };
  }

  const whatsappSendMatch =
    source.match(/^send\s+(?:a\s+)?message\s+to\s+(.+?)\s+(?:saying|that says|text)\s+(.+)$/i) ||
    source.match(/^send\s+whatsapp\s+message\s+to\s+(.+?)\s+(?:saying|that says|text)\s+(.+)$/i) ||
    source.match(/^open\s+whatsapp(?:\s+and)?\s+message\s+(.+?)\s+(?:saying|that says|text)\s+(.+)$/i) ||
    source.match(/^whatsapp\s+(.+?)\s+(?:saying|that says|text)\s+(.+)$/i);
  if (whatsappSendMatch) {
    return {
      type: "send_whatsapp_message",
      contact: whatsappSendMatch[1].trim(),
      message: whatsappSendMatch[2].trim(),
    };
  }

  const whatsappChatMatch =
    source.match(/^open\s+whatsapp(?:\s+and)?\s+(?:go\s+to|open)?\s*(?:this\s+)?(?:group|chat|conversation)\s+(.+)$/i) ||
    source.match(/^open\s+whatsapp\s+go\s+in\s+(?:this\s+)?group\s+(.+)$/i);
  if (whatsappChatMatch) {
    return {
      type: "open_whatsapp_chat",
      query: whatsappChatMatch[1].trim(),
    };
  }

  const emailMatch =
    source.match(/^send\s+(?:an?\s+)?email\s+to\s+([^\s@]+@[^\s@]+\.[^\s@]+)\s+subject\s+(.+?)\s+message\s+(.+)$/i) ||
    source.match(/^send\s+(?:an?\s+)?email\s+to\s+([^\s@]+@[^\s@]+\.[^\s@]+)\s+about\s+(.+?)\s+saying\s+(.+)$/i) ||
    source.match(/^email\s+([^\s@]+@[^\s@]+\.[^\s@]+)\s+subject\s+(.+?)\s+message\s+(.+)$/i);
  if (emailMatch) {
    return {
      type: "compose_email",
      to: emailMatch[1].trim(),
      subject: emailMatch[2].trim(),
      body: emailMatch[3].trim(),
    };
  }

  const essayWhatsappMatch =
    source.match(/^write\s+(?:an?\s+)?essay\s+on\s+(.+?)\s+and\s+send\s+it\s+to\s+(.+)$/i) ||
    source.match(/^write\s+about\s+(.+?)\s+and\s+send\s+it\s+to\s+(.+)$/i);
  if (essayWhatsappMatch) {
    return {
      type: "draft_essay_to_whatsapp",
      topic: essayWhatsappMatch[1].trim(),
      contact: essayWhatsappMatch[2].trim(),
    };
  }

  const pdfUrlOpenMatch = source.match(/^open\s+(?:this\s+)?pdf(?:\s+from)?\s+(.+)$/i);
  if (pdfUrlOpenMatch) {
    const target = pdfUrlOpenMatch[1].trim();
    if (looksLikeUrl(target)) {
      return { type: "open_pdf_url", url: normalizeUrl(target) };
    }
    if (looksLikeLocalPath(target)) {
      return { type: "open_path", path: target };
    }
  }

  const pdfUrlDownloadMatch = source.match(/^download\s+(?:this\s+)?pdf(?:\s+from)?\s+(.+)$/i);
  if (pdfUrlDownloadMatch) {
    const target = pdfUrlDownloadMatch[1].trim();
    if (looksLikeUrl(target)) {
      return { type: "download_pdf_url", url: normalizeUrl(target) };
    }
    if (looksLikeLocalPath(target)) {
      return { type: "open_path", path: target };
    }
  }

  const genericOpenUrlMatch =
    source.match(/^(?:open|go\s+to|launch)\s+((?:https?:\/\/|www\.)\S+)$/i) ||
    source.match(/^(?:open|go\s+to|launch)\s+([a-z0-9.-]+\.[a-z]{2,}(?:\/\S*)?)$/i);
  if (genericOpenUrlMatch) {
    return {
      type: "open_url",
      url: normalizeUrl(genericOpenUrlMatch[1]),
    };
  }

  const openDesktopAppMatch = source.match(/^(?:open|launch|start)\s+(?:the\s+)?(.+?)(?:\s+app)?$/i);
  if (openDesktopAppMatch) {
    const appName = normalizeAssistantText(openDesktopAppMatch[1]);
    const appAliases = {
      calculator: "calculator",
      calc: "calculator",
      notepad: "notepad",
      notes: "notepad",
      explorer: "explorer",
      files: "explorer",
      "file explorer": "explorer",
      paint: "paint",
      settings: "settings",
      camera: "camera",
      terminal: "terminal",
      powershell: "powershell",
      command: "cmd",
      "command prompt": "cmd",
    };
    if (appAliases[appName]) {
      return {
        type: "open_desktop_app",
        query: appAliases[appName],
      };
    }
  }

  const genericDownloadUrlMatch =
    source.match(/^download\s+((?:https?:\/\/|www\.)\S+)$/i) ||
    source.match(/^download\s+([a-z0-9.-]+\.[a-z]{2,}(?:\/\S*)?)$/i);
  if (genericDownloadUrlMatch) {
    return {
      type: "download_url",
      url: normalizeUrl(genericDownloadUrlMatch[1]),
    };
  }

  if (/\bopen\b.*\bgmail\b/.test(normalized)) {
    return { type: "open_named_site", site: "gmail" };
  }

  if (/\bopen\b.*\b(?:google\s+)?maps\b/.test(normalized)) {
    return { type: "open_named_site", site: "maps" };
  }

  if (/\bopen\b.*\bgoogle drive\b/.test(normalized) || /\bopen\b.*\bdrive\b/.test(normalized)) {
    return { type: "open_named_site", site: "drive" };
  }

  if (/\bopen\b.*\bgoogle docs\b/.test(normalized) || /\bopen\b.*\bdocs\b/.test(normalized)) {
    return { type: "open_named_site", site: "docs" };
  }

  if (/\bopen\b.*\bwikipedia\b/.test(normalized)) {
    return { type: "open_named_site", site: "wikipedia" };
  }

  if (/\bopen\b.*\bchatgpt\b/.test(normalized)) {
    return { type: "open_named_site", site: "chatgpt" };
  }

  if (
    /\bopen\b.*\b(?:world\s+news|global\s+news|international\s+news|news)\b/.test(normalized) ||
    /\b(?:show|get|read)\b.*\b(?:world\s+news|global\s+news|international\s+news|latest\s+news|news)\b/.test(normalized) ||
    /\bnews\s+(?:of|from|around)\s+(?:the\s+)?(?:whole\s+)?world\b/.test(normalized)
  ) {
    return { type: "open_named_site", site: "world_news" };
  }

  if (/\bopen\b.*\byoutube\b/.test(normalized)) {
    return { type: "open_youtube" };
  }

  if (/\b(close|exit|shut)\b.*\b(youtube|news|google|browser|command window|window|page)\b/.test(normalized)) {
    return { type: "close_automation_window" };
  }

  if (/\b(pause|stop)\b.*\b(song|music|video|youtube|media)\b/.test(normalized)) {
    return { type: "pause_media" };
  }

  if (/\b(resume|continue|play)\b.*\b(song|music|video|youtube|media)\b/.test(normalized)) {
    return { type: "play_media" };
  }

  if (/\bopen\b.*\bgoogle\b/.test(normalized)) {
    return { type: "open_google" };
  }

  if (/\bopen\b.*\bwhatsapp\b/.test(normalized)) {
    return { type: "open_whatsapp" };
  }

  if (/\bopen\b.*\binstagram\b/.test(normalized) && /\b(reel|screenshot|stop|pause)\b/.test(normalized)) {
    return { type: "open_instagram_reel_screenshot" };
  }

  if (/\bopen\b.*\binstagram\b/.test(normalized)) {
    return { type: "open_instagram" };
  }

  if (/\b(take|capture|lo|lelo)\b.*\bscreenshot\b/.test(normalized) || /\bscreenshot\s+(?:lo|lelo|capture|take)\b/.test(normalized)) {
    return { type: "capture_window" };
  }

  if (/\bopen downloads\b/.test(normalized)) {
    return { type: "open_downloads" };
  }

  if (/\bopen this pdf\b/.test(normalized)) {
    return { type: "open_current_pdf" };
  }

  if (/\bdownload this pdf\b/.test(normalized)) {
    return { type: "download_current_pdf" };
  }

  if (/\bdownload this (?:page|file)\b/.test(normalized)) {
    return { type: "download_current_page" };
  }

  if (/\b(?:scroll|go|move|page)\b.*\bdown\b/.test(normalized) || /\bneeche\s+(?:scroll|jao|chalo)\b/.test(normalized)) {
    return { type: "scroll_automation", direction: "down" };
  }

  if (/\b(?:scroll|go|move|page)\b.*\bup\b/.test(normalized) || /\bupar\s+(?:scroll|jao|chalo)\b/.test(normalized)) {
    return { type: "scroll_automation", direction: "up" };
  }

  if (/\b(?:scroll|go|move)\b.*\btop\b/.test(normalized) || /\bgo\s+to\s+top\b/.test(normalized)) {
    return { type: "scroll_automation", direction: "top" };
  }

  if (/\b(?:scroll|go|move)\b.*\bbottom\b/.test(normalized) || /\bgo\s+to\s+bottom\b/.test(normalized)) {
    return { type: "scroll_automation", direction: "bottom" };
  }

  if (
    /\b(system status|system health|device health|pc health|computer health)\b/.test(normalized) ||
    /\b(check|scan|inspect|test)\b.*\b(system|laptop|computer|pc)\b/.test(normalized)
  ) {
    return { type: "system_status" };
  }

  return null;
}

async function handleLocalCommand(command) {
  if (!command) {
    return false;
  }

  if (command.type === "stop_speaking") {
    stopWidgetSpeech();
    state.autoListenEnabled = true;
    state.voicePrimed = true;
    showBubble("Okay.");
    queueAutoListen(BARGE_IN_LISTEN_DELAY_MS);
    return true;
  }

  if (command.type === "quit_aubit") {
    stopWidgetSpeech();
    showBubble("Closing Aubit.");
    window.setTimeout(() => {
      desktopShell?.quitDesktopShell?.();
    }, 120);
    return true;
  }

  if (command.type === "tell_time") {
    showBubble(`It's ${formatAssistantTime()}.`, { speak: true });
    return true;
  }

  if (command.type === "tell_date") {
    showBubble(`Today is ${formatAssistantDate()}.`, { speak: true });
    return true;
  }

  if (command.type === "tell_joke") {
    const jokes = [
      "I told my computer I needed a break. It said no problem, then froze.",
      "Why did the browser go to therapy? Too many unresolved tabs.",
      "I tried to organize my files. Now I have a folder called final-final-really-final.",
    ];
    showBubble(jokes[Math.floor(Math.random() * jokes.length)], { speak: true });
    return true;
  }

  if (command.type === "set_timer") {
    const timer = scheduleAssistantTimer(command.durationMs, "Timer");
    showBubble(`Done. I set a timer for ${describeDuration(timer.fireAt - Date.now())}.`, { speak: true });
    return true;
  }

  if (command.type === "cancel_timer") {
    const activeTimers = [...state.assistantTimers];
    activeTimers.forEach((timer) => clearAssistantTimer(timer.id));
    showBubble(activeTimers.length ? "Done. I cancelled the timer." : "There is no active timer right now.", { speak: true });
    return true;
  }

  if (command.type === "save_contact") {
    const saved = saveContact(command.contact, command.phone);
    showBubble(
      saved
        ? `Saved ${command.contact} for WhatsApp commands.`
        : "I could not save that contact. Say something like save my friend as plus nine one...",
      { speak: true },
    );
    return true;
  }

  if (command.type === "send_whatsapp_message") {
    const target = resolveWhatsappTarget(command.contact);
    if (!target?.phone) {
      showBubble(
        `I do not know ${command.contact} yet. Say save ${command.contact} as plus phone number first.`,
        { speak: true },
      );
      return true;
    }

    const result = await desktopShell?.runCommand?.("send_whatsapp_message", {
      contact: command.contact,
      phone: target.phone,
      message: command.message,
    });
    showBubble(result?.message || `Opening WhatsApp for ${command.contact}.`, { speak: true });
    return true;
  }

  if (command.type === "draft_essay_to_whatsapp") {
    const target = resolveWhatsappTarget(command.contact);
    if (!target?.phone) {
      showBubble(
        `I need a saved WhatsApp number for ${command.contact}. Say save ${command.contact} as plus phone number first.`,
        { speak: true },
      );
      return true;
    }

    showBubble(`Writing an essay on ${command.topic} and sending it to ${command.contact}.`, { speak: true });
    const draft = await requestLiveShellResponse(
      `Write a thoughtful essay about ${command.topic}. Return only the essay body with no greeting or extra commentary.`,
      "thinking",
    );
    const result = await desktopShell?.runCommand?.("send_whatsapp_message", {
      contact: target.label,
      phone: target.phone,
      message: draft.text.slice(0, 2800),
    });
    showBubble(result?.message || `Essay ready for ${command.contact}.`, { speak: true });
    return true;
  }

  const result = await desktopShell?.runCommand?.(command.type, {
    contact: command.contact || "",
    message: command.message || "",
    query: command.query || "",
    url: command.url || "",
    site: command.site || "",
    direction: command.direction || "",
    path: command.path || "",
    to: command.to || "",
    subject: command.subject || "",
    body: command.body || "",
  });
  showBubble(result?.message || "Command finished.", { speak: true });
  return true;
}

function isStudyIntent(transcript) {
  return /^(?:open|launch|start)\s+study(?:\s+mode)?\b|^(?:study|learn|teach(?: me)?|explain|revise)\b/i.test(
    transcript.trim(),
  );
}

function extractStudyTopic(transcript) {
  const source = transcript.trim().replace(/[.!?]+$/g, "");
  if (!source) {
    return "";
  }

  const patterns = [
    /^(?:open|launch|start)\s+study(?:\s+mode)?(?:\s+(?:for|about))?\s*(.*)$/i,
    /^(?:study|learn|explain|teach(?: me)?|revise)\s+(?:about\s+)?(.+)$/i,
  ];

  for (const pattern of patterns) {
    const match = source.match(pattern);
    if (match) {
      return (match[1] || "").trim();
    }
  }

  return "";
}

async function probeApiBaseUrl(baseUrl) {
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timeoutId = controller ? window.setTimeout(() => controller.abort(), 1800) : 0;

  try {
    const response = await fetch(`${baseUrl}/health`, {
      method: "GET",
      signal: controller?.signal,
    });
    return response.ok;
  } catch (_error) {
    return false;
  } finally {
    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }
  }
}

async function resolveApiBaseUrl() {
  if (state.apiBaseUrl) {
    return state.apiBaseUrl;
  }

  if (state.apiBaseReady) {
    return state.apiBaseReady;
  }

  state.apiBaseReady = (async () => {
    for (const candidate of apiBaseCandidates) {
      if (await probeApiBaseUrl(candidate)) {
        state.apiBaseUrl = candidate;
        return candidate;
      }
    }

    throw new Error("Aubit backend is not reachable");
  })();

  try {
    return await state.apiBaseReady;
  } finally {
    state.apiBaseReady = null;
  }
}

async function ensureGuestSession() {
  if (state.authToken) {
    return state.authToken;
  }

  if (state.authReady) {
    return state.authReady;
  }

  const apiBaseUrl = await resolveApiBaseUrl();
  const guestCredentials = {
    username: "guest_demo",
    password: "Password123",
    role: "user",
  };

  state.authReady = fetch(`${apiBaseUrl}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(guestCredentials),
  })
    .then(async (response) => {
      if (response.ok) {
        return response.json();
      }

      if (response.status !== 401) {
        throw new Error(`Login failed with status ${response.status}`);
      }

      const signupResponse = await fetch(`${apiBaseUrl}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...guestCredentials,
          display_name: "Guest User",
        }),
      });

      if (!signupResponse.ok) {
        throw new Error(`Signup failed with status ${signupResponse.status}`);
      }

      return signupResponse.json();
    })
    .then((payload) => {
      const accessToken = payload?.data?.access_token;
      if (!accessToken) {
        throw new Error("Login response did not contain an access token");
      }

      state.authToken = accessToken;
      return accessToken;
    })
    .finally(() => {
      state.authReady = null;
    });

  return state.authReady;
}

async function requestLiveShellResponse(prompt, emotion) {
  if (!navigator.onLine) {
    throw new Error("No internet connection detected");
  }

  const accessToken = await ensureGuestSession();
  const apiBaseUrl = await resolveApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/ai-response`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      prompt,
      use_voice: false,
      context: {
        mode: "desktop_shell",
        topic: "trusted companion conversation",
        emotion_hint: emotion,
        companion_style: "natural real-time English-speaking friend; speak casually, directly, and do not over-explain",
        response_style: "realtime_conversation",
        answer_depth: "instant_phrase",
        latency_priority: "ultra_fast",
        language_mode: "english_only",
        speaking_instruction: "Answer only in natural English. Reply immediately in 4 to 10 words for normal chat. Use one short sentence. No filler, no preamble.",
        voice_profile: VOICE_PROFILE,
        robot_variant: "boy",
        accent: "natural_english",
        voice_delivery: "browser_instant",
        user_name: preferredUserName,
        online: true,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`AI request failed with status ${response.status}`);
  }

  const payload = await response.json();
  const text = payload?.data?.response;
  if (!text) {
    throw new Error("AI response was empty");
  }

  return {
    text,
    voicePreview: payload?.data?.voice_preview || null,
  };
}

async function respondFromShell(prompt) {
  const emotion = inferEmotionFromText(prompt);
  holdEmotion(emotion, 5200);

  const instantReply = getInstantShellReply(prompt);
  if (instantReply) {
    holdEmotion(emotion === "thinking" ? "happy" : emotion, 3600);
    showBubble(instantReply, { speak: true });
    return;
  }

  try {
    const reply = await requestLiveShellResponse(prompt, emotion);
    holdEmotion(emotion === "thinking" ? "thinking" : emotion, 5400);
    showBubble(reply.text, { speak: true, voicePreview: reply.voicePreview });
  } catch (_error) {
    holdEmotion("sad", 4800);
    showBubble(
      "I lost the live connection for a moment, but I'm still with you. Give me a second and try again.",
      { speak: true },
    );
  }
}

async function routeVoiceTranscript(transcript, options = {}) {
  const wakeIntent = extractWakePhraseCommand(transcript);
  const passiveWakeMode = options.passiveWakeMode === true;

  if (passiveWakeMode && !wakeIntent.woke) {
    setDebugStatus("idle", "waiting for hey aubit");
    setExpression("awake");
    queueAutoListen();
    return;
  }

  const effectiveTranscript = (wakeIntent.woke ? wakeIntent.command : transcript).trim();
  const normalized = effectiveTranscript.toLowerCase();
  if (!normalized) {
    holdEmotion("listening", 2600);
    setDebugStatus("wake", "awaiting command");
    showBubble("I'm listening.", { speak: true });
    armWakeCommandWindow();
    queueAutoListen(WAKE_COMMAND_LISTEN_DELAY_MS);
    return;
  }

  consumeWakeCommandWindow();

  const localCommand = parseLocalCommand(effectiveTranscript);
  if (localCommand) {
    holdEmotion("happy", 3600);
    await handleLocalCommand(localCommand);
    return;
  }

  if (/\b(open|launch|start)\b.*\b(app|assistant|home|aubit|immersive)\b/i.test(normalized)) {
    holdEmotion("happy", 3600);
    showBubble("Opening Aubit.", { speak: true });
    await desktopShell?.openMainWindow?.();
    return;
  }

  if (isStudyIntent(effectiveTranscript)) {
    const topic = extractStudyTopic(effectiveTranscript);
    holdEmotion("happy", 3600);
    showBubble(topic ? `Opening study mode for ${topic}.` : "Opening study mode.", { speak: true });
    await openStudyMode(topic);
    return;
  }

  await respondFromShell(effectiveTranscript);
}

function createRecognition() {
  const SpeechRecognition = getSpeechRecognitionConstructor();
  if (!SpeechRecognition) {
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = SPEECH_RECOGNITION_LANG;
  recognition.continuous = false;
  recognition.interimResults = true;

  recognition.onstart = () => {
    state.listening = true;
    state.manualStop = false;
    state.handledTranscript = false;
    state.lastRecognitionError = "";
    clearExpressionTimer();
    clearEmotionTimer();
    if (!state.passiveWakeMode) {
      setShellMode("active");
      setExpression("listening");
    }
    setDebugStatus("browser", state.passiveWakeMode ? "passive wake listening" : "listening");
  };

  recognition.onresult = async (event) => {
    let finalTranscript = "";
    let interimTranscript = "";

    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const segment = event.results[index][0].transcript.trim();
      if (!segment) {
        continue;
      }

      if (event.results[index].isFinal) {
        finalTranscript = segment;
      } else {
        interimTranscript += `${segment} `;
      }
    }

    if (!finalTranscript) {
      return;
    }

    const passiveWakeMode = state.passiveWakeMode;
    state.handledTranscript = true;
    setDebugStatus("browser", `heard ${truncateBubbleText(finalTranscript, 48)}`);

    try {
      recognition.stop();
    } catch (_error) {
    }

    await routeVoiceTranscript(finalTranscript, { passiveWakeMode });
  };

  recognition.onerror = (event) => {
    const errorCode = String(event?.error || "unknown");
    const passiveWakeMode = state.passiveWakeMode;
    state.listening = false;
    state.handledTranscript = false;
    state.lastRecognitionError = errorCode;

    if (errorCode === "aborted") {
      setDebugStatus("browser", "aborted");
      refreshPresence();
      return;
    }

    if (errorCode === "no-speech") {
      setDebugStatus("browser", "no speech detected");
      refreshPresence();
      return;
    }

    if (errorCode === "audio-capture") {
      state.micReady = false;
      pauseAutoListenWithMessage(
        "I cannot reach your microphone yet. Turn on Windows microphone access for Aubit, then click me once to reconnect.",
      );
      return;
    }

    if (errorCode === "not-allowed" || errorCode === "service-not-allowed") {
      state.micReady = false;
      state.micPermission = "denied";
      pauseAutoListenWithMessage(
        "Microphone access is blocked for Aubit. Allow the microphone in Windows, then click me again.",
      );
      return;
    }

    if (errorCode === "network") {
      if (shouldUseServerTranscription()) {
        state.lastRecognitionError = "fallback-server";
        setDebugStatus("browser", "network error, switching to backend");
        return;
      }

      if (passiveWakeMode) {
        setDebugStatus("browser", "wake listener retrying");
        return;
      }

      setDebugStatus("error", "browser recognition needs internet");
      pauseAutoListenWithMessage(
        "Speech recognition needs internet right now. Reconnect, then click Aubit and I will listen again.",
      );
      return;
    }

    if (passiveWakeMode) {
      setDebugStatus("browser", `wake listener retrying: ${errorCode}`);
      return;
    }

    setDebugStatus("error", `browser error: ${errorCode}`);
    pauseAutoListenWithMessage(
      "Voice shell hit a microphone problem. Click Aubit once and I will try again.",
    );
  };

  recognition.onend = async () => {
    const handledTranscript = state.handledTranscript;
    const manualStop = state.manualStop;
    const lastRecognitionError = state.lastRecognitionError;
    const wasPassiveWakeMode = state.passiveWakeMode;

    state.listening = false;
    state.handledTranscript = false;
    state.manualStop = false;
    state.lastRecognitionError = "";

    if (lastRecognitionError === "no-speech") {
      state.passiveWakeMode = false;
      setExpression("awake");
      refreshPresence();
      queueAutoListen();
      return;
    }

    if (lastRecognitionError === "fallback-server") {
      state.passiveWakeMode = false;
      setExpression("awake");
      refreshPresence();
      await startRecordedVoiceCapture({
        silent: false,
        userInitiated: false,
        passiveWakeMode: wasPassiveWakeMode,
      });
      return;
    }

    if (lastRecognitionError) {
      state.passiveWakeMode = false;
      setDebugStatus("error", lastRecognitionError);
      setExpression("awake");
      refreshPresence();
      if (wasPassiveWakeMode) {
        queueAutoListen(450);
      }
      return;
    }

    if (!handledTranscript) {
      setExpression("awake");
      refreshPresence();
    }

    if (!handledTranscript && manualStop) {
      return;
    }

    state.passiveWakeMode = false;
    setDebugStatus("idle", state.awaitingCommandAfterWake ? "awaiting command" : "ready");
    queueAutoListen();
  };

  return recognition;
}

async function startVoiceCapture(options = {}) {
  const passiveWakeMode = options.passiveWakeMode === true && !state.awaitingCommandAfterWake;
  const SpeechRecognition = getSpeechRecognitionConstructor();
  const preferServerTranscription = PREFER_SERVER_TRANSCRIPTION
    && !passiveWakeMode
    && shouldUseServerTranscription()
    && options.forceBrowserRecognition !== true;
  const preferBrowserRecognition = Boolean(SpeechRecognition)
    && !preferServerTranscription
    && options.forceServerTranscription !== true;

  if (preferServerTranscription || (!preferBrowserRecognition && shouldUseServerTranscription())) {
    setDebugStatus("backend", "preferred");
    await startRecordedVoiceCapture(options);
    return;
  }

  if (!SpeechRecognition) {
    if (shouldUseServerTranscription()) {
      setDebugStatus("backend", "browser stt unavailable");
      await startRecordedVoiceCapture(options);
      return;
    }

    setDebugStatus("error", "no stt available");
    holdEmotion("sad", 4200);
    showBubble("Speech-to-text is not available here. Double-click to open Aubit instead.", {
      speak: true,
    });
    return;
  }

  if (!state.recognition) {
    state.recognition = createRecognition();
  }

  if (!state.recognition) {
    setDebugStatus("error", "browser stt init failed");
    holdEmotion("sad", 4200);
    showBubble("Speech-to-text is not available here. Double-click to open Aubit instead.", {
      speak: true,
    });
    return;
  }

  const microphoneReady = await ensureMicrophoneAccess({
    forcePrompt: options.userInitiated === true,
  });

  if (!microphoneReady) {
    if (!options.silent || options.userInitiated) {
      const prompt =
        state.micPermission === "denied"
          ? "Allow microphone access for Aubit in Windows, then click me again."
          : "I could not turn on the microphone yet. Check your mic access, then click me again.";
      showBubble(prompt, { speak: options.userInitiated === true });
    }
    return;
  }

  state.autoListenEnabled = true;
  state.voicePrimed = true;
  state.passiveWakeMode = passiveWakeMode;
  setDebugStatus("browser", passiveWakeMode ? "armed for wake phrase" : "ready");

  if (state.listening) {
    stopVoiceCapture();
    return;
  }

  try {
    state.recognition.start();
  } catch (_error) {
    if (shouldUseServerTranscription() && options.forceBrowserRecognition !== true) {
      setDebugStatus("backend", "browser start failed");
      await startRecordedVoiceCapture(options);
      return;
    }

    if (!options.silent) {
      stopVoiceCapture({
        quiet: false,
        message: "Voice shell is already listening. Try speaking now.",
        speak: true,
      });
    }
  }
}

function enterSleepMode() {
  state.sequenceToken += 1;
  clearExpressionTimer();
  clearEmotionTimer();
  clearSleepTimer();
  setGaze(0, 0);
  setShellMode("active");
  setExpression("awake");
  setDebugStatus("idle", "always ready");
  showBubble(widgetPrompt, { speak: false });
  if (state.voicePrimed) {
    state.autoListenEnabled = true;
    queueAutoListen();
  }
}

async function runWakeSequence(options = {}) {
  const token = state.sequenceToken + 1;
  state.sequenceToken = token;
  clearExpressionTimer();
  clearEmotionTimer();
  clearSleepTimer();
  stopVoiceCapture({ quiet: true });
  setGaze(0, 0);
  setShellMode("active");
  setExpression("waking");
  showBubble(options.message || widgetPrompt);
  await pause(180);
  if (token !== state.sequenceToken) {
    return;
  }

  setExpression("scanning");
  showBubble(options.message || widgetPrompt);
  await pause(340);
  if (token !== state.sequenceToken) {
    return;
  }

  setExpression("awake");
  showBubble(options.message || getVoiceShellPrompt(), { speak: options.speak === true });
  scheduleSleepMode();
  scheduleNextExpression();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

widgetShellButton.addEventListener("pointermove", (event) => {
  const rect = widgetShellButton.getBoundingClientRect();
  const offsetX = ((event.clientX - (rect.left + rect.width / 2)) / rect.width) * 30;
  const offsetY = ((event.clientY - (rect.top + rect.height / 2)) / rect.height) * 18;
  setGaze(clamp(offsetX, -12, 12), clamp(offsetY, -7, 7));
});

widgetShellButton.addEventListener("pointerleave", () => {
  setGaze(0, 0);
});

widgetShellButton.addEventListener("click", async () => {
  unlockAudioPlayback();
  setShellMode("active");
  refreshPresence();
  stopWidgetSpeech();
  await startVoiceCapture({ userInitiated: true });
});

widgetShellButton.addEventListener("dblclick", async () => {
  if (desktopShell?.exitWidgetMode) {
    await desktopShell.exitWidgetMode();
  }
});

["pointerdown", "keydown"].forEach((eventName) => {
  window.addEventListener(eventName, () => {
    unlockAudioPlayback();
    refreshPresence();
  });
});

window.addEventListener("storage", (event) => {
  if (event.key !== PREFERRED_USER_NAME_STORAGE_KEY && event.key !== AUTH_DISPLAY_NAME_STORAGE_KEY) {
    return;
  }

  refreshPromptCopy();
  if (!state.listening && !state.transcribing && !state.awaitingCommandAfterWake) {
    showBubble(getVoiceShellPrompt());
  }
});

desktopShell?.onShellEvent?.((payload) => {
  if (!payload?.type) {
    return;
  }

  if (payload.type === "widget-mode-entered") {
    state.autoListenEnabled = state.voicePrimed;
    setDebugStatus(state.voicePrimed ? "idle" : "setup", state.voicePrimed ? "ready" : "click to enable mic");
    runWakeSequence({
      message: widgetPrompt,
      speak: false,
    });
    queueAutoListen();
  }
});

setShellMode("active");
setExpression("awake");
setDebugStatus("setup", "checking microphone");
showBubble(getVoiceShellPrompt());
restoreAssistantTimers();
scheduleSleepMode();
scheduleNextExpression();
if ("speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.resume();
  };
}
syncMicrophonePermission().then(async () => {
  const ready = state.micReady || await ensureMicrophoneAccess({ forcePrompt: false });
  if (ready) {
    setDebugStatus("idle", "microphone ready");
    queueAutoListen();
    return;
  }

  setDebugStatus("setup", "click to enable mic");
  state.autoListenEnabled = false;
});
