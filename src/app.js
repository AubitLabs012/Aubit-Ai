const speechBubble = document.getElementById("speechBubble");

const boardContent = document.getElementById("boardContent");

const introOverlay = document.getElementById("introOverlay");

const introPod = document.getElementById("introPod");

const introCaption = document.getElementById("introCaption");

const currentUserBadge = document.getElementById("currentUserBadge");

const currentUserLabel = document.getElementById("currentUserLabel");

const goldPointsBadge = document.getElementById("goldPointsBadge");

const goldPointsLabel = document.getElementById("goldPointsLabel");

const companionNameForm = document.getElementById("companionNameForm");

const companionNameInput = document.getElementById("companionNameInput");

const companionNameSave = document.getElementById("companionNameSave");

const homeClock = document.getElementById("homeClock");

const homeClockTime = document.getElementById("homeClockTime");

const homeClockDay = document.getElementById("homeClockDay");

const homeClockDate = document.getElementById("homeClockDate");

const homeClockSeason = document.getElementById("homeClockSeason");

const clickHint = document.querySelector(".click-hint");

const aubitAvatar = document.getElementById("aubitAvatar");

const widgetModeToggle = document.getElementById("widgetModeToggle");

const appShell = document.querySelector(".app-shell");

const studyBoard = document.getElementById("studyBoard");

const boardTitle = document.getElementById("boardTitle");

const boardActionButton = document.getElementById("boardActionButton");

const focusLampButton = document.querySelector('.object-card[data-reaction="focus"]');

const customizeToolButtons = document.getElementById("customizeToolButtons");

const customizeToolToggle = document.getElementById("customizeToolToggle");

const gameToolButtons = document.getElementById("gameToolButtons");

const gameToolToggle = document.getElementById("gameToolToggle");

const mainRoomImage = document.getElementById("mainRoomImage");

const introRoomImage = document.getElementById("introRoomImage");

const introAubit = document.getElementById("introAubit");

const companionStage = document.getElementById("companionStage");

const aubitPlatform = document.getElementById("aubitPlatform");

const aubitAvatarImage = aubitAvatar?.querySelector("img");

const introAubitImage = introAubit?.querySelector("img");

const robotChoiceMenu = document.getElementById("robotChoiceMenu");

const robotChoiceButtons = robotChoiceMenu?.querySelectorAll("[data-robot-variant]") || [];

const aubitWinterBranchCluster = document.getElementById("aubitWinterBranchCluster");

const aubitWinterBranchToggle = document.getElementById("aubitWinterBranchToggle");

const aubitWinterBranchMenu = document.getElementById("aubitWinterBranchMenu");

const homePhotoFrame = document.getElementById("homePhotoFrame");

const photoViewer = document.getElementById("photoViewer");

const photoViewerClose = document.getElementById("photoViewerClose");

const photoViewerBack = document.getElementById("photoViewerBack");

const photoViewerImage = document.getElementById("photoViewerImage");

const entryAuthOverlay = document.getElementById("entryAuthOverlay");

const entryAuthModeButtons = entryAuthOverlay?.querySelectorAll("[data-auth-mode]") || [];

const entrySignInForm = document.getElementById("entrySignInForm");

const entrySignUpForm = document.getElementById("entrySignUpForm");

const entryAuthFeedback = document.getElementById("entryAuthFeedback");

const entryGuestButton = document.getElementById("entryGuestButton");

const entryAgeInput = document.getElementById("entryAgeInput");

const entryAuthResetButton = document.getElementById("entryAuthResetButton");

const floorGatewayButton = document.getElementById("floorGatewayButton");

const floorGatewayLabel = document.getElementById("floorGatewayLabel");



const state = {

  coins: 120,

  goldPoints: 1200,

  stars: 14,

  level: 3,

  introPlayed: false,

  compactMode: false,

  currentPanel: "",

  currentOutfit: "default",

  currentAubiraOutfit: "default",

  currentTopic: "",

  studiedTopic: "",

  studyDraft: "",

  studyMode: "study",

  studyRequestId: 0,

  studyLearnerAge: "",

  currentStudyData: null,

  currentStudyMode: "",

  currentStudyVisualOpen: false,

  lastCreatorImageSubject: "",

  model3dPrompt: "",

  model3dConfigured: null,

  model3dSupportedObjects: [],

  model3dTask: null,

  model3dBusy: false,

  model3dError: "",

  model3dNotice: "",

  currentUserName: "",

  currentUserIdentifier: "",

  preferredUserName: "",

  authUnlocked: false,

  activeGame: "",

  recognition: null,

  studyVoiceTimer: null,

  idleTimer: null,

  sleepTimer: null,

  wakeStageTimer: null,

  wakeCompleteTimer: null,

  theme: "light",

  apiBaseUrl: "",

  resolvedApiBaseUrl: "",

  apiBaseReady: null,

  backendStatus: "unknown",

  backendStatusDetails: null,

  lastBackendError: "",

  authToken: "",

  authReady: null,

  entryAuthBusy: false,

  voiceInputMode: "",

  voiceWakeActive: false,

  voiceBusy: false,

  studyVoiceBusy: false,

  studyMediaRecorder: null,

  studyRecordingStream: null,

  studyRecordingChunks: [],

  studyRecordingMimeType: "audio/webm",

  studyRecordingFrame: 0,

  studyRecordingStartedAt: 0,

  studyRecordingLastVoiceAt: 0,

  studySpeechDetected: false,

  robotVariant: "male",

  robotMenuOpen: false,

  customizeMenuOpen: false,

  gameMenuOpen: false,

  jintendoSelectedIndex: 0,

  activeOutfitBranch: "",

  avatarState: "awake",

  avatarAction: "stand",

  avatarMoving: false,

  avatarPositionX: 0,

  avatarPositionY: 0,

  avatarMoveTimer: null,

  avatarActionTimer: null,

  avatarExpression: "neutral",

  avatarExpressionTimer: null,

  speechBubbleWriteTimer: null,

};



const studyModeConfigs = {

  study: {

    label: "Study",

    boardLabel: "Study topic",

    placeholder: "Ask Aubit about Python, Algebra, Gravity...",

  },

  solve: {

    label: "Solve",

    boardLabel: "Solve",

    placeholder: "Type an equation, math problem, or coding issue...",

  },

  image: {

    label: "Create Image",

    boardLabel: "Image idea",

    placeholder: "Describe the visual, diagram, or image you want...",

  },

  summarize: {

    label: "Summarize",

    boardLabel: "Summary source",

    placeholder: "Paste notes or text to summarize...",

  },

  practice: {

    label: "Practice",

    boardLabel: "Practice topic",

    placeholder: "Enter the topic you want to practice...",

  },

  simple: {

    label: "Simple",

    boardLabel: "Simple explain",

    placeholder: "Ask for a simple explanation...",

  },

};



const desktopShell = window.aubitDesktop || null;

const isDesktopShellAvailable = Boolean(desktopShell?.isDesktopShell);



const roomImages = {

  default: {

    light: "./images/HomeSection.jpeg",

    dark: "./images/HomeSection.jpeg",

  },

  games: {

    light: "./images/GameHubSection.jpeg",

    dark: "./images/GameHubSection.jpeg",

  },

  customize: {

    light: "./images/CustomizeSection.jpeg",

    dark: "./images/CustomizeSection.jpeg",

  },

};



const homeFocusImage = "./images/HomeSectionFocus.jpeg";

const apiBaseCandidates = ["http://127.0.0.1:8000/api", "http://127.0.0.1:8001/api"];

const sectionVisualAssets = [

  ...new Set([

    ...Object.values(roomImages).flatMap((panelImages) => Object.values(panelImages)),

    homeFocusImage,

    "./src/assets/game-hub-bg.jpeg",

    "./src/assets/customize-hub-bg.jpeg",

  ]),

];

const AUTH_ACCOUNTS_STORAGE_KEY = "aubit.auth.accounts.v1";

const AUTH_LAST_USER_STORAGE_KEY = "aubit.auth.last-user.v1";

const AUTH_UNLOCKED_STORAGE_KEY = "aubit.auth.unlocked.v1";

const AUTH_DISPLAY_NAME_STORAGE_KEY = "aubit.auth.display-name.v1";

const AUTH_TOKEN_STORAGE_KEY = "aubit.auth.token.v1";

const AUTH_POD_PENDING_STORAGE_KEY = "aubit.auth.pod-pending.v1";

const ROBOT_VARIANT_STORAGE_KEY = "aubit.robot.variant.v1";

const PREFERRED_USER_NAME_STORAGE_KEY = "aubit.user.preferred-name.v1";

const STUDY_LEARNER_AGE_STORAGE_KEY = "aubit.study.learner-age.v1";

const GOLD_POINTS_STORAGE_KEY = "aubit.profile.gold-points.v1";

const STARTING_GOLD_POINTS = 1200;

const warmedImageAssets = new Map();

const robotBaseImages = {

  male: "./images/robot-earlier.png",

  female: "./images/Aubit-Female.png",

};

const robotProfiles = {

  male: {

    name: "Aubit",

    introName: "Aubit",

  },

  female: {

    name: "Aubira",

    introName: "Aubira",

  },

};



const outfitImages = {

  default: robotBaseImages.male,

  "armor-red": "./images/Aubit-Red-Armor-Hero.png",

  "aubit-red-winter": "./images/Aubit-Red-Winter.png",

  "aubit-green-winter": "./images/Aubit-Green-Winter.png",

  "casual-green": "./images/Aubit-Green.png",

  "street-green": "./images/Aubit-Street-Green.png",

  "vibe-code": "./images/Aubit-Vibe-Code.png",

  "cobra-kai": "./images/Aubit-Cobra-Kai.png",

};



const aubitWinterOutfitStyles = ["aubit-red-winter", "aubit-green-winter"];



const aubiraOutfitImages = {

  default: robotBaseImages.female,

  "aubira-violet": "./images/Aubira-Violet.png",

  "aubira-pink-casual": "./images/Aubira-Pink-Casual.png",

  "aubira-winter-coat": "./images/Aubira-Winter-Coat.png",

};



const creatorReferenceImages = {

  jayash: {

    name: "Jayash Nishad",

    src: "./images/creator-jayash.png",

  },

  het: {

    name: "Het Balchandani",

    src: "./images/creator-het.jpeg",

  },

  kamaal: {

    name: "Kamaal solanki",

    src: "./images/creator-kamaal.jpeg",

  },

};



const gameLinks = {

  sudoku: "./sudoku.html",

  "snake-ladder": "./snake-and-ladder.html",

  chess: "./chess.html",

  monopoly: "./monopoly.html",

  maze: "./maze.html",

  "red-bounce": "./red-bounce.html",

  "subway-sprint": "./subway-sprint.html",

  "temple-run": "https://templerun.org/",

};



const jintendoGames = [

  {

    id: "maze",

    title: "Neon Maze DX",

    kicker: "Arcade Puzzle",

    description: "Guide the glow-runner through shifting neon paths and reach the portal before the timer bites.",

    accent: "#45d7ff",

    icon: "./src/assets/maze-logo.svg",

    status: "Playable",

  },

  {

    id: "red-bounce",

    title: "Red Bounce DX",

    kicker: "Platform Dash",

    description: "Bounce through hazards, collect sparks, and keep the momentum alive in Aubit's arcade arena.",

    accent: "#ff5f6d",

    icon: "./src/assets/red-bounce-logo.svg",

    status: "Playable",

  },

  {

    id: "subway-sprint",

    title: "Subway Sprint",

    kicker: "Runner",

    description: "Dash across three train tracks, dodge barriers, slide under signs, and scoop up coins as the speed climbs.",

    accent: "#20d6a1",

    icon: "./src/assets/subway-sprint-logo.svg",

    status: "Playable",

  },

  {

    id: "chess",

    title: "Aubit Chess",

    kicker: "Strategy",

    description: "Challenge the board with classic chess logic and a focused Aubit-style match screen.",

    accent: "#f4c95d",

    icon: "./src/assets/chess-logo.svg",

    status: "Playable",

  },

  {

    id: "sudoku",

    title: "Sudoku Grid",

    kicker: "Brain Puzzle",

    description: "Fill the grid, sharpen focus, and earn calm puzzle points from the Jintendo shelf.",

    accent: "#7cf2b4",

    icon: "./src/assets/sudoku-logo.png",

    status: "Playable",

  },

  {

    id: "snake-ladder",

    title: "Snake & Ladder",

    kicker: "Board Classic",

    description: "Roll, climb, slide, and race to the finish with a bright tabletop feel.",

    accent: "#ff9f45",

    icon: "./src/assets/snake-ladder-logo.png",

    status: "Playable",

  },

  {

    id: "monopoly",

    title: "Aubit Streets",

    kicker: "Board Tycoon",

    description: "A city-board slot for Aubit's property game experiment and future economy play.",

    accent: "#b68cff",

    icon: "./src/assets/monopoly-logo.svg",

    status: "Prototype",

  },

];



const homeClockFormatters = {

  day: new Intl.DateTimeFormat(undefined, { weekday: "long" }),

  date: new Intl.DateTimeFormat(undefined, {

    day: "numeric",

    month: "long",

    year: "numeric",

  }),

  time: new Intl.DateTimeFormat(undefined, {

    hour: "numeric",

    minute: "2-digit",

    second: "2-digit",

  }),

};



let homeClockTimerId = 0;

const studyDiagramRuntime = {

  rafId: 0,

  canvas: null,

  spec: null,

  startTime: 0,

  lastFrameTime: 0,

};

const studyTopicPhotoCache = new Map();

let studyTopicPhotoRequestId = 0;

const pointerTrackingRuntime = {

  rafId: 0,

  pointerX: 0,

  pointerY: 0,

};

let lastIdleRefreshAt = 0;

let hasBootstrappedApp = false;



function syncWidgetModeToggleLabel() {

  const label = widgetModeToggle?.lastElementChild;

  if (!label) {

    return;

  }



  if (isDesktopShellAvailable) {

    label.textContent = "Voice Assistant";

    return;

  }



  label.textContent = state.compactMode ? "Immersive App" : "Voice Assistant";

}



desktopShell?.onShellEvent?.((payload) => {

  if (!payload?.type) {

    return;

  }



  if (payload.type === "backend-status") {

    state.backendStatus = typeof payload.status === "string" ? payload.status : "unknown";

    state.backendStatusDetails = payload.details || null;

    if (typeof payload.baseUrl === "string" && payload.baseUrl) {

      state.apiBaseUrl = payload.baseUrl;

      state.resolvedApiBaseUrl = payload.baseUrl;

    }



    if (payload.status === "connected") {

      state.lastBackendError = "";

      return;

    }



    if (payload.status === "error" || payload.status === "stopped" || payload.status === "missing") {

      state.lastBackendError = payload.reason || `Backend status: ${payload.status}`;

    }

    return;

  }



  if (payload.type === "immersive-mode-entered") {

    state.compactMode = false;

    appShell.classList.remove("compact-mode");

    syncWidgetModeToggleLabel();

    return;

  }



  if (payload.type === "panel-requested") {

    const requestedPanel = typeof payload.panel === "string" ? payload.panel : "";

    const requestedTopic = typeof payload.topic === "string" ? payload.topic.trim() : "";



    if (!requestedPanel) {

      return;

    }



    if (requestedPanel === "study") {

      state.studyDraft = requestedTopic;

    }



    if (requestedPanel !== state.currentPanel) {

      activatePanel(requestedPanel);

    } else if (requestedPanel === "study") {

      renderStudyTopicPrompt();

    }



    if (requestedPanel === "study") {

      if (requestedTopic) {

        window.setTimeout(() => {

          startStudySession(requestedTopic);

        }, 120);

        return;

      }



      queueStudyVoiceCapture();

    }

  }

});



function getGameLabel(game) {

  return jintendoGames.find((item) => item.id === game)?.title || "selected game";

}



function getJintendoGame(gameId) {

  return jintendoGames.find((item) => item.id === gameId) || jintendoGames[0];

}



function getJintendoGameIndex(gameId) {

  const index = jintendoGames.findIndex((item) => item.id === gameId);

  return index >= 0 ? index : 0;

}



function getSeasonLabel(date = new Date()) {

  const month = date.getMonth();



  if (month >= 2 && month <= 4) {

    return "Spring";

  }



  if (month >= 5 && month <= 7) {

    return "Summer";

  }



  if (month >= 8 && month <= 10) {

    return "Autumn";

  }



  return "Winter";

}



function updateHomeClock() {

  if (!homeClock || !homeClockTime || !homeClockDay || !homeClockDate || !homeClockSeason) {

    return;

  }



  const now = new Date();

  const dayLabel = homeClockFormatters.day.format(now);

  const dateLabel = homeClockFormatters.date.format(now);

  const timeLabel = homeClockFormatters.time.format(now);

  const seasonLabel = getSeasonLabel(now);



  homeClockTime.textContent = timeLabel;

  homeClockDay.textContent = dayLabel;

  homeClockDate.textContent = dateLabel;

  homeClockSeason.textContent = seasonLabel;

  homeClock.setAttribute("aria-label", `${dayLabel}, ${dateLabel}, ${timeLabel}, ${seasonLabel} season`);

}



function startHomeClock() {

  updateHomeClock();



  if (homeClockTimerId) {

    window.clearInterval(homeClockTimerId);

  }



  homeClockTimerId = window.setInterval(updateHomeClock, 1000);

}



function isEmbeddedBoardGame(game) {

  return game === "sudoku" || game === "snake-ladder" || game === "chess" || game === "monopoly" || game === "maze" || game === "red-bounce" || game === "subway-sprint";

}



const boardTopics = {

  study: {

    title: "Study workspace",

    copy:

      "Aubit can teach a topic step by step with clear explanations and visuals whenever you ask for them.",

  },

  games: {

    title: "Aubit play space",

    copy:

      "Sudoku, Aubit Run, memory loops, and puzzle challenges all feed coins and stars back into the companion world.",

  },

  customize: {

    title: "Companion style editor",

    copy:

      "Preview hoodies, seasonal jackets, and futuristic suits in real time while the room updates with matching accent lights.",

  },

  creator: {

    title: "Creator info board",

    copy:

      "Plan your next video, lesson, post, or launch with a simple creator workflow and clear publishing prompts.",

  },

  model3d: {

    title: "Text to 3D Model",

    copy: "Describe an object, build a local 3D model, and export GLB or STL.",

  },

  settings: {

    title: "Desktop assistant controls",

    copy:

      "Switch between widget overlay, immersive room, and ambient idle mode while keeping shared memory and shared progression.",

  },

};



const youtubeEmbeds = {

  gravity: "https://www.youtube-nocookie.com/embed/MTY1Kje0yLg",

  photosynthesis: "https://www.youtube-nocookie.com/embed/eY1REQ2Da7Y",

  algebra: "https://www.youtube-nocookie.com/embed/NybHckSEQBI",

  "solar system": "https://www.youtube-nocookie.com/embed/libKVRa01L8",

  python: "https://www.youtube-nocookie.com/embed/kqtD5dpn9C8",

};



function topicKey(value) {

  return value.trim().toLowerCase();

}



function updateBoardChrome(title, showAction = false, actionLabel = "Explain Python") {

  boardTitle.textContent = title;

  boardActionButton.textContent = actionLabel;

  boardActionButton.classList.toggle("is-hidden", !showAction);

}



function setBoardContentLayout(layout = "default") {

  studyBoard.dataset.contentLayout = layout;

  boardContent.classList.toggle("game-embed-mode", layout === "game-embed");

  boardContent.classList.toggle("image-fit-mode", layout === "image-fit");

}



function replaceBoardContent(markup) {

  stopStudyDiagramRenderer();

  boardContent.innerHTML = markup;

}



function warmImageAsset(source) {

  if (!source) {

    return Promise.resolve();

  }



  const cachedAsset = warmedImageAssets.get(source);

  if (cachedAsset) {

    return cachedAsset.ready;

  }



  const image = new Image();

  image.decoding = "async";



  let resolved = false;

  let resolveReady = () => {};

  const ready = new Promise((resolve) => {

    resolveReady = resolve;

  });



  const completeWarmup = () => {

    if (resolved) {

      return;

    }



    resolved = true;

    resolveReady();

  };



  const finishWarmup = () => {

    if (typeof image.decode === "function") {

      image.decode().catch(() => {}).finally(completeWarmup);

      return;

    }



    completeWarmup();

  };



  warmedImageAssets.set(source, { image, ready });

  image.addEventListener("load", finishWarmup, { once: true });

  image.addEventListener("error", completeWarmup, { once: true });

  image.src = source;



  if (image.complete) {

    finishWarmup();

  }



  return ready;

}



function warmSectionAssets() {

  sectionVisualAssets.forEach((source) => {

    warmImageAsset(source);

  });

}



function setImageSource(imageElement, source) {

  if (!imageElement || !source) {

    return;

  }



  const currentSource = imageElement.dataset.activeSrc || imageElement.getAttribute("src") || "";

  if (currentSource === source) {

    return;

  }



  imageElement.dataset.activeSrc = source;

  imageElement.src = source;

}



function applyRoomBackdrop() {

  const variant =

    state.currentPanel === "games"

      ? "games"

      : state.currentPanel === "customize"

        ? "customize"

        : "default";

  const isHomeView = !state.currentPanel;

  const nextRoomImage = isHomeView && state.theme === "dark" ? homeFocusImage : roomImages[variant][state.theme];

  const nextIntroRoomImage = roomImages.default[state.theme];



  warmImageAsset(nextRoomImage);

  warmImageAsset(nextIntroRoomImage);

  setImageSource(mainRoomImage, nextRoomImage);

  setImageSource(introRoomImage, nextIntroRoomImage);

}



warmSectionAssets();



const reactions = {

  tickle: {

    mood: "Playful",

    speech: "That tickles. I am still ready to help whenever you want.",

    status: "Aubit reacted to touch input and shifted into a playful companion state.",

  },

  feed: {

    mood: "Cared For",

    speech: "Thank you. I feel looked after. Shall we do something rewarding next?",

    status: "Companion care increases trust, emotion score, and room evolution progress.",

    reward: { coins: 8, stars: 1 },

  },

  focus: {

    mood: "Focused Mentor",

    speech: "Focus mode is on. Let us learn calmly, one step at a time.",

    status: "Study lighting is now active. Aubit will keep explanations concise and visual.",

  },

};



const outfitResponses = {

  default: "Default shell loaded. Clean, friendly, and assistant-first.",

  "armor-red": "Red armor style applied. Aubit now looks bolder and more heroic.",

  "aubit-red-winter": "Red cozy winter style applied. Aubit now has a warm cold-weather look.",

  "aubit-green-winter": "Green winter style applied. Aubit now has a fresh cold-weather look.",

  "casual-green": "Green casual style applied. Aubit now has a calm casual look.",

  "street-green": "Green street jacket style applied. Aubit now has a casual gamer vibe.",

  "vibe-code": "Vibe Code shirt style applied. Aubit is now ready to ship in style.",

  "cobra-kai": "Cobra Kai style applied. Aubit is in strike-first mode.",

};



const aubiraOutfitResponses = {

  default: "Aubira default shell restored. Clean, bright, and ready to help.",

  "aubira-violet": "Aubira violet style applied. She now has a bold futuristic glow.",

  "aubira-pink-casual": "Aubira pink casual style applied. She now has a softer everyday look.",

  "aubira-winter-coat": "Aubira winter outfit applied. She now has a cozy cold-weather look.",

};



function readStoredRobotVariant() {

  try {

    const storedVariant = window.localStorage.getItem(ROBOT_VARIANT_STORAGE_KEY);

    return storedVariant === "female" ? "female" : "male";

  } catch (_error) {

    return "male";

  }

}



function writeStoredRobotVariant(variant) {

  try {

    window.localStorage.setItem(ROBOT_VARIANT_STORAGE_KEY, variant);

  } catch (_error) {

  }

}



function normalizePreferredUserName(value) {

  return String(value || "")

    .replace(/\s+/g, " ")

    .trim()

    .slice(0, 24);

}



function readStoredPreferredUserName() {

  try {

    return normalizePreferredUserName(window.localStorage.getItem(PREFERRED_USER_NAME_STORAGE_KEY) || "");

  } catch (_error) {

    return "";

  }

}



function writeStoredPreferredUserName(value) {

  const normalized = normalizePreferredUserName(value);

  try {

    if (normalized) {

      window.localStorage.setItem(PREFERRED_USER_NAME_STORAGE_KEY, normalized);

    } else {

      window.localStorage.removeItem(PREFERRED_USER_NAME_STORAGE_KEY);

    }

  } catch (_error) {

  }



  return normalized;

}



function getPreferredUserName() {

  return normalizePreferredUserName(state.preferredUserName || state.currentUserName);

}



function buildCompanionGreeting(options = {}) {

  const userName = getPreferredUserName();

  const intro = userName ? `Hi ${userName}, how are you today?` : "Hi, how are you today?";

  const robotName = getRobotProfile().name;

  const body = options.listening

    ? `I'm ${robotName}, and I'm listening.`

    : `I'm ${robotName}, and I'm here with you for help, ideas, or just some company.`;

  return `${intro} ${body}`;

}



function syncPreferredNameControls() {

  if (!companionNameInput) {

    return;

  }



  const defaultName = normalizePreferredUserName(state.currentUserName);

  const savedName = normalizePreferredUserName(state.preferredUserName || defaultName);

  if (document.activeElement !== companionNameInput) {

    companionNameInput.value = savedName;

  }



  if (companionNameSave) {

    const typedName = normalizePreferredUserName(companionNameInput.value);

    companionNameSave.disabled = typedName === savedName;

  }

}



function applyPreferredUserName(value, options = {}) {

  state.preferredUserName = writeStoredPreferredUserName(value);

  syncPreferredNameControls();



  if (options.announce === false) {

    return;

  }



  if (state.preferredUserName) {

    setCompanionState({

      speech: `Perfect. I'll call you ${state.preferredUserName} from now on.`,

    });

    return;

  }



  const fallbackName = normalizePreferredUserName(state.currentUserName);

  setCompanionState({

    speech: fallbackName

      ? `All set. I'll go back to calling you ${fallbackName}.`

      : "All set. I'll keep the greeting neutral until you save a name again.",

  });

}



function handlePreferredNameSubmit(event) {

  event.preventDefault();

  applyPreferredUserName(companionNameInput?.value || "");

}



function handlePreferredNameStorage(event) {

  if (event.key !== PREFERRED_USER_NAME_STORAGE_KEY) {

    return;

  }



  state.preferredUserName = readStoredPreferredUserName();

  syncPreferredNameControls();

  if (!state.authUnlocked) {

    return;

  }



  speechBubble.textContent = buildCompanionGreeting();

}



function getRobotProfile(variant = state.robotVariant) {

  return robotProfiles[variant === "female" ? "female" : "male"];

}



function getSelectedOutfitStyle(variant = state.robotVariant) {

  return variant === "female" ? state.currentAubiraOutfit : state.currentOutfit;

}



function getDisplayedOutfit() {

  return getSelectedOutfitStyle();

}



function getActiveRobotImage() {

  if (state.robotVariant === "female") {

    return aubiraOutfitImages[state.currentAubiraOutfit] || robotBaseImages.female;

  }



  return outfitImages[state.currentOutfit] || outfitImages.default;

}



function syncCustomizeButtons() {

  const selectedStyle = getSelectedOutfitStyle();

  const isWinterBranchVisible = state.robotVariant === "male";

  const isWinterBranchOpen =

    state.customizeMenuOpen &&

    state.activeOutfitBranch === "aubit-winter" &&

    isWinterBranchVisible;



  customizeToolButtons?.querySelectorAll("[data-outfit-style]").forEach((button) => {

    const visibleFor = button.dataset.visibleFor || "all";

    const isVisible = visibleFor === "all" || visibleFor === state.robotVariant;

    const isBranchOption = Boolean(button.closest("#aubitWinterBranchMenu"));

    button.classList.toggle("is-hidden-by-variant", !isVisible);

    button.classList.toggle("active", isVisible && button.dataset.outfitStyle === selectedStyle);

    button.setAttribute("aria-hidden", isVisible ? "false" : "true");

    button.tabIndex = isVisible && (!isBranchOption || isWinterBranchOpen) ? 0 : -1;

  });



  if (aubitWinterBranchCluster) {

    aubitWinterBranchCluster.classList.toggle("is-hidden-by-variant", !isWinterBranchVisible);

    aubitWinterBranchCluster.setAttribute("aria-hidden", isWinterBranchVisible ? "false" : "true");

  }



  if (aubitWinterBranchToggle) {

    const activeWinterStyle = aubitWinterOutfitStyles.includes(selectedStyle)

      ? selectedStyle

      : "aubit-red-winter";

    const previewImage = aubitWinterBranchToggle.querySelector("img");



    if (previewImage) {

      previewImage.src = outfitImages[activeWinterStyle] || outfitImages["aubit-red-winter"];

      previewImage.alt =

        activeWinterStyle === "aubit-green-winter"

          ? "Green winter robot style"

          : "Red cozy winter robot style";

    }



    aubitWinterBranchToggle.classList.toggle(

      "active",

      isWinterBranchVisible && aubitWinterOutfitStyles.includes(selectedStyle),

    );

    aubitWinterBranchToggle.setAttribute("aria-expanded", isWinterBranchOpen ? "true" : "false");

    aubitWinterBranchToggle.tabIndex = isWinterBranchVisible ? 0 : -1;

  }



  if (aubitWinterBranchMenu) {

    aubitWinterBranchMenu.classList.toggle("is-open", isWinterBranchOpen);

    aubitWinterBranchMenu.setAttribute("aria-hidden", isWinterBranchOpen ? "false" : "true");

  }



  const defaultPreviewImage = customizeToolButtons?.querySelector('[data-outfit-style="default"] img');

  if (defaultPreviewImage) {

    defaultPreviewImage.src = state.robotVariant === "female" ? robotBaseImages.female : outfitImages.default;

    defaultPreviewImage.alt = state.robotVariant === "female" ? "Aubira default robot style" : "Original white robot style";

  }

}



function syncRobotChoiceButtons() {

  robotChoiceButtons.forEach((button) => {

    const isActive = button.dataset.robotVariant === state.robotVariant;

    button.classList.toggle("active", isActive);

    button.setAttribute("aria-pressed", isActive ? "true" : "false");

  });

}



function renderRobotAppearance() {

  const robotProfile = getRobotProfile();

  const imageSrc = getActiveRobotImage();

  const displayedOutfit = getDisplayedOutfit();



  if (aubitAvatarImage) {

    aubitAvatarImage.src = imageSrc;

    aubitAvatarImage.alt = `${robotProfile.name} robot`;

  }

  if (aubitAvatar) {

    aubitAvatar.dataset.outfit = displayedOutfit;

    aubitAvatar.dataset.robotVariant = state.robotVariant;

  }



  if (introAubitImage) {

    introAubitImage.src = imageSrc;

    introAubitImage.alt = `${robotProfile.introName} robot emerging from pod`;

  }



  if (introAubit) {

    introAubit.dataset.outfit = displayedOutfit;

    introAubit.dataset.robotVariant = state.robotVariant;

  }



  if (clickHint) {

    clickHint.textContent = `Tap the pod to open ${robotProfile.name}`;

  }



  if (introCaption) {

    introCaption.textContent = `Tap the pod to open ${robotProfile.name}`;

  }



  syncRobotChoiceButtons();

  syncCustomizeButtons();

}



function setRobotMenu(open) {

  state.robotMenuOpen = Boolean(open);

  robotChoiceMenu?.classList.toggle("is-open", state.robotMenuOpen);

  robotChoiceMenu?.setAttribute("aria-hidden", state.robotMenuOpen ? "false" : "true");

  aubitAvatar?.setAttribute("aria-expanded", state.robotMenuOpen ? "true" : "false");

}



function setRobotVariant(variant, options = {}) {

  const nextVariant = variant === "female" ? "female" : "male";

  const shouldAnnounce = options.announce !== false;



  state.robotVariant = nextVariant;

  state.activeOutfitBranch = "";

  writeStoredRobotVariant(nextVariant);

  renderRobotAppearance();

  setRobotMenu(false);



  if (!shouldAnnounce) {

    return;

  }



  setCompanionState({

    speech: `${getRobotProfile(nextVariant).name} selected. I am ready to help.`,

  });

}



function applyOutfitStyle(style) {

  const nextStyle = style || "default";

  if (state.robotVariant === "female" && Object.prototype.hasOwnProperty.call(aubiraOutfitImages, nextStyle)) {

    state.currentAubiraOutfit = nextStyle;

  } else {

    state.currentOutfit = nextStyle;

  }



  state.activeOutfitBranch = "";

  renderRobotAppearance();

}



function setCustomizeMenu(open) {

  state.customizeMenuOpen = Boolean(open);

  if (!state.customizeMenuOpen) {

    state.activeOutfitBranch = "";

  }

  customizeToolButtons?.classList.toggle("menu-open", state.customizeMenuOpen);

  customizeToolToggle?.setAttribute("aria-expanded", state.customizeMenuOpen ? "true" : "false");

  syncCustomizeButtons();

}



function setOutfitBranch(branch = "") {

  state.activeOutfitBranch = branch;

  syncCustomizeButtons();

}



function setGameMenu(open) {

  state.gameMenuOpen = Boolean(open);

  gameToolButtons?.classList.toggle("menu-open", state.gameMenuOpen);

  gameToolToggle?.setAttribute("aria-expanded", state.gameMenuOpen ? "true" : "false");

}



function openJintendoLauncher(options = {}) {

  if (state.currentPanel !== "games") {

    activatePanel("games");

  } else {

    renderGamesBoard();

  }



  setGameMenu(Boolean(options.showIconMenu));

  setCompanionState({

    mood: "Jintendo Ready",

    speech: "Jintendo Games is open. Slide through the emulator shelf and choose what to play.",

    status: "The Jintendo game-emulator launcher is active.",

  });

}



function updateJintendoSelection(gameId, options = {}) {

  const game = getJintendoGame(gameId);

  state.jintendoSelectedIndex = getJintendoGameIndex(game.id);



  const feature = boardContent.querySelector(".jintendo-feature");

  if (feature) {

    feature.style.setProperty("--game-accent", game.accent);

    const title = feature.querySelector("[data-jintendo-feature-title]");

    const description = feature.querySelector("[data-jintendo-feature-description]");

    const label = feature.querySelector("[data-jintendo-feature-label]");

    const playButton = feature.querySelector("[data-jintendo-play]");



    if (title) {

      title.textContent = game.title;

    }

    if (description) {

      description.textContent = game.description;

    }

    if (label) {

      label.textContent = `${game.kicker} / ${game.status}`;

    }

    if (playButton) {

      playButton.dataset.game = game.id;

      playButton.setAttribute("aria-label", `Play ${game.title}`);

    }

  }



  boardContent.querySelectorAll(".jintendo-game-card").forEach((card) => {

    const isSelected = card.dataset.game === game.id;

    card.classList.toggle("featured", isSelected);

    card.setAttribute("aria-current", isSelected ? "true" : "false");

    card.setAttribute("tabindex", isSelected ? "0" : "-1");

  });



  if (options.scroll) {

    boardContent.querySelector(`.jintendo-game-card[data-game="${game.id}"]`)?.scrollIntoView({

      behavior: "smooth",

      inline: "center",

      block: "nearest",

    });

  }

}



function syncJintendoSelectionFromScroll(carousel) {

  if (!carousel) {

    return;

  }



  const cards = [...carousel.querySelectorAll(".jintendo-game-card")];

  if (!cards.length) {

    return;

  }



  const carouselCenter = carousel.scrollLeft + carousel.clientWidth / 2;

  const closestCard = cards.reduce((closest, card) => {

    const cardCenter = card.offsetLeft + card.offsetWidth / 2;

    const distance = Math.abs(cardCenter - carouselCenter);

    return distance < closest.distance ? { card, distance } : closest;

  }, { card: cards[0], distance: Number.POSITIVE_INFINITY }).card;



  if (closestCard?.dataset.game) {

    updateJintendoSelection(closestCard.dataset.game);

  }

}



function installJintendoCarouselRuntime() {

  const carousel = boardContent.querySelector(".jintendo-carousel");

  if (!carousel) {

    return;

  }



  let scrollTimer = 0;

  carousel.addEventListener("scroll", () => {

    window.clearTimeout(scrollTimer);

    scrollTimer = window.setTimeout(() => {

      syncJintendoSelectionFromScroll(carousel);

    }, 80);

  });



  carousel.addEventListener("keydown", (event) => {

    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {

      return;

    }



    event.preventDefault();

    const direction = event.key === "ArrowRight" ? 1 : -1;

    const nextIndex = Math.max(0, Math.min(jintendoGames.length - 1, state.jintendoSelectedIndex + direction));

    updateJintendoSelection(jintendoGames[nextIndex]?.id, { scroll: true });

  });



  updateJintendoSelection(getJintendoGame(jintendoGames[state.jintendoSelectedIndex]?.id).id);

}



function getGoldPointsStorageKey(identifier = "") {

  const normalizedIdentifier = normalizeAuthIdentifier(identifier || state.currentUserIdentifier || state.currentUserName || "guest");

  return `${GOLD_POINTS_STORAGE_KEY}:${normalizedIdentifier || "guest"}`;

}



function readStoredGoldPoints(identifier = "") {

  try {

    const storedValue = Number.parseInt(window.localStorage.getItem(getGoldPointsStorageKey(identifier)) || "", 10);

    return Number.isFinite(storedValue) && storedValue >= 0 ? storedValue : STARTING_GOLD_POINTS;

  } catch (_error) {

    return STARTING_GOLD_POINTS;

  }

}



function writeStoredGoldPoints(value, identifier = "") {

  const normalizedValue = Math.max(0, Math.floor(Number(value) || 0));

  try {

    window.localStorage.setItem(getGoldPointsStorageKey(identifier), String(normalizedValue));

  } catch (_error) {

  }

  return normalizedValue;

}



function syncGoldPointsBadge() {

  if (!goldPointsLabel) {

    return;

  }



  goldPointsLabel.textContent = state.goldPoints.toLocaleString();

  goldPointsBadge?.classList.toggle("is-guest", !state.currentUserName.trim());

}



function loadGoldPointsForUser(identifier = "") {

  state.goldPoints = readStoredGoldPoints(identifier);

  writeStoredGoldPoints(state.goldPoints, identifier);

  syncGoldPointsBadge();

}



function updateRewards(delta = {}) {

  state.coins += delta.coins || 0;

  state.goldPoints += delta.gp ?? delta.goldPoints ?? 0;

  state.stars += delta.stars || 0;

  state.level += delta.level || 0;

  state.goldPoints = writeStoredGoldPoints(state.goldPoints);

  syncGoldPointsBadge();

}



function normalizeSpeechText(text) {

  return text

    .replace(/\*\*/g, "")

    .replace(/`/g, "")

    .replace(/\s+/g, " ")

    .trim();

}



function splitSpeechIntoChunks(text, maxLength = 320) {

  const normalized = normalizeSpeechText(text);

  if (!normalized) {

    return [];

  }



  const sentences = normalized.match(/[^.!?]+[.!?]?/g) || [normalized];

  const chunks = [];

  let current = "";



  sentences.forEach((sentence) => {

    const next = sentence.trim();

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



function selectPreferredVoice(voices) {

  const englishVoices = voices.filter((voice) => /^en(?:-|_)?/i.test(voice.lang || ""));

  const voicePool = englishVoices.length ? englishVoices : voices;

  const rankedPatterns = [

    /Microsoft Guy|Microsoft Davis|Microsoft Ryan|Microsoft Andrew|Google UK English Male|Daniel|Alex|Fred|Thomas|Aaron|David|Mark/i,

    /Google US English|Google UK English/i,

    /en(-|_)?(US|GB)/i,

    /Microsoft|Google/i,

  ];



  for (const pattern of rankedPatterns) {

    const match = voicePool.find((voice) => pattern.test(`${voice.name} ${voice.lang}`));

    if (match) {

      return match;

    }

  }



  return voicePool[0] || null;

}



function setSpeechBubbleText(text, options = {}) {

  if (!speechBubble) {

    return;

  }



  window.clearTimeout(state.speechBubbleWriteTimer);

  state.speechBubbleWriteTimer = null;



  const sourceText = String(text || "");

  const writeLineByLine = options.lineByLine !== false && sourceText.includes("\n");



  if (!writeLineByLine) {

    speechBubble.textContent = sourceText;

  } else {

    const lines = sourceText

      .split(/\n+/)

      .map((line) => line.trim())

      .filter(Boolean);

    let index = 0;

    speechBubble.textContent = "";



    const writeNextLine = () => {

      speechBubble.textContent = lines.slice(0, index + 1).join("\n");

      index += 1;



      if (index < lines.length) {

        state.speechBubbleWriteTimer = window.setTimeout(writeNextLine, 1250);

      }

    };



    writeNextLine();

  }



  if (!text) {

    return;

  }



  if (state.avatarState === "sleeping") {

    setAvatarExpressionVariant("sleepy", { duration: 900, allowWhileLocked: true });

    return;

  }



  setAvatarExpressionVariant(inferAvatarExpressionFromSpeech(text), {

    duration: 1400,

    allowWhileLocked: true,

  });

}



function inferAvatarExpressionFromSpeech(text) {

  const normalized = String(text || "").trim().toLowerCase();

  if (!normalized) {

    return "speaking";

  }



  if (/\b(sleep|rest|good night|nap)\b/.test(normalized)) {

    return "sleepy";

  }



  if (/\b(haha|hehe|lol|joke|funny|laugh|giggle)\b/.test(normalized)) {

    return "playful";

  }



  if (/\b(wink|secret|between us|trust me|you got this)\b/.test(normalized)) {

    return "wink";

  }



  if (/\b(i'm sorry|i am sorry|rough day|hard day|it's okay|its okay|i'm here|i am here|you are safe|breathe|take your time)\b/.test(normalized)) {

    return "soft";

  }



  if (/\b(focus|careful|look closely|analyze|important|precision|step by step)\b/.test(normalized)) {

    return "focused";

  }



  if (/\b(amazing|awesome|great job|proud of you|let's go|lets go|yes!|brilliant)\b/.test(normalized)) {

    return "spark";

  }



  if (/[?!]/.test(normalized)) {

    return "curious";

  }



  if (/\b(hi|hello|hey|good morning|good evening)\b/.test(normalized)) {

    return "soft";

  }



  return "speaking";

}



function shouldAutoSpeak(forceSpeak = false) {

  return forceSpeak || state.currentPanel === "study";

}



let activeSpeechAudio = null;



function stopSpeechPlayback() {

  if ("speechSynthesis" in window) {

    window.speechSynthesis.cancel();

  }



  if (activeSpeechAudio) {

    try {

      activeSpeechAudio.pause();

    } catch (_error) {

    }

    activeSpeechAudio = null;

  }

}



function playBackendVoicePreview(voicePreview) {

  const audioBase64 = voicePreview?.audio_base64;

  const mimeType = voicePreview?.mime_type || "audio/wav";

  if (!audioBase64) {

    return false;

  }



  stopSpeechPlayback();

  const audio = new Audio(`data:${mimeType};base64,${audioBase64}`);

  activeSpeechAudio = audio;

  audio.addEventListener(

    "ended",

    () => {

      if (activeSpeechAudio === audio) {

        activeSpeechAudio = null;

      }

      if (state.currentPanel === "study") {

        queueStudyVoiceCapture(900);

      }

    },

    { once: true },

  );

  audio.addEventListener(

    "error",

    () => {

      if (activeSpeechAudio === audio) {

        activeSpeechAudio = null;

      }

    },

    { once: true },

  );



  audio.play().catch(() => {

    if (activeSpeechAudio === audio) {

      activeSpeechAudio = null;

    }

  });

  return true;

}



function speak(text, options = {}) {

  setSpeechBubbleText(text);



  if (playBackendVoicePreview(options.voicePreview)) {

    return;

  }



  if (!("speechSynthesis" in window)) {

    return;

  }



  const chunks = splitSpeechIntoChunks(text);

  if (!chunks.length) {

    return;

  }



  window.speechSynthesis.cancel();

  window.speechSynthesis.resume();

  const voices = window.speechSynthesis.getVoices();

  const preferredVoice = selectPreferredVoice(voices);



  const speakChunk = (index) => {

    if (index >= chunks.length) {

      if (state.currentPanel === "study") {

        queueStudyVoiceCapture(900);

      }

      return;

    }



    const chunk = chunks[index];

    const utterance = new SpeechSynthesisUtterance(chunk);

    utterance.lang = "en-US";

    utterance.rate = 0.96;

    utterance.pitch = 0.7;

    utterance.volume = 1;



    if (preferredVoice) {

      utterance.voice = preferredVoice;

    }



    utterance.onstart = () => {

      if (index === 0) {

        setSpeechBubbleText(text);

      }

    };

    utterance.onend = () => {

      speakChunk(index + 1);

    };



    window.speechSynthesis.speak(utterance);

  };



  speakChunk(0);

}



function setCompanionState({ mood, speech, status, reward, forceSpeak = false, voicePreview = null }) {

  if (speech) {

    if (shouldAutoSpeak(forceSpeak)) {

      speak(speech, { voicePreview });

    } else {

      setSpeechBubbleText(speech);

    }

  }

  if (reward) {

    updateRewards(reward);

    setAvatarExpressionVariant("happy", { duration: 1800, allowWhileLocked: true });

  }

}



function clearStudyVoiceTimer() {

  window.clearTimeout(state.studyVoiceTimer);

  state.studyVoiceTimer = null;

}



function stopListening(options = {}) {

  clearStudyVoiceTimer();

  if (state.studyMediaRecorder) {

    state.lastRecognitionError = "cancelled";

    stopStudyVoiceCapture("cancelled");

  }



  if (options.resetWake !== false) {

    state.voiceWakeActive = false;

  }



  state.voiceInputMode = "";



  if (!state.recognition) {

    return;

  }



  try {

    state.recognition.stop();

  } catch (_error) {

  }

}



function isStudyVoiceCaptureAvailable() {

  return Boolean(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);

}



function pickStudyRecordingMimeType() {

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



function clearStudyRecordingFrame() {

  if (state.studyRecordingFrame) {

    window.cancelAnimationFrame(state.studyRecordingFrame);

    state.studyRecordingFrame = 0;

  }

}



function cleanupStudyVoiceCapture() {

  clearStudyRecordingFrame();



  if (state.studyMediaRecorder) {

    state.studyMediaRecorder.ondataavailable = null;

    state.studyMediaRecorder.onstop = null;

    state.studyMediaRecorder.onerror = null;

    state.studyMediaRecorder = null;

  }



  if (state.studyRecordingStream) {

    state.studyRecordingStream.getTracks().forEach((track) => {

      try {

        track.stop();

      } catch (_error) {

      }

    });

    state.studyRecordingStream = null;

  }



  state.studyRecordingChunks = [];

  state.studyRecordingStartedAt = 0;

  state.studyRecordingLastVoiceAt = 0;

  state.studySpeechDetected = false;

}



async function requestStudyVoiceTranscript(audioBlob) {

  const accessToken = await ensureGuestSession();

  const apiBaseUrl = await resolveApiBaseUrl();

  const formData = new FormData();

  const extension = state.studyRecordingMimeType.includes("ogg") ? "ogg" : "webm";

  formData.append("audio", audioBlob, `aubit-study-${Date.now()}.${extension}`);

  formData.append("language", "en");



  const response = await fetch(`${apiBaseUrl}/ai-response/transcribe`, {

    method: "POST",

    headers: {

      Authorization: `Bearer ${accessToken}`,

    },

    body: formData,

  });



  if (!response.ok) {

    throw new Error(`Study transcription failed with status ${response.status}`);

  }



  const payload = await response.json();

  const transcript = String(payload?.data?.transcript || "").trim();

  if (!transcript) {

    throw new Error("Study transcription came back empty");

  }



  return transcript;

}



function monitorStudyVoiceCapture() {

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass || !state.studyRecordingStream) {

    return;

  }



  const audioContext = new AudioContextClass();

  const analyser = audioContext.createAnalyser();

  analyser.fftSize = 2048;

  const source = audioContext.createMediaStreamSource(state.studyRecordingStream);

  source.connect(analyser);

  const data = new Uint8Array(analyser.fftSize);

  const startedAt = Date.now();

  state.studyRecordingStartedAt = startedAt;

  state.studyRecordingLastVoiceAt = startedAt;

  state.studySpeechDetected = false;



  const sample = () => {

    if (!state.studyMediaRecorder || state.studyMediaRecorder.state === "inactive") {

      try {

        audioContext.close();

      } catch (_error) {

      }

      clearStudyRecordingFrame();

      return;

    }



    analyser.getByteTimeDomainData(data);

    let totalDeviation = 0;

    for (let index = 0; index < data.length; index += 1) {

      totalDeviation += Math.abs(data[index] - 128);

    }

    const level = totalDeviation / data.length / 128;

    const now = Date.now();

    const recordingFor = now - state.studyRecordingStartedAt;

    const calibrationWindow = recordingFor < 650;



    if (!calibrationWindow && level > 0.018) {

      state.studySpeechDetected = true;

      state.studyRecordingLastVoiceAt = now;

    }



    const idleFor = now - state.studyRecordingLastVoiceAt;

    if (state.studySpeechDetected && idleFor > 850) {

      stopStudyVoiceCapture("transcribe");

      return;

    }



    if (!state.studySpeechDetected && recordingFor > 9000) {

      stopStudyVoiceCapture("no-speech");

      return;

    }



    if (recordingFor > 30000) {

      stopStudyVoiceCapture("transcribe");

      return;

    }



    state.studyRecordingFrame = window.requestAnimationFrame(sample);

  };



  state.studyRecordingFrame = window.requestAnimationFrame(sample);

}



function stopStudyVoiceCapture(reason = "transcribe") {

  if (!state.studyMediaRecorder) {

    return;

  }



  state.lastRecognitionError = reason;

  try {

    if (state.studyMediaRecorder.state !== "inactive") {

      state.studyMediaRecorder.stop();

    }

  } catch (_error) {

  }

}



async function finalizeStudyVoiceCapture(reason) {

  const chunks = state.studyRecordingChunks.slice();

  const mimeType = state.studyRecordingMimeType || "audio/webm";

  cleanupStudyVoiceCapture();

  state.voiceInputMode = "";



  if (reason === "cancelled") {

    return;

  }



  const audioBlob = chunks.length ? new Blob(chunks, { type: mimeType }) : null;

  if (reason === "no-speech" || !audioBlob || audioBlob.size < 1024) {

    setSpeechBubbleText("I did not catch that. Tap the mic and ask again.");

    return;

  }



  try {

    setSpeechBubbleText("I heard you. Thinking through it...");

    const transcript = await requestStudyVoiceTranscript(audioBlob);

    await handleStudyVoiceTranscript(transcript);

  } catch (error) {

    state.lastBackendError = error instanceof Error ? error.message : String(error || "Unknown study voice error");

    setCompanionState({

      mood: "Listening Issue",

      speech: "I could not turn that audio into text. Try the mic again.",

      status: state.lastBackendError,

      forceSpeak: true,

    });

  }

}



async function startStudyVoiceCapture(options = {}) {

  clearStudyVoiceTimer();

  stopSpeechPlayback();



  if (!isStudyVoiceCaptureAvailable()) {

    startListening({ target: "study", announce: options.announce !== false });

    return;

  }



  if (state.studyMediaRecorder || state.studyVoiceBusy) {

    return;

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



    state.studyRecordingStream = stream;

    state.studyRecordingChunks = [];

    state.studyRecordingMimeType = pickStudyRecordingMimeType() || "audio/webm";

    const mediaRecorder = state.studyRecordingMimeType

      ? new MediaRecorder(stream, { mimeType: state.studyRecordingMimeType })

      : new MediaRecorder(stream);



    state.studyMediaRecorder = mediaRecorder;

    state.voiceInputMode = "study";

    setAvatarExpressionVariant("curious", { duration: 2000, allowWhileLocked: true });

    setSpeechBubbleText("I'm listening. Ask your study topic or doubt.");



    mediaRecorder.ondataavailable = (event) => {

      if (event.data && event.data.size > 0) {

        state.studyRecordingChunks.push(event.data);

      }

    };

    mediaRecorder.onerror = () => {

      cleanupStudyVoiceCapture();

      state.voiceInputMode = "";

      setSpeechBubbleText("The study microphone glitched. Tap it once more.");

    };

    mediaRecorder.onstop = () => {

      const reason = state.lastRecognitionError || "transcribe";

      state.lastRecognitionError = "";

      finalizeStudyVoiceCapture(reason);

    };



    mediaRecorder.start(60);

    monitorStudyVoiceCapture();

  } catch (error) {

    state.lastBackendError = error instanceof Error ? error.message : String(error || "Microphone error");

    cleanupStudyVoiceCapture();

    state.voiceInputMode = "";

    setCompanionState({

      mood: "Microphone Blocked",

      speech: "I cannot open the study microphone yet. Check microphone access and try again.",

      status: state.lastBackendError,

      forceSpeak: true,

    });

  }

}



function queueStudyVoiceCapture(delay = 1600) {

  clearStudyVoiceTimer();



  if (!state.authUnlocked || state.currentPanel !== "study") {

    return;

  }



  state.studyVoiceTimer = window.setTimeout(() => {

    if (state.currentPanel !== "study") {

      return;

    }



    startStudyVoiceCapture({ announce: false });

  }, delay);

}



function syncVoiceModeForPanel(previousPanel = "") {

  if (state.currentPanel === "study") {

    if (previousPanel !== "study") {

      queueStudyVoiceCapture();

    }

    return;

  }



  clearStudyVoiceTimer();

  if (state.voiceInputMode === "study") {

    stopListening();

  }

}



function renderDefaultBoard() {

  setBoardContentLayout();

  updateBoardChrome("Study Board", false);

  replaceBoardContent(`

    <div class="board-stack">

      <h3>Aubit Features</h3>

      <div class="pipeline-row">

        <span class="pipeline-chip">STT</span>

        <span class="pipeline-chip">AI Brain</span>

        <span class="pipeline-chip">TTS</span>

        <span class="pipeline-chip">Interactive Tutor</span>

      </div>

      <p>

        Open Study to learn a topic in the green board.

        Aubit can explain concepts with visuals and clear step-by-step guidance.

      </p>

    </div>

  `);

}



function renderCreatorInfoBoard() {

  setBoardContentLayout();

  updateBoardChrome("Creator Info", false);

  replaceBoardContent(`

    <div class="board-stack creator-board-stack">

      <div class="creator-board-hero">

        <span class="chat-role">Creator Team</span>

        <h3>Meet the creators behind Aubit</h3>

        <p>

          This board highlights the creators and their roles in the project.

        </p>

      </div>

      <div class="creator-info-grid">

        <article class="creator-info-card">

          <div class="creator-person">

            <img class="creator-person-photo" src="./images/creator-het.jpeg" alt="Het Balchandani" />

            <div class="creator-person-copy">

              <strong>Het Balchandani</strong>

              <p>Backend Developer</p>

            </div>

          </div>

        </article>

        <article class="creator-info-card">

          <div class="creator-person">

            <img class="creator-person-photo" src="./images/creator-jayash.png" alt="Jayash Nishad" />

            <div class="creator-person-copy">

              <strong>Jayash Nishad</strong>

              <p>Frontend Developer</p>

            </div>

          </div>

        </article>

        <article class="creator-info-card">

          <div class="creator-person">

            <img class="creator-person-photo" src="./images/creator-kamaal.jpeg" alt="Kamaal solanki" />

            <div class="creator-person-copy">

              <strong>Kamaal solanki</strong>

              <p>UI/UX Designer</p>

            </div>

          </div>

        </article>

      </div>

      <div class="creator-checklist">

        <div class="creator-checklist-item">1. Het Balchandani - Backend Developer</div>

        <div class="creator-checklist-item">2. Jayash Nishad - Frontend Developer</div>

        <div class="creator-checklist-item">3. Kamaal solanki - UI/UX Designer</div>

      </div>

    </div>

  `);

}



const MODEL3D_LAST_ID_KEY = "aubit.model3d.last-id.v1";

let model3dSessionPromise = null;



function trustedLocalModelUrl(value, extension) {

  try {

    const url = new URL(value);

    const backend = new URL(state.apiBaseUrl || apiBaseCandidates[0]);

    return url.origin === backend.origin

      && /^\/api\/(text-to-3d|image-to-3d)\/[0-9a-f]{32}\/(model|rigged|retopo)\.(glb|stl)$/.test(url.pathname)

      ? url.href

      : "";

  } catch (_error) {

    return "";

  }

}



async function requestTextTo3D(method, path = "", body = null, isRetry = false) {

  const token = await (model3dSessionPromise ||= ensureGuestSession(isRetry).finally(() => {

    model3dSessionPromise = null;

  }));

  const baseUrl = await resolveApiBaseUrl();

  const response = await fetch(`${baseUrl}/text-to-3d${path}`, {

    method,

    headers: {

      Authorization: `Bearer ${token}`,

      ...(body ? { "Content-Type": "application/json" } : {}),

    },

    ...(body ? { body: JSON.stringify(body) } : {}),

  });

  if (response.status === 401 && !isRetry) {
    state.authToken = "";
    state.authReady = null;
    return requestTextTo3D(method, path, body, true);
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {

    throw new Error(typeof payload.detail === "string" ? payload.detail : `3D request failed (${response.status}).`);

  }

  return payload.data || {};

}



async function requestImageTo3D(method, path = "", body = null, isRetry = false) {

  const token = await (model3dSessionPromise ||= ensureGuestSession(isRetry).finally(() => {

    model3dSessionPromise = null;

  }));

  const baseUrl = await resolveApiBaseUrl();

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const headers = {

    Authorization: `Bearer ${token}`,

  };

  if (body && !isFormData) {

    headers["Content-Type"] = "application/json";

  }

  const response = await fetch(`${baseUrl}/image-to-3d${path}`, {

    method,

    headers,

    body: isFormData ? body : (body ? JSON.stringify(body) : undefined),

  });

  if (response.status === 401 && !isRetry) {
    state.authToken = "";
    state.authReady = null;
    return requestImageTo3D(method, path, body, true);
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {

    throw new Error(typeof payload.detail === "string" ? payload.detail : `Image 3D request failed (${response.status}).`);

  }

  return payload.data || {};

}



function renderTextTo3DBoard() {

  window.Aubit3DStudio.open(state, {

    close: () => activatePanel(""),

    prompt: (prompt) => { state.model3dPrompt = prompt; },

    generate: (prompt) => startTextTo3D(prompt),

    generateImage: (formData) => startImageTo3D(formData),
    edit: (id, payload) => startImageTo3D(payload, `/${id}/edit`),
    imageRequest: (method, path, payload) => requestImageTo3D(method, path, payload),

    select: (task) => {

      state.model3dTask = task;

      state.model3dError = "";

      state.model3dNotice = "";

      renderTextTo3DBoard();

    },

    library: () => requestTextTo3D("GET"),

    delete: (id) => requestTextTo3D("DELETE", `/${id}`),

    reconnect: refreshTextTo3DConfig,

    url: trustedLocalModelUrl,

    download: downloadTextTo3D,

  });

}



async function refreshTextTo3DConfig() {

  state.model3dError = "";

  state.model3dConfigured = null;

  if (state.currentPanel === "model3d") renderTextTo3DBoard();

  try {

    const [textData, imgData] = await Promise.allSettled([

      requestTextTo3D("GET", "/config"),

      requestImageTo3D("GET", "/config"),

    ]);

    if (textData.status === "fulfilled") {

      state.model3dConfigured = Boolean(textData.value.available);

      state.model3dSupportedObjects = Array.isArray(textData.value.supported_objects) ? textData.value.supported_objects : [];

    } else {

      state.model3dConfigured = false;

      state.model3dError = textData.reason?.message || "Could not reach the Aubit backend.";

    }

    if (imgData.status === "fulfilled") {

      state.image3dConfigured = Boolean(imgData.value.available);

      state.image3dMessage = imgData.value.message || "";
      state.image3dEngines = imgData.value.engines || [];

    } else {

      state.image3dConfigured = false;

    }

  } catch (error) {

    state.model3dConfigured = false;

    state.model3dError = error.message || "Could not reach the Aubit backend.";

  }

  if (state.currentPanel === "model3d") renderTextTo3DBoard();

}



async function startTextTo3D(promptOverride) {
  if (state.model3dBusy) return;

  const prompt = (typeof promptOverride === "string" ? promptOverride : state.model3dPrompt).trim();

  if (!prompt) {

    state.model3dError = "Describe the model you want to create.";

    renderTextTo3DBoard();

    return;

  }

  state.model3dBusy = true;

  state.model3dError = "";

  state.model3dNotice = "";

  renderTextTo3DBoard();

  try {

    const task = await requestTextTo3D("POST", "", { prompt });

    state.model3dTask = task;

    window.localStorage.setItem(MODEL3D_LAST_ID_KEY, task.id);

    state.model3dNotice = "Model built locally. Rotate it to inspect, then download GLB or STL.";

  } catch (error) {

    state.model3dError = error.message || "Could not build the 3D model.";

  } finally {

    state.model3dBusy = false;

    if (state.currentPanel === "model3d") renderTextTo3DBoard();

  }

}



async function startImageTo3D(formData, path = "") {
  if (state.model3dBusy) return;
  state.model3dBusy = true;
  state.model3dError = "";
  state.model3dNotice = "Uploading image and starting local AI...";
  state.model3dTask = null;
  const render = () => { if (state.currentPanel === "model3d") renderTextTo3DBoard(); };
  render();
  try {
    const task = await requestImageTo3D("POST", path, formData);
    state.model3dTask = task;
    render();
    let failures = 0;
    for (let polls = 0; polls < 3100; polls++) {
      await new Promise(resolve => setTimeout(resolve, 1200));
      let updated;
      try {
        updated = await requestImageTo3D("GET", `/${task.id}`);
        failures = 0;
      } catch (error) {
        if (++failures >= 5) throw error;
        state.model3dNotice = "Reconnecting to local generation...";
        render();
        continue;
      }
      state.model3dTask = updated;
      if (updated.status === "SUCCEEDED") {
        localStorage.setItem(MODEL3D_LAST_ID_KEY, updated.id);
        state.model3dNotice = updated.notice || "Model reconstructed locally. Rotate it to inspect the result.";
        return;
      }
      if (updated.status === "FAILED") throw new Error(updated.error || "Image reconstruction failed.");
      state.model3dNotice = `${updated.stage || "Reconstructing object"} (${updated.progress || 0}%)`;
      render();
    }
    throw new Error("The local AI did not finish in time. Check the backend and try again.");
  } catch (error) {
    state.model3dNotice = "";
    state.model3dError = error.message || "Could not generate a model from this image.";
  } finally {
    state.model3dBusy = false;
    render();
  }
}

async function downloadTextTo3D(format) {

  let url = "";

  let filename = `aubit-model.${format}`;

  if (format === "rigged") {

    url = trustedLocalModelUrl(state.model3dTask?.model_urls?.rigged_glb || `${state.apiBaseUrl}/image-to-3d/${state.model3dTask?.id}/rigged.glb`, "glb");

    filename = `aubit-hunyuan3d-rigged-${state.model3dTask?.id?.slice(0, 8) || "char"}.glb`;

  } else if (format === "retopo") {

    url = trustedLocalModelUrl(state.model3dTask?.model_urls?.retopo_glb || `${state.apiBaseUrl}/image-to-3d/${state.model3dTask?.id}/retopo.glb`, "glb");

    filename = `aubit-hunyuan3d-retopo-${state.model3dTask?.id?.slice(0, 8) || "char"}.glb`;

  } else {

    url = trustedLocalModelUrl(state.model3dTask?.model_urls?.[format], format);

    filename = `aubit-model.${format}`;

  }

  if (!url) return;

  try {

    state.model3dError = "";

    if (desktopShell?.runCommand) {

      const result = await desktopShell.runCommand("download_url", { url });

      state.model3dNotice = result?.ok ? `Saved to ${result.path}` : result?.message || "Download failed.";

    } else {

      const link = document.createElement("a");

      link.href = url;

      link.download = filename;

      link.click();

      state.model3dNotice = `Your ${format.toUpperCase()} download has started.`;

    }

  } catch (error) {

    state.model3dError = error.message || "Could not download this model. Try again.";

  }

  if (state.currentPanel === "model3d") renderTextTo3DBoard();

}



function readStoredStudyLearnerAge() {

  try {

    const storedAge = Number.parseInt(window.localStorage.getItem(STUDY_LEARNER_AGE_STORAGE_KEY) || "", 10);

    return Number.isFinite(storedAge) && storedAge >= 5 && storedAge <= 100 ? String(storedAge) : "";

  } catch (_error) {

    return "";

  }

}



function writeStoredStudyLearnerAge(age) {

  const normalizedAge = Number.parseInt(age, 10);

  if (!Number.isFinite(normalizedAge) || normalizedAge < 5 || normalizedAge > 100) {

    return "";

  }



  try {

    window.localStorage.setItem(STUDY_LEARNER_AGE_STORAGE_KEY, String(normalizedAge));

  } catch (_error) {

  }



  return String(normalizedAge);

}



function getStudyAgeProfile() {

  const age = Number.parseInt(state.studyLearnerAge, 10);

  if (!Number.isFinite(age)) {

    return {

      instruction: "Explain clearly for a general learner. Keep it friendly, practical, and not too long.",

      shortLabel: "Adaptive",

    };

  }



  if (age <= 9) {

    return {

      instruction: "Use very simple words, tiny sentences, and one playful real-life example. Avoid heavy terms unless explained.",

      shortLabel: `Age ${age}`,

    };

  }



  if (age <= 13) {

    return {

      instruction: "Use school-level language, a simple example, and one quick check question.",

      shortLabel: `Age ${age}`,

    };

  }



  if (age <= 17) {

    return {

      instruction: "Use clear student-level explanation with key terms, a practical example, and exam-friendly structure.",

      shortLabel: `Age ${age}`,

    };

  }



  return {

    instruction: "Use mature, concise explanation with practical context, key details, and a useful check question.",

    shortLabel: `Age ${age}`,

  };

}



function renderStudyHub() {

  setBoardContentLayout();

  updateBoardChrome("Study Board", true, "Explain Python");

  replaceBoardContent(`

    <div class="board-stack board-chat-thread">

      ${renderBoardChatLine(

        "assistant",

        `

      <h3>What topic would you like to study?</h3>

      `,

        0,

      )}

      ${renderStudyInputDock(1)}

    </div>

  `);

}



function renderStudyTopicPrompt() {

  renderStudyHub();

}



function renderStudyComposer(value = state.studyDraft) {

  const modeConfig = getStudyModeConfig();

  const safeValue = escapeHtml(value);

  const safePlaceholder = escapeHtml(modeConfig.placeholder);

  return `

    <div class="chat-composer">

      <input class="topic-field chat-topic-field" id="studyTopicInput" type="text" placeholder="${safePlaceholder}" value="${safeValue}" />

      <button class="chat-icon-button mic-button" type="button" data-study-action="voice-topic" aria-label="Use microphone" title="Use microphone">

        <svg class="chat-icon-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">

          <path d="M12 3.5a3.5 3.5 0 0 0-3.5 3.5v5a3.5 3.5 0 0 0 7 0V7A3.5 3.5 0 0 0 12 3.5Z" />

          <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0" />

          <path d="M12 18v3" />

          <path d="M8.5 21h7" />

        </svg>

      </button>

      <button class="chat-icon-button send-button" type="button" data-study-action="start-topic" aria-label="Send topic" title="Send topic">

        <svg class="chat-icon-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">

          <path d="M3 20.5L21 12 3 3.5l2.7 7.5 7.8 1-7.8 1L3 20.5Z" />

        </svg>

      </button>

    </div>

  `;

}



function getStudyModeConfig(mode = state.studyMode) {

  return studyModeConfigs[mode] || studyModeConfigs.study;

}



function renderStudyModeSelector() {

  return `

    <div class="study-mode-selector" role="tablist" aria-label="Study mode selector">

      ${Object.entries(studyModeConfigs)

        .map(([mode, config]) => `

          <button

            class="study-mode-button ${state.studyMode === mode ? "active" : ""}"

            type="button"

            role="tab"

            aria-selected="${state.studyMode === mode ? "true" : "false"}"

            data-study-mode="${mode}"

          >

            ${escapeHtml(config.label)}

          </button>

        `)

        .join("")}

    </div>

  `;

}



function renderStudyInputDock(order = 1) {

  return `

    <div class="chat-composer-dock" style="--chat-order: ${order};">

      ${renderStudyComposer()}

      ${renderStudyModeSelector()}

    </div>

  `;

}



function buildYoutubeArea(topic) {

  const embed = youtubeEmbeds[topicKey(topic)];

  if (embed) {

    return `

      <div class="video-slot">

        <iframe src="${embed}" title="YouTube study support for ${topic}" allowfullscreen loading="lazy"></iframe>

      </div>

    `;

  }



  const query = encodeURIComponent(`${topic} explained for beginners`);

  return `

    <div class="video-slot">

      <div class="video-placeholder">

        <div>

          <strong>YouTube Tutor Support</strong>

          <p>Open a topic-specific video search to make the concept clearer.</p>

          <div class="video-links">

            <a class="video-link" href="https://www.youtube.com/results?search_query=${query}" target="_blank" rel="noopener noreferrer">Open YouTube Search</a>

          </div>

        </div>

      </div>

    </div>

  `;

}



function buildImageSearchLink(topic) {

  const query = encodeURIComponent(`${topic} concept diagram`);

  return `https://www.google.com/search?tbm=isch&q=${query}`;

}



function getCreatorReferenceImage(topic) {

  const normalized = String(topic || "").toLowerCase();

  const directKey = Object.keys(creatorReferenceImages).find((key) => normalized.includes(key));

  const pronounKey = /\b(his|him|their|creator|creators)\b/.test(normalized)

    ? state.lastCreatorImageSubject

    : "";

  const key = directKey || pronounKey;

  const creator = creatorReferenceImages[key];

  if (!creator) {

    return null;

  }



  state.lastCreatorImageSubject = key;

  return {

    src: creator.src,

    title: creator.name,

    local: true,

  };

}



function rememberCreatorSubjectFromText(text) {

  const normalized = String(text || "").toLowerCase();

  const key = Object.keys(creatorReferenceImages).find((creatorKey) => normalized.includes(creatorKey));

  if (key) {

    state.lastCreatorImageSubject = key;

  }

}



function buildVisualCardSvg(topic, label, accent) {

  const safeTopic = topic.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const safeLabel = label.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const svg = `

    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 360">

      <defs>

        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">

          <stop offset="0%" stop-color="#0f2f22"/>

          <stop offset="100%" stop-color="#153f2d"/>

        </linearGradient>

      </defs>

      <rect width="600" height="360" rx="28" fill="url(#bg)"/>

      <circle cx="120" cy="90" r="54" fill="${accent}" opacity="0.18"/>

      <circle cx="470" cy="250" r="76" fill="${accent}" opacity="0.14"/>

      <rect x="54" y="64" width="492" height="232" rx="24" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.18)"/>

      <text x="76" y="118" fill="#ecfff5" font-size="20" font-family="Arial, sans-serif" opacity="0.72">${safeLabel}</text>

      <text x="76" y="176" fill="#ecfff5" font-size="38" font-family="Arial, sans-serif" font-weight="700">${safeTopic}</text>

      <line x1="78" y1="208" x2="522" y2="208" stroke="${accent}" stroke-width="10" stroke-linecap="round" opacity="0.75"/>

      <circle cx="156" cy="208" r="18" fill="${accent}"/>

      <circle cx="300" cy="208" r="18" fill="${accent}"/>

      <circle cx="444" cy="208" r="18" fill="${accent}"/>

      <text x="116" y="258" fill="#ecfff5" font-size="16" font-family="Arial, sans-serif">Concept</text>

      <text x="268" y="258" fill="#ecfff5" font-size="16" font-family="Arial, sans-serif">Example</text>

      <text x="417" y="258" fill="#ecfff5" font-size="16" font-family="Arial, sans-serif">Review</text>

    </svg>

  `;



  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

}



function buildStudyExplanation(topic) {

  return [

    `${topic} is introduced in simple language first so the learner gets the main idea before details.`,

    `Aubit then adds one worked example, one visual explanation, and one quick check question.`,

    `At the end, Aubit reinforces the concept with a short recap and guided follow-up.`,

  ];

}



function trySolveArithmeticStudyTopic(topic) {

  const expression = String(topic || "")

    .replace(/[^0-9+\-*/%.() ]/g, "")

    .trim();

  if (!expression || !/[0-9]/.test(expression) || !/[+\-*/%]/.test(expression)) {

    return "";

  }



  try {

    const result = Function(`"use strict"; return (${expression});`)();

    if (Number.isFinite(result)) {

      return `${expression} = ${Number.isInteger(result) ? result : Number(result.toFixed(6))}`;

    }

  } catch (_error) {

  }



  return "";

}



function buildInstantStudyAnswer(topic) {

  const normalizedTopic = String(topic || "this topic").trim() || "this topic";

  const profile = getStudyAgeProfile();

  const activeMode = state.studyMode;

  const isYoungLearner = Number.parseInt(state.studyLearnerAge, 10) <= 9;

  const arithmeticAnswer = trySolveArithmeticStudyTopic(normalizedTopic);



  if (activeMode === "image") {

    return [

      `Visual request: ${normalizedTopic}.`,

      "I will turn this into a clean board visual with a main subject, labels, and a simple layout.",

      "Use Draw Visual if you want Aubit to open the animated diagram view."

    ].join("\n\n");

  }



  if (activeMode === "summarize") {

    return [

      "Quick summary draft:",

      `${normalizedTopic}`,

      "I will compress this into the main idea, key points, and a short recap."

    ].join("\n\n");

  }



  if (activeMode === "practice") {

    return [

      `Practice plan for ${normalizedTopic}:`,

      "First review the idea, then try one easy question, then one stronger challenge.",

      "The full Practice mode is ready for us to rebuild next."

    ].join("\n\n");

  }



  if (arithmeticAnswer) {

    return isYoungLearner

      ? [

          `${arithmeticAnswer}.`,

          "Tiny trick: do the bracket part first, then the big operations, then the small adding or taking away.",

          "Quick check: does the answer feel close if you estimate it?"

        ].join("\n\n")

      : [

          `${arithmeticAnswer}.`,

          "Quick method: follow normal order of operations: brackets, multiplication or division, then addition or subtraction.",

          "Check it once by reversing the operation or estimating the answer."

        ].join("\n\n");

  }



  const lowerTopic = normalizedTopic.toLowerCase();

  const opening = isYoungLearner

    ? `${normalizedTopic} is something we can understand with a simple example.`

    : `${normalizedTopic} is easiest when we start with the core idea and then connect it to an example.`;



  if (activeMode === "simple") {

    return [

      `${normalizedTopic} means one main thing: understand the basic idea first.`,

      "Imagine it with a simple everyday example instead of hard words.",

      "Then say it back in your own words to check if it is clear."

    ].join("\n\n");

  }



  if (/\bpython|javascript|html|css|programming|coding|code\b/.test(lowerTopic)) {

    return [

      opening,

      isYoungLearner

        ? "Think of code like giving careful instructions to a robot: one small step at a time."

        : "Core idea: learn the building blocks, see how they connect, and practice with small tasks instead of memorizing everything at once.",

      "Example: write the smallest working version, run it, change one thing, and notice what changes.",

      `Quick check (${profile.shortLabel}): what problem does ${normalizedTopic} help solve?`

    ].join("\n\n");

  }



  if (/\bgravity|physics|force|energy|motion|light|electricity|science\b/.test(lowerTopic)) {

    return [

      opening,

      isYoungLearner

        ? "Look for what you can see happening first. Then we name the science idea behind it."

        : "Core idea: identify what changes, what causes the change, and what rule explains it.",

      `Example: find one daily-life place where ${normalizedTopic} appears.`,

      `Quick check (${profile.shortLabel}): what changes because of ${normalizedTopic}?`

    ].join("\n\n");

  }



  if (/\bhistory|civics|geography|economics|politics|society\b/.test(lowerTopic)) {

    return [

      opening,

      isYoungLearner

        ? "Ask three questions: what happened, who was there, and what changed after it?"

        : "Core idea: understand the cause, the main event or concept, and the effect that followed.",

      "Example: connect one key person, place, or decision to the bigger result.",

      `Quick check (${profile.shortLabel}): what changed because of ${normalizedTopic}?`

    ].join("\n\n");

  }



  return [

    opening,

    isYoungLearner

      ? "We will learn it in small pieces: what it is, one example, and one question."

      : "Core idea: break the topic into three parts: what it is, why it matters, and how it is used.",

    `Example: take one simple real-life situation and point out where ${normalizedTopic} appears inside it.`,

    `Quick check (${profile.shortLabel}): explain ${normalizedTopic} in one sentence, then give one example.`

  ].join("\n\n");

}



function buildInstantStudyData(topic) {

  const response = buildInstantStudyAnswer(topic);

  return {

    response,

    voicePreview: null,

    steps: splitResponseIntoSteps(response, topic),

    source: "instant",

  };

}



function clampValue(value, min, max) {

  return Math.min(max, Math.max(min, value));

}



function hashString(value) {

  let hash = 0;

  const source = String(value || "");

  for (let index = 0; index < source.length; index += 1) {

    hash = (hash * 31 + source.charCodeAt(index)) >>> 0;

  }

  return hash;

}



function shortenDiagramLabel(text, maxLength = 30) {

  const source = String(text || "").replace(/\s+/g, " ").trim();

  if (!source) {

    return "";

  }



  if (source.length <= maxLength) {

    return source;

  }



  return `${source.slice(0, Math.max(0, maxLength - 3)).trim()}...`;

}



function extractStudyKeywords(topic, aiData = null) {

  const stopWords = new Set([

    "about",

    "after",

    "again",

    "also",

    "between",

    "build",

    "being",

    "cause",

    "does",

    "each",

    "from",

    "have",

    "into",

    "just",

    "like",

    "main",

    "make",

    "more",

    "most",

    "need",

    "only",

    "show",

    "step",

    "steps",

    "that",

    "their",

    "then",

    "they",

    "this",

    "topic",

    "using",

    "with",

    "your",

  ]);

  const pool = [topic, ...(aiData?.steps || []), aiData?.response || ""].join(" ");

  const matches = pool.toLowerCase().match(/[a-z][a-z0-9-]{2,}/g) || [];

  const unique = [];



  matches.forEach((token) => {

    if (stopWords.has(token) || unique.includes(token)) {

      return;

    }

    unique.push(token);

  });



  return unique.slice(0, 6);

}



function inferStudyDiagramType(topic) {

  const normalized = topic.trim().toLowerCase();



  if (/\b(os|operating system|cpu|scheduler|scheduling|round robin|fcfs|sjf|priority scheduling|time slice)\b/.test(normalized)) {

    return "timeline";

  }



  if (/\b(network|topology|router|switch|packet|tcp|udp|http|client server|server|database|api|latency|dns)\b/.test(normalized)) {

    return "network";

  }



  if (/\b(graph|chart|plot|statistics|trend|probability|distribution|data|growth|decline|histogram|bar chart|line chart)\b/.test(normalized)) {

    return "graph";

  }



  if (/\b(flowchart|algorithm|process|workflow|lifecycle|pipeline|decision|steps|procedure|recursion)\b/.test(normalized)) {

    return "flowchart";

  }



  if (/\b(math|mathematics|equation|algebra|calculus|geometry|derivative|integral|function|matrix|quadratic|solve|formula)\b/.test(normalized) || isDirectAnswerStudyTopic(topic)) {

    return "equation";

  }



  return "concept";

}



function buildEquationSet(topic) {

  const normalized = topic.trim().toLowerCase();



  if (normalized.includes("quadratic")) {

    return {

      headline: "Quadratic Explorer",

      primary: "ax^2 + bx + c = 0",

      secondary: "x = (-b +/- sqrt(b^2 - 4ac)) / 2a",

      tertiary: "Vertex shows where the curve turns.",

      curve: "quadratic",

    };

  }



  if (normalized.includes("derivative") || normalized.includes("differentiation")) {

    return {

      headline: "Derivative Explorer",

      primary: "f(x) = x^3 - 3x",

      secondary: "f'(x) = 3x^2 - 3",

      tertiary: "Slope changes as x moves along the curve.",

      curve: "cubic",

    };

  }



  if (normalized.includes("integral")) {

    return {

      headline: "Integral Explorer",

      primary: "Integral x^2 dx",

      secondary: "= x^3 / 3 + C",

      tertiary: "Area under the curve accumulates over x.",

      curve: "integral",

    };

  }



  if (normalized.includes("matrix")) {

    return {

      headline: "Matrix Explorer",

      primary: "[ a  b ]  [ x ]",

      secondary: "[ c  d ]  [ y ]",

      tertiary: "Rows and columns transform vectors together.",

      curve: "matrix",

    };

  }



  if (normalized.includes("algebra") || normalized.includes("equation") || normalized.includes("solve")) {

    return {

      headline: "Equation Explorer",

      primary: "2x + 5 = 17",

      secondary: "2x = 12  ->  x = 6",

      tertiary: "Keep both sides balanced while isolating x.",

      curve: "linear",

    };

  }



  return {

    headline: "Math Explorer",

    primary: "Input  ->  Rule  ->  Output",

    secondary: "f(x) maps values through a relationship.",

    tertiary: "The graph shows how the rule behaves over time.",

    curve: "wave",

  };

}



function buildGraphSeries(topic) {

  const seed = hashString(topic);

  const values = [];



  for (let index = 0; index < 6; index += 1) {

    const wobble = ((seed >> (index * 3)) & 7) - 3;

    values.push(clampValue(32 + index * 10 + wobble * 4, 18, 92));

  }



  return values;

}



function buildStudyDiagramSpec(topic, aiData = null) {

  const steps = (aiData?.steps?.length ? aiData.steps : buildStudyExplanation(topic)).slice(0, 3);

  const labels = steps.map((step) => shortenDiagramLabel(step, 34));

  const keywords = extractStudyKeywords(topic, aiData);

  const type = inferStudyDiagramType(topic);

  const normalized = topic.trim().toLowerCase();



  if (type === "timeline") {

    const segments = normalized.includes("round robin")

      ? [

          { label: "P1", start: 0, duration: 2, color: "#6cecff" },

          { label: "P2", start: 2, duration: 2, color: "#ffd66e" },

          { label: "P3", start: 4, duration: 2, color: "#8df0a9" },

          { label: "P1", start: 6, duration: 2, color: "#6cecff" },

          { label: "P4", start: 8, duration: 2, color: "#ff8db5" },

          { label: "P2", start: 10, duration: 1, color: "#ffd66e" },

          { label: "P3", start: 11, duration: 2, color: "#8df0a9" },

        ]

      : normalized.includes("priority")

        ? [

            { label: "P2", start: 0, duration: 3, color: "#ffd66e" },

            { label: "P1", start: 3, duration: 2, color: "#6cecff" },

            { label: "P4", start: 5, duration: 4, color: "#ff8db5" },

            { label: "P3", start: 9, duration: 3, color: "#8df0a9" },

          ]

        : [

            { label: "P1", start: 0, duration: 3, color: "#6cecff" },

            { label: "P2", start: 3, duration: 2, color: "#ffd66e" },

            { label: "P3", start: 5, duration: 4, color: "#8df0a9" },

            { label: "P4", start: 9, duration: 2, color: "#ff8db5" },

          ];



    return {

      type,

      title: "Animated timeline",

      headline: normalized.includes("round robin") ? "Round Robin Scheduler" : "CPU Scheduling Timeline",

      chips: ["Animation", "Timeline", "Processes"],

      notes: labels,

      steps,

      keywords,

      segments,

      totalUnits: segments[segments.length - 1].start + segments[segments.length - 1].duration,

    };

  }



  if (type === "network") {

    return {

      type,

      title: "Network diagram",

      headline: "Packet Flow Map",

      chips: ["Network", "Nodes", "Packets"],

      notes: labels,

      steps,

      keywords,

      nodes: [

        { id: "client", label: "Client", x: 0.12, y: 0.58 },

        { id: "edge", label: keywords[0] ? shortenDiagramLabel(keywords[0], 14) : "Edge", x: 0.34, y: 0.28 },

        { id: "api", label: "API", x: 0.53, y: 0.58 },

        { id: "cache", label: "Cache", x: 0.72, y: 0.28 },

        { id: "db", label: "DB", x: 0.86, y: 0.58 },

      ],

      edges: [

        ["client", "edge"],

        ["edge", "api"],

        ["api", "cache"],

        ["api", "db"],

      ],

    };

  }



  if (type === "graph") {

    return {

      type,

      title: "Live graph",

      headline: "Trend and Comparison Plot",

      chips: ["Graph", "Chart", "Trend"],

      notes: labels,

      steps,

      keywords,

      series: buildGraphSeries(topic),

    };

  }



  if (type === "flowchart") {

    return {

      type,

      title: "Flowchart",

      headline: "Process Flow View",

      chips: ["Flowchart", "Decisions", "Steps"],

      notes: labels,

      steps,

      keywords,

    };

  }



  if (type === "equation") {

    return {

      type,

      title: "Math equation",

      chips: ["Math", "Equation", "Plot"],

      notes: labels,

      steps,

      keywords,

      ...buildEquationSet(topic),

    };

  }



  return {

    type: "concept",

    title: "Visual board",

    headline: "Visual Board",

    chips: ["Concepts", "Links", "Animation"],

    notes: labels,

    steps,

    keywords,

  };

}



function renderStudyDiagramCard(spec, topic, options = {}) {

  const safeTopic = escapeHtml(topic);

  const safeTitle = escapeHtml(spec.title);

  const safeImageSearchLink = escapeHtml(buildImageSearchLink(topic));

  const imageOnly = Boolean(options.imageOnly);



  if (imageOnly) {

    return `

      <div class="study-form study-diagram-card image-only">

        <div class="study-diagram-visuals">

          <div class="study-diagram-stage">

            <canvas

              class="study-diagram-canvas"

              id="studyDiagramCanvas"

              aria-label="${safeTitle} for ${safeTopic}"

            ></canvas>

          </div>

        </div>

      </div>

    `;

  }



  return `

    <div class="study-form study-diagram-card">

      <div class="study-diagram-visuals">

        <div class="study-diagram-stage">

          <canvas

            class="study-diagram-canvas"

            id="studyDiagramCanvas"

            aria-label="${safeTitle} for ${safeTopic}"

          ></canvas>

        </div>

        <figure class="study-topic-photo-card" id="studyTopicPhotoCard" data-status="loading">

          <div class="study-topic-photo-frame">

            <img

              class="study-topic-photo-image"

              id="studyTopicPhotoImage"

              alt=""

              loading="lazy"

              referrerpolicy="no-referrer"

              hidden

            />

            <div class="study-topic-photo-placeholder" id="studyTopicPhotoPlaceholder">

              Finding a related web photo for ${safeTopic}...

            </div>

          </div>

          <figcaption class="study-topic-photo-meta">

            <strong>Related Photo</strong>

            <p id="studyTopicPhotoCaption">Looking up a topic image from the web.</p>

            <a

              class="study-topic-photo-link"

              id="studyTopicPhotoLink"

              href="${safeImageSearchLink}"

              target="_blank"

              rel="noopener noreferrer"

            >

              Open image search

            </a>

          </figcaption>

        </figure>

      </div>

    </div>

  `;

}



function stopStudyDiagramRenderer() {

  if (studyDiagramRuntime.rafId) {

    window.cancelAnimationFrame(studyDiagramRuntime.rafId);

  }



  studyTopicPhotoRequestId += 1;

  studyDiagramRuntime.rafId = 0;

  studyDiagramRuntime.canvas = null;

  studyDiagramRuntime.spec = null;

  studyDiagramRuntime.startTime = 0;

  studyDiagramRuntime.lastFrameTime = 0;

}



function pauseStudyDiagramRenderer() {

  if (studyDiagramRuntime.rafId) {

    window.cancelAnimationFrame(studyDiagramRuntime.rafId);

  }



  studyDiagramRuntime.rafId = 0;

  studyDiagramRuntime.lastFrameTime = 0;

}



function replayStudyDiagram() {

  if (!studyDiagramRuntime.spec || !studyDiagramRuntime.canvas) {

    return;

  }



  studyDiagramRuntime.startTime = performance.now();

}



function getStudyDiagramCanvasContext(canvas) {

  if (!canvas) {

    return null;

  }



  const rect = canvas.getBoundingClientRect();

  if (!rect.width || !rect.height) {

    return null;

  }



  const ratio = Math.min(window.devicePixelRatio || 1, 2);

  const width = Math.round(rect.width * ratio);

  const height = Math.round(rect.height * ratio);



  if (canvas.width !== width || canvas.height !== height) {

    canvas.width = width;

    canvas.height = height;

  }



  const context = canvas.getContext("2d");

  context.setTransform(ratio, 0, 0, ratio, 0, 0);

  return {

    ctx: context,

    width: rect.width,

    height: rect.height,

  };

}



function roundedRectPath(ctx, x, y, width, height, radius) {

  const r = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();

  ctx.moveTo(x + r, y);

  ctx.arcTo(x + width, y, x + width, y + height, r);

  ctx.arcTo(x + width, y + height, x, y + height, r);

  ctx.arcTo(x, y + height, x, y, r);

  ctx.arcTo(x, y, x + width, y, r);

  ctx.closePath();

}



function drawRoundedPanel(ctx, x, y, width, height, radius, fillStyle, strokeStyle = "") {

  roundedRectPath(ctx, x, y, width, height, radius);

  ctx.fillStyle = fillStyle;

  ctx.fill();

  if (strokeStyle) {

    ctx.strokeStyle = strokeStyle;

    ctx.lineWidth = 1;

    ctx.stroke();

  }

}



function drawStudyDiagramBackground(ctx, width, height, elapsed, spec) {

  const background = ctx.createLinearGradient(0, 0, width, height);

  background.addColorStop(0, "#071f18");

  background.addColorStop(1, "#0c3425");

  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = background;

  ctx.fillRect(0, 0, width, height);



  const glow = ctx.createRadialGradient(width * 0.78, height * 0.18, 12, width * 0.78, height * 0.18, width * 0.38);

  glow.addColorStop(0, "rgba(108,236,255,0.22)");

  glow.addColorStop(1, "rgba(108,236,255,0)");

  ctx.fillStyle = glow;

  ctx.fillRect(0, 0, width, height);



  ctx.strokeStyle = "rgba(190,255,225,0.08)";

  ctx.lineWidth = 1;

  for (let x = 24; x < width; x += 30) {

    ctx.beginPath();

    ctx.moveTo(x, 0);

    ctx.lineTo(x, height);

    ctx.stroke();

  }

  for (let y = 24; y < height; y += 30) {

    ctx.beginPath();

    ctx.moveTo(0, y);

    ctx.lineTo(width, y);

    ctx.stroke();

  }



  const scanY = (elapsed * 0.08) % (height + 50) - 25;

  const scan = ctx.createLinearGradient(0, scanY - 18, 0, scanY + 18);

  scan.addColorStop(0, "rgba(255,255,255,0)");

  scan.addColorStop(0.5, "rgba(185,255,228,0.12)");

  scan.addColorStop(1, "rgba(255,255,255,0)");

  ctx.fillStyle = scan;

  ctx.fillRect(0, scanY - 18, width, 36);



  ctx.fillStyle = "rgba(233,255,244,0.92)";

  ctx.font = "700 18px Manrope, sans-serif";

  ctx.fillText(spec.headline, 22, 30);

  ctx.font = "600 12px Manrope, sans-serif";

  ctx.fillStyle = "rgba(212,255,233,0.76)";

  ctx.fillText(spec.title.toUpperCase(), 22, 48);

}



function drawDiagramLabel(ctx, text, x, y, width = 96) {

  drawRoundedPanel(ctx, x, y - 18, width, 24, 12, "rgba(4,18,12,0.78)", "rgba(152,255,210,0.18)");

  ctx.fillStyle = "#ecfff5";

  ctx.font = "600 11px Manrope, sans-serif";

  ctx.fillText(shortenDiagramLabel(text, 16), x + 10, y - 2);

}



function drawTimelineDiagram(ctx, width, height, elapsed, spec) {

  const chartX = 36;

  const chartY = 90;

  const chartWidth = width - 72;

  const barHeight = 40;

  const timelineY = chartY + 34;



  ctx.strokeStyle = "rgba(214,255,234,0.55)";

  ctx.lineWidth = 2;

  ctx.beginPath();

  ctx.moveTo(chartX, timelineY + barHeight + 18);

  ctx.lineTo(chartX + chartWidth, timelineY + barHeight + 18);

  ctx.stroke();



  spec.segments.forEach((segment) => {

    const unitWidth = chartWidth / spec.totalUnits;

    const x = chartX + segment.start * unitWidth;

    const widthValue = segment.duration * unitWidth - 6;

    drawRoundedPanel(ctx, x, timelineY, widthValue, barHeight, 14, segment.color, "rgba(255,255,255,0.14)");

    ctx.fillStyle = "#072118";

    ctx.font = "700 14px Manrope, sans-serif";

    ctx.fillText(segment.label, x + 12, timelineY + 24);

  });



  ctx.fillStyle = "rgba(226,255,241,0.72)";

  ctx.font = "600 11px Manrope, sans-serif";

  for (let tick = 0; tick <= spec.totalUnits; tick += 1) {

    const x = chartX + (chartWidth * tick) / spec.totalUnits;

    ctx.beginPath();

    ctx.moveTo(x, timelineY + barHeight + 14);

    ctx.lineTo(x, timelineY + barHeight + 22);

    ctx.strokeStyle = "rgba(214,255,234,0.35)";

    ctx.stroke();

    ctx.fillText(String(tick), x - 3, timelineY + barHeight + 38);

  }



  const progress = ((elapsed / 4200) % 1) * spec.totalUnits;

  const playheadX = chartX + (chartWidth * progress) / spec.totalUnits;

  ctx.strokeStyle = "rgba(255,255,255,0.86)";

  ctx.lineWidth = 2;

  ctx.beginPath();

  ctx.moveTo(playheadX, timelineY - 12);

  ctx.lineTo(playheadX, timelineY + barHeight + 42);

  ctx.stroke();



  const queueY = height - 54;

  spec.segments.slice(0, 4).forEach((segment, index) => {

    const active = Math.floor(progress) % 4 === index;

    const x = chartX + index * 76;

    ctx.beginPath();

    ctx.fillStyle = active ? segment.color : "rgba(255,255,255,0.1)";

    ctx.arc(x, queueY, 20, 0, Math.PI * 2);

    ctx.fill();

    ctx.fillStyle = active ? "#072118" : "#ecfff5";

    ctx.font = "700 12px Manrope, sans-serif";

    ctx.fillText(segment.label, x - 10, queueY + 4);

  });



  ctx.fillStyle = "rgba(215,255,233,0.75)";

  ctx.font = "600 12px Manrope, sans-serif";

  ctx.fillText("Ready queue", chartX, queueY - 30);

}



function drawFlowchartDiagram(ctx, width, height, elapsed, spec) {

  const nodes = [

    { x: width * 0.16, y: height * 0.54, w: 118, h: 54, label: spec.notes[0] || "Start" },

    { x: width * 0.44, y: height * 0.3, w: 126, h: 54, label: spec.notes[1] || "Process" },

    { x: width * 0.44, y: height * 0.76, w: 126, h: 54, label: "Decision" },

    { x: width * 0.74, y: height * 0.54, w: 126, h: 54, label: spec.notes[2] || "Outcome" },

  ];



  ctx.strokeStyle = "rgba(180,255,221,0.4)";

  ctx.lineWidth = 3;

  ctx.beginPath();

  ctx.moveTo(nodes[0].x + 58, nodes[0].y);

  ctx.lineTo(nodes[1].x - 74, nodes[1].y);

  ctx.moveTo(nodes[0].x + 58, nodes[0].y);

  ctx.lineTo(nodes[2].x - 74, nodes[2].y);

  ctx.moveTo(nodes[1].x + 74, nodes[1].y + 2);

  ctx.lineTo(nodes[3].x - 72, nodes[3].y + 2);

  ctx.moveTo(nodes[2].x + 74, nodes[2].y - 2);

  ctx.lineTo(nodes[3].x - 72, nodes[3].y - 2);

  ctx.stroke();



  nodes.forEach((node, index) => {

    if (index === 2) {

      ctx.save();

      ctx.translate(node.x, node.y);

      ctx.rotate(Math.PI / 4);

      drawRoundedPanel(ctx, -42, -42, 84, 84, 18, "rgba(255,210,110,0.18)", "rgba(255,225,160,0.55)");

      ctx.restore();

      ctx.fillStyle = "#fff5d4";

      ctx.font = "700 12px Manrope, sans-serif";

      ctx.fillText(node.label, node.x - 26, node.y + 4);

      return;

    }



    drawRoundedPanel(

      ctx,

      node.x - node.w / 2,

      node.y - node.h / 2,

      node.w,

      node.h,

      18,

      index === 0 ? "rgba(108,236,255,0.18)" : "rgba(255,255,255,0.08)",

      "rgba(180,255,221,0.3)",

    );

    ctx.fillStyle = "#ecfff5";

    ctx.font = "700 12px Manrope, sans-serif";

    ctx.fillText(shortenDiagramLabel(node.label, 18), node.x - node.w / 2 + 14, node.y + 5);

  });



  const trace = (elapsed / 2200) % 1;

  const points = [

    { x: nodes[0].x + 58, y: nodes[0].y },

    trace < 0.5

      ? { x: nodes[1].x - 74 + 148 * (trace / 0.5), y: nodes[1].y }

      : { x: nodes[3].x - 72 + 144 * ((trace - 0.5) / 0.5), y: nodes[3].y },

  ];

  ctx.strokeStyle = "#8df0a9";

  ctx.lineWidth = 4;

  ctx.beginPath();

  ctx.moveTo(points[0].x, points[0].y);

  ctx.lineTo(points[1].x, points[1].y);

  ctx.stroke();

  ctx.beginPath();

  ctx.fillStyle = "#8df0a9";

  ctx.arc(points[1].x, points[1].y, 7, 0, Math.PI * 2);

  ctx.fill();

}



function drawNetworkDiagram(ctx, width, height, elapsed, spec) {

  const nodeMap = new Map();

  spec.nodes.forEach((node) => {

    nodeMap.set(node.id, {

      ...node,

      px: node.x * width,

      py: node.y * height,

    });

  });



  ctx.strokeStyle = "rgba(180,255,221,0.24)";

  ctx.lineWidth = 3;

  spec.edges.forEach(([fromId, toId]) => {

    const fromNode = nodeMap.get(fromId);

    const toNode = nodeMap.get(toId);

    ctx.beginPath();

    ctx.moveTo(fromNode.px, fromNode.py);

    ctx.lineTo(toNode.px, toNode.py);

    ctx.stroke();

  });



  spec.nodes.forEach((node, index) => {

    const current = nodeMap.get(node.id);

    const color = ["#6cecff", "#ffd66e", "#8df0a9", "#ff8db5", "#c7f0ff"][index % 5];

    ctx.beginPath();

    ctx.fillStyle = color;

    ctx.arc(current.px, current.py, 22, 0, Math.PI * 2);

    ctx.fill();

    ctx.beginPath();

    ctx.fillStyle = "rgba(4,18,12,0.85)";

    ctx.arc(current.px, current.py, 12, 0, Math.PI * 2);

    ctx.fill();

    drawDiagramLabel(ctx, node.label, current.px - 38, current.py - 34, 86);

  });



  const route = [

    nodeMap.get("client"),

    nodeMap.get("edge"),

    nodeMap.get("api"),

    nodeMap.get("db"),

  ];

  const progress = (elapsed / 2800) % 1;

  const segment = Math.min(route.length - 2, Math.floor(progress * (route.length - 1)));

  const localProgress = (progress * (route.length - 1)) % 1;

  const fromNode = route[segment];

  const toNode = route[segment + 1];

  const packetX = fromNode.px + (toNode.px - fromNode.px) * localProgress;

  const packetY = fromNode.py + (toNode.py - fromNode.py) * localProgress;

  ctx.beginPath();

  ctx.fillStyle = "#ffffff";

  ctx.arc(packetX, packetY, 7, 0, Math.PI * 2);

  ctx.fill();

}



function drawGraphDiagram(ctx, width, height, elapsed, spec) {

  const chartX = 46;

  const chartY = 78;

  const chartWidth = width - 80;

  const chartHeight = height - 132;

  const reveal = clampValue(elapsed / 1800, 0, 1);



  ctx.strokeStyle = "rgba(220,255,241,0.36)";

  ctx.lineWidth = 2;

  ctx.beginPath();

  ctx.moveTo(chartX, chartY);

  ctx.lineTo(chartX, chartY + chartHeight);

  ctx.lineTo(chartX + chartWidth, chartY + chartHeight);

  ctx.stroke();



  const points = spec.series.map((value, index) => ({

    x: chartX + (chartWidth / (spec.series.length - 1)) * index,

    y: chartY + chartHeight - (chartHeight * value) / 100,

  }));



  ctx.beginPath();

  points.forEach((point, index) => {

    const targetX = chartX + (chartWidth * reveal);

    if (point.x > targetX) {

      return;

    }

    if (index === 0) {

      ctx.moveTo(point.x, point.y);

    } else {

      ctx.lineTo(point.x, point.y);

    }

  });

  ctx.strokeStyle = "#6cecff";

  ctx.lineWidth = 4;

  ctx.stroke();



  points.forEach((point, index) => {

    if (index / (points.length - 1) > reveal) {

      return;

    }

    ctx.beginPath();

    ctx.fillStyle = index % 2 === 0 ? "#8df0a9" : "#ffd66e";

    ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);

    ctx.fill();

  });



  spec.series.forEach((value, index) => {

    const barWidth = 24;

    const x = chartX + 12 + index * ((chartWidth - 24) / spec.series.length);

    const barHeight = (chartHeight * value) / 100;

    drawRoundedPanel(ctx, x, chartY + chartHeight - barHeight, barWidth, barHeight, 8, "rgba(255,255,255,0.08)");

  });

}



function drawEquationDiagram(ctx, width, height, elapsed, spec) {

  drawRoundedPanel(ctx, 24, 72, width * 0.44, height - 104, 20, "rgba(5,22,15,0.42)", "rgba(180,255,221,0.18)");

  ctx.fillStyle = "#ecfff5";

  ctx.font = "700 24px Space Grotesk, Manrope, sans-serif";

  ctx.fillText(spec.primary, 42, 122);

  ctx.font = "600 17px Manrope, sans-serif";

  ctx.fillStyle = "rgba(220,255,239,0.82)";

  ctx.fillText(spec.secondary, 42, 160);

  ctx.font = "500 13px Manrope, sans-serif";

  ctx.fillText(spec.tertiary, 42, 196);



  const plotX = width * 0.54;

  const plotY = 88;

  const plotWidth = width * 0.36;

  const plotHeight = height - 132;

  drawRoundedPanel(ctx, plotX, plotY, plotWidth, plotHeight, 20, "rgba(5,22,15,0.3)", "rgba(180,255,221,0.18)");



  const centerX = plotX + plotWidth / 2;

  const centerY = plotY + plotHeight / 2;

  ctx.strokeStyle = "rgba(220,255,239,0.28)";

  ctx.lineWidth = 2;

  ctx.beginPath();

  ctx.moveTo(plotX + 20, centerY);

  ctx.lineTo(plotX + plotWidth - 20, centerY);

  ctx.moveTo(centerX, plotY + 20);

  ctx.lineTo(centerX, plotY + plotHeight - 20);

  ctx.stroke();



  ctx.strokeStyle = "#6cecff";

  ctx.lineWidth = 3;

  ctx.beginPath();

  for (let step = 0; step <= 120; step += 1) {

    const t = -2.4 + (step / 120) * 4.8;

    let yValue = Math.sin(t);

    if (spec.curve === "quadratic") {

      yValue = (t * t) / 3 - 1.2;

    } else if (spec.curve === "linear") {

      yValue = t * 0.8;

    } else if (spec.curve === "cubic") {

      yValue = (t * t * t) / 6 - t;

    } else if (spec.curve === "integral") {

      yValue = (t * t) / 4 - 1.2;

    }

    const x = plotX + 20 + ((plotWidth - 40) * step) / 120;

    const y = centerY - yValue * ((plotHeight - 60) / 4.8);

    if (step === 0) {

      ctx.moveTo(x, y);

    } else {

      ctx.lineTo(x, y);

    }

  }

  ctx.stroke();



  const moving = (elapsed / 2600) % 1;

  const dotX = plotX + 20 + (plotWidth - 40) * moving;

  const translated = -2.4 + moving * 4.8;

  let dotYValue = Math.sin(translated);

  if (spec.curve === "quadratic") {

    dotYValue = (translated * translated) / 3 - 1.2;

  } else if (spec.curve === "linear") {

    dotYValue = translated * 0.8;

  } else if (spec.curve === "cubic") {

    dotYValue = (translated * translated * translated) / 6 - translated;

  } else if (spec.curve === "integral") {

    dotYValue = (translated * translated) / 4 - 1.2;

  }

  const dotY = centerY - dotYValue * ((plotHeight - 60) / 4.8);

  ctx.beginPath();

  ctx.fillStyle = "#ffd66e";

  ctx.arc(dotX, dotY, 7, 0, Math.PI * 2);

  ctx.fill();

}



function drawConceptDiagram(ctx, width, height, elapsed, spec) {

  const centerX = width * 0.5;

  const centerY = height * 0.54;

  const radius = Math.min(width, height) * 0.18;

  const orbit = radius + 48;



  ctx.beginPath();

  ctx.fillStyle = "rgba(108,236,255,0.22)";

  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);

  ctx.fill();

  ctx.beginPath();

  ctx.fillStyle = "rgba(4,18,12,0.7)";

  ctx.arc(centerX, centerY, radius - 16, 0, Math.PI * 2);

  ctx.fill();

  ctx.fillStyle = "#ecfff5";

  ctx.font = "700 16px Manrope, sans-serif";

  ctx.fillText(shortenDiagramLabel(spec.keywords[0] || "Topic", 14), centerX - 30, centerY + 5);



  const orbitLabels = [spec.notes[0], spec.notes[1], spec.notes[2], spec.keywords[1] || "Example"];

  orbitLabels.forEach((label, index) => {

    const angle = elapsed / 2000 + index * (Math.PI / 2);

    const x = centerX + Math.cos(angle) * orbit;

    const y = centerY + Math.sin(angle) * orbit * 0.72;

    ctx.strokeStyle = "rgba(180,255,221,0.24)";

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.moveTo(centerX, centerY);

    ctx.lineTo(x, y);

    ctx.stroke();



    ctx.beginPath();

    ctx.fillStyle = index % 2 === 0 ? "#8df0a9" : "#ffd66e";

    ctx.arc(x, y, 16, 0, Math.PI * 2);

    ctx.fill();

    drawDiagramLabel(ctx, label || "Idea", x - 40, y - 24, 94);

  });

}



function renderStudyDiagramFrame(timestamp) {

  if (!studyDiagramRuntime.canvas || !studyDiagramRuntime.spec) {

    return;

  }



  if (document.hidden) {

    studyDiagramRuntime.rafId = 0;

    return;

  }



  const canvasState = getStudyDiagramCanvasContext(studyDiagramRuntime.canvas);

  if (!canvasState) {

    studyDiagramRuntime.rafId = window.requestAnimationFrame(renderStudyDiagramFrame);

    return;

  }



  if (timestamp - studyDiagramRuntime.lastFrameTime < 33) {

    studyDiagramRuntime.rafId = window.requestAnimationFrame(renderStudyDiagramFrame);

    return;

  }



  studyDiagramRuntime.lastFrameTime = timestamp;



  const { ctx, width, height } = canvasState;

  const elapsed = timestamp - studyDiagramRuntime.startTime;

  const spec = studyDiagramRuntime.spec;



  drawStudyDiagramBackground(ctx, width, height, elapsed, spec);



  if (spec.type === "timeline") {

    drawTimelineDiagram(ctx, width, height, elapsed, spec);

  } else if (spec.type === "network") {

    drawNetworkDiagram(ctx, width, height, elapsed, spec);

  } else if (spec.type === "graph") {

    drawGraphDiagram(ctx, width, height, elapsed, spec);

  } else if (spec.type === "flowchart") {

    drawFlowchartDiagram(ctx, width, height, elapsed, spec);

  } else if (spec.type === "equation") {

    drawEquationDiagram(ctx, width, height, elapsed, spec);

  } else {

    drawConceptDiagram(ctx, width, height, elapsed, spec);

  }



  studyDiagramRuntime.rafId = window.requestAnimationFrame(renderStudyDiagramFrame);

}



function mountStudyDiagram(spec) {

  const canvas = document.getElementById("studyDiagramCanvas");

  if (!canvas) {

    return;

  }



  stopStudyDiagramRenderer();

  studyDiagramRuntime.canvas = canvas;

  studyDiagramRuntime.spec = spec;

  studyDiagramRuntime.startTime = performance.now();

  studyDiagramRuntime.lastFrameTime = 0;

  studyDiagramRuntime.rafId = window.requestAnimationFrame(renderStudyDiagramFrame);

}



async function fetchStudyTopicPhoto(topic) {

  const creatorReference = getCreatorReferenceImage(topic);

  if (creatorReference) {

    return creatorReference;

  }



  const cacheKey = topicKey(topic);

  if (!cacheKey) {

    return null;

  }



  if (studyTopicPhotoCache.has(cacheKey)) {

    return studyTopicPhotoCache.get(cacheKey);

  }



  const queries = [topic.trim(), `${topic.trim()} concept`, `${topic.trim()} topic`];



  for (const query of queries) {

    try {

      const endpoint = new URL("https://en.wikipedia.org/w/api.php");

      endpoint.searchParams.set("action", "query");

      endpoint.searchParams.set("generator", "search");

      endpoint.searchParams.set("gsrsearch", query);

      endpoint.searchParams.set("gsrlimit", "3");

      endpoint.searchParams.set("prop", "pageimages");

      endpoint.searchParams.set("piprop", "thumbnail");

      endpoint.searchParams.set("pithumbsize", "560");

      endpoint.searchParams.set("format", "json");

      endpoint.searchParams.set("origin", "*");



      const response = await fetch(endpoint.toString());

      if (!response.ok) {

        continue;

      }



      const payload = await response.json();

      const pages = Object.values(payload?.query?.pages || {});

      const match = pages.find((page) => page?.thumbnail?.source);



      if (match?.thumbnail?.source) {

        const result = {

          src: match.thumbnail.source,

          title: match.title || topic,

        };

        studyTopicPhotoCache.set(cacheKey, result);

        return result;

      }

    } catch (_error) {

    }

  }



  studyTopicPhotoCache.set(cacheKey, null);

  return null;

}



async function loadStudyTopicPhoto(topic) {

  const photoCard = document.getElementById("studyTopicPhotoCard");

  const photoImage = document.getElementById("studyTopicPhotoImage");

  const photoPlaceholder = document.getElementById("studyTopicPhotoPlaceholder");

  const photoCaption = document.getElementById("studyTopicPhotoCaption");

  const photoLink = document.getElementById("studyTopicPhotoLink");

  if (!photoCard || !photoImage || !photoPlaceholder || !photoCaption || !photoLink) {

    return;

  }



  const requestId = ++studyTopicPhotoRequestId;

  photoCard.dataset.status = "loading";

  photoImage.hidden = true;

  photoImage.removeAttribute("src");

  photoImage.alt = "";

  photoPlaceholder.hidden = false;

  photoPlaceholder.textContent = `Finding a related web photo for ${topic}...`;

  photoCaption.textContent = "Looking up a topic image from the web.";

  photoLink.href = buildImageSearchLink(topic);



  const result = await fetchStudyTopicPhoto(topic);

  if (requestId !== studyTopicPhotoRequestId) {

    return;

  }



  const activeCard = document.getElementById("studyTopicPhotoCard");

  const activeImage = document.getElementById("studyTopicPhotoImage");

  const activePlaceholder = document.getElementById("studyTopicPhotoPlaceholder");

  const activeCaption = document.getElementById("studyTopicPhotoCaption");

  if (!activeCard || !activeImage || !activePlaceholder || !activeCaption) {

    return;

  }



  if (!result?.src) {

    activeCard.dataset.status = "empty";

    activePlaceholder.hidden = false;

    activePlaceholder.textContent = `No related web photo found for ${topic}.`;

    activeCaption.textContent = "No matching web photo was found, but you can open an image search.";

    return;

  }



  activeImage.onerror = () => {

    if (requestId !== studyTopicPhotoRequestId) {

      return;

    }

    activeCard.dataset.status = "empty";

    activeImage.hidden = true;

    activePlaceholder.hidden = false;

    activePlaceholder.textContent = `The web photo could not be loaded for ${topic}.`;

    activeCaption.textContent = "Image loading failed, but you can open an image search instead.";

  };



  activeImage.onload = () => {

    if (requestId !== studyTopicPhotoRequestId) {

      return;

    }

    activeCard.dataset.status = "ready";

    activePlaceholder.hidden = true;

    activeImage.hidden = false;

    activeCaption.textContent = `${result.title} from Wikipedia results.`;

  };



  activeImage.alt = `Related photo for ${topic}`;

  activeImage.src = result.src;

}



function escapeHtml(value) {

  return String(value ?? "")

    .replace(/&/g, "&amp;")

    .replace(/</g, "&lt;")

    .replace(/>/g, "&gt;")

    .replace(/"/g, "&quot;");

}



function renderBoardChatLine(role, bodyMarkup, order = 0) {

  const isUser = role === "user";

  const roleClass = isUser ? "chat-line-user" : "chat-line-assistant";

  const roleLabel = isUser ? "You" : "Aubit";

  const avatarLabel = isUser ? "Y" : "A";

  return `

    <div class="chat-line ${roleClass}" style="--chat-order: ${order};">

      <span class="chat-avatar" aria-hidden="true">${avatarLabel}</span>

      <div class="chat-bubble">

        <span class="chat-role">${roleLabel}</span>

        ${bodyMarkup}

      </div>

    </div>

  `;

}



function renderBoardTypingLine(label = "Aubit is thinking...", order = 0) {

  return renderBoardChatLine(

    "assistant",

    `

      <div class="chat-typing-row" aria-hidden="true">

        <span class="chat-typing-dot"></span>

        <span class="chat-typing-dot"></span>

        <span class="chat-typing-dot"></span>

      </div>

      <p class="chat-typing-label">${escapeHtml(label)}</p>

    `,

    order,

  );

}



function splitAnswerIntoChalkLines(text) {

  const source = (text || "").trim();

  if (!source) {

    return [];

  }



  return source

    .replace(/\r/g, "")

    .split(/\n{2,}/)

    .map((block) => block.trim())

    .filter(Boolean)

    .flatMap((block) => {

      const explicitLines = block

        .split("\n")

        .map((line) => line.trim())

        .filter(Boolean);



      if (explicitLines.length > 1) {

        return explicitLines;

      }



      return block

        .split(/(?<=[.!?])\s+/)

        .map((line) => line.trim())

        .filter(Boolean);

    });

}



function formatStudyAnswer(text) {

  const lines = splitAnswerIntoChalkLines(text);

  if (!lines.length) {

    return "";

  }



  return lines

    .map((line, index) => {

      const isListItem = /^(?:[-*]|\u2022|\d+[.)])\s*/.test(line);

      const cleanedLine = isListItem ? line.replace(/^(?:[-*]|\u2022|\d+[.)])\s*/, "") : line;

      return `

        <p

          class="study-answer-line${isListItem ? " is-list-item" : ""}"

          style="--chalk-line-index: ${index};"

        >${escapeHtml(cleanedLine)}</p>

      `;

    })

    .join("");

}





function autoScrollStudyBoard() {

  requestAnimationFrame(() => {

    const answerCard = boardContent.querySelector(".study-answer-card");

    if (!answerCard) {

      boardContent.scrollTo({ top: 0, behavior: "smooth" });

      return;

    }



    const cardTop = answerCard.offsetTop - 12;

    const cardBottom = cardTop + answerCard.offsetHeight;

    const viewTop = boardContent.scrollTop;

    const viewBottom = viewTop + boardContent.clientHeight;



    if (cardTop < viewTop || cardBottom > viewBottom) {

      boardContent.scrollTo({ top: Math.max(cardTop, 0), behavior: "smooth" });

    }

  });

}



function renderBackendUnavailableBoard(boardLabel = "Study Board", topic = "") {

  const safeTopic = escapeHtml((topic || state.currentTopic || "").trim());

  const safeBoardLabel = escapeHtml(boardLabel);

  const isStudyBoard = boardLabel === "Study Board";

  const backendReason = state.lastBackendError

    || (state.backendStatus !== "connected" ? `Backend status is ${state.backendStatus}.` : "The backend AI request did not complete.");

  const safeBackendReason = escapeHtml(backendReason);



  setBoardContentLayout();

  updateBoardChrome(boardLabel, isStudyBoard, "Explain Python");

  replaceBoardContent(`

    <div class="board-stack board-chat-thread">

      ${

        safeTopic

          ? renderBoardChatLine(

              "user",

              `

                <p class="chat-topic-label">Topic</p>

                <h3>${safeTopic}</h3>

              `,

              0,

            )

          : ""

      }

      ${renderBoardChatLine(

        "assistant",

        `

          <div class="backend-alert-card">

            <div class="backend-alert-copy">

              <h3>${safeBoardLabel}</h3>

              ${safeTopic ? `<p>Topic: ${safeTopic}</p>` : `<p>The backend AI request did not complete.</p>`}

              <p class="backend-alert-line">${safeBackendReason}</p>

            </div>

            <div class="backend-alert-image-wrap">

              <img

                class="backend-alert-image"

                src="./src/assets/backend-request-guide.png"

                alt="Backend request reminder"

                loading="lazy"

              />

            </div>

          </div>

        `,

        safeTopic ? 1 : 0,

      )}

      ${

        isStudyBoard

          ? renderStudyInputDock(safeTopic ? 2 : 1)

          : ""

      }

    </div>

  `);

  autoScrollStudyBoard();

}



function renderStudyBoard(topic, aiData = null, options = {}) {

  const modeConfig = getStudyModeConfig();

  state.currentTopic = topic;

  state.studiedTopic = topic;

  state.currentStudyData = aiData;

  state.currentStudyMode = options.mode || state.currentStudyMode || "";

  state.currentStudyVisualOpen = Boolean(options.showVisual);

  updateBoardChrome("Study Board", true, "Explain Python");

  const explanationSteps = aiData?.steps?.length === 3 ? aiData.steps : buildStudyExplanation(topic);

  const diagramSpec = buildStudyDiagramSpec(topic, aiData);

  const safeTopic = escapeHtml(topic);

  const safeBoardLabel = escapeHtml(modeConfig.boardLabel);

  const safeSteps = explanationSteps.map((step) => escapeHtml(step));

  const fullAnswer = aiData?.response ? formatStudyAnswer(aiData.response) : "";

  const isImageMode = state.studyMode === "image";

  const isInstant = options.mode === "instant";

  setBoardContentLayout(isImageMode ? "image-fit" : "default");

  replaceBoardContent(`

    <div class="board-stack board-chat-thread">

      ${renderBoardChatLine(

        "user",

        `

          <p class="chat-topic-label">${safeBoardLabel}</p>

          <h3>${safeTopic}</h3>

        `,

        0,

      )}

      ${isImageMode ? renderBoardChatLine("assistant", renderStudyDiagramCard(diagramSpec, topic, { imageOnly: true }), 1) : ""}

      ${

        fullAnswer && !isImageMode

          ? renderBoardChatLine(

              "assistant",

              `

                <div class="study-form study-answer-card">

                  <div class="chalk-hand" aria-hidden="true"></div>

                  <div class="study-answer-body chalk-writing">${fullAnswer}</div>

                </div>

              `,

              1,

            )

          : ""

      }

      ${

        options.showVisual && !isImageMode

          ? renderBoardChatLine("assistant", renderStudyDiagramCard(diagramSpec, topic), fullAnswer ? 2 : 1)

          : ""

      }

      ${

        !isImageMode

          ? renderBoardChatLine(

              "assistant",

              `

                <div class="study-form">

                  <div class="visual-bullets">

                    <span class="visual-caption">${safeSteps[0]}</span>

                    <span class="visual-caption">${safeSteps[1]}</span>

                    <span class="visual-caption">${safeSteps[2]}</span>

                  </div>

                  <div class="study-action-row">

                    <button class="study-action-button secondary" type="button" data-study-action="draw-visual">Draw Visual</button>

                    <button class="study-action-button secondary" type="button" data-study-action="make-simpler">Simpler</button>

                    <button class="study-action-button secondary" type="button" data-study-action="give-example">Example</button>

                    <button class="study-action-button secondary" type="button" data-study-action="stop-speaking">Stop</button>

                  </div>

                </div>

              `,

              options.showVisual ? fullAnswer ? 3 : 2 : fullAnswer ? 2 : 1,

            )

          : ""

      }

      ${renderStudyInputDock(isImageMode ? 2 : options.showVisual ? fullAnswer ? 4 : 3 : fullAnswer ? 3 : 2)}

    </div>

  `);

  if (options.showVisual || isImageMode) {

    mountStudyDiagram(diagramSpec);

  }

  if (options.showVisual && !isInstant && !isImageMode) {

    loadStudyTopicPhoto(topic);

  }

  autoScrollStudyBoard();

}



function renderImageLoadingBoard(topic) {

  state.currentTopic = topic;

  state.studiedTopic = topic;

  state.currentStudyVisualOpen = true;

  updateBoardChrome("Create Image", true, "Create Image");

  setBoardContentLayout("image-fit");

  replaceBoardContent(`

    <div class="board-stack board-chat-thread image-generation-thread">

      ${renderBoardChatLine(

        "user",

        `

          <p class="chat-topic-label">Image idea</p>

          <h3>${escapeHtml(topic)}</h3>

        `,

        0,

      )}

      ${renderBoardChatLine(

        "assistant",

        `

          <div class="study-form generated-image-card is-loading" aria-live="polite">

            <div class="generated-image-placeholder">

              <div class="chat-typing-row" aria-hidden="true">

                <span class="chat-typing-dot"></span>

                <span class="chat-typing-dot"></span>

                <span class="chat-typing-dot"></span>

              </div>

            </div>

          </div>

        `,

        1,

      )}

      ${renderStudyInputDock(2)}

    </div>

  `);

  autoScrollStudyBoard();

}



function renderInternetImageBoard(topic, imageData) {

  const imageSrc = imageData?.src || "";

  state.currentTopic = topic;

  state.studiedTopic = topic;

  state.currentStudyVisualOpen = true;

  updateBoardChrome("Create Image", true, "Create Image");

  setBoardContentLayout("image-fit");

  replaceBoardContent(`

    <div class="board-stack board-chat-thread image-generation-thread">

      ${renderBoardChatLine(

        "user",

        `

          <p class="chat-topic-label">Image idea</p>

          <h3>${escapeHtml(topic)}</h3>

        `,

        0,

      )}

      ${renderBoardChatLine(

        "assistant",

        `

          <div class="study-form generated-image-card">

            <img

              class="generated-image-output"

              src="${escapeHtml(imageSrc)}"

              alt="${escapeHtml(topic)}"

              referrerpolicy="no-referrer"

            />

          </div>

        `,

        1,

      )}

      ${renderStudyInputDock(2)}

    </div>

  `);

  autoScrollStudyBoard();

}



function renderInternetImageErrorBoard(topic) {

  state.currentTopic = topic;

  state.studiedTopic = topic;

  state.currentStudyVisualOpen = true;

  updateBoardChrome("Create Image", true, "Create Image");

  setBoardContentLayout("image-fit");

  replaceBoardContent(`

    <div class="board-stack board-chat-thread image-generation-thread">

      ${renderBoardChatLine(

        "user",

        `

          <p class="chat-topic-label">Image idea</p>

          <h3>${escapeHtml(topic)}</h3>

        `,

        0,

      )}

      ${renderBoardChatLine(

        "assistant",

        `

          <div class="study-form generated-image-card generated-image-error">

            <p>No internet image found.</p>

          </div>

        `,

        1,

      )}

      ${renderStudyInputDock(2)}

    </div>

  `);

  autoScrollStudyBoard();

}



function renderStudyLoading(topic) {

  const modeConfig = getStudyModeConfig();

  state.currentTopic = topic;

  state.studiedTopic = topic;

  updateBoardChrome("Study Board", true, "Explain Python");

  const safeTopic = escapeHtml(topic);

  replaceBoardContent(`

    <div class="board-stack board-chat-thread">

      ${renderBoardChatLine(

        "user",

        `

          <p class="chat-topic-label">Study topic</p>

          <h3>${escapeHtml(modeConfig.label)}: ${safeTopic}</h3>

        `,

        0,

      )}

      ${renderBoardTypingLine("Aubit is picking up the chalk and preparing the blackboard.", 1)}

      ${renderStudyInputDock(2)}

    </div>

  `);

  autoScrollStudyBoard();

}



function getStudyTopicInput() {

  return document.getElementById("studyTopicInput");

}



function syncStudyDraft() {

  const input = getStudyTopicInput();

  state.studyDraft = input?.value ?? state.studyDraft;

}



function splitResponseIntoSteps(text, topic) {

  const normalized = text

    .replace(/\r/g, "")

    .split(/\n+/)

    .map((line) => line.replace(/^[-*0-9.)\s]+/, "").trim())

    .filter(Boolean);



  if (normalized.length >= 3) {

    return normalized.slice(0, 3);

  }



  return buildStudyExplanation(topic);

}



function isDirectAnswerStudyTopic(topic) {

  const normalized = topic.trim().toLowerCase();

  if (!normalized) {

    return false;

  }



  if (/\d/.test(normalized) && /[+\-*/%=()]/.test(normalized)) {

    return true;

  }



  return /\b(arithmetic|math|mathematics|logic|calculate|calculation|solve|equation|sum|difference|product|quotient|percentage|percent|ratio|average)\b/.test(

    normalized,

  );

}



function buildStudyPrompt(topic) {

  const profile = getStudyAgeProfile();

  const activeMode = state.studyMode;

  const modeConfig = getStudyModeConfig(activeMode);



  if (activeMode === "solve") {

    return `Solve this for ${profile.shortLabel}: ${topic}. ${profile.instruction} Give a blackboard-style solution. Show each equation or step on its own line, then give the final answer.`;

  }



  if (activeMode === "image") {

    return `Create a clear visual plan for this request: ${topic}. ${profile.instruction} Describe the image or diagram with layout, labels, colors, and 3 board-ready steps. Do not say you cannot draw; produce a useful visual brief.`;

  }



  if (activeMode === "summarize") {

    return `Summarize this for ${profile.shortLabel}: ${topic}. ${profile.instruction} Use short headings, clean bullets, and a final recap.`;

  }



  if (activeMode === "practice") {

    return `Create a practice plan for ${profile.shortLabel} on this topic: ${topic}. ${profile.instruction} Include warm-up, guided practice, challenge, and what to review. Do not create a full test interface.`;

  }



  if (activeMode === "simple") {

    return `Explain this in very simple words for ${profile.shortLabel}: ${topic}. Use tiny sections, a real-life example, and one quick check question.`;

  }



  if (isDirectAnswerStudyTopic(topic)) {

    return `Answer this arithmetic or logic question directly for ${profile.shortLabel}: ${topic}. ${profile.instruction} Give the final answer first. Keep it brief and do not give a long explanation unless the user explicitly asks for one.`;

  }



  return `${modeConfig.label} mode. Teach me ${topic} for ${profile.shortLabel}. ${profile.instruction} Use this exact structure: simple meaning, example, key points, quick check. Start directly with the explanation and do not add any introductory phrases.`;

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

  if (state.resolvedApiBaseUrl) {

    return state.resolvedApiBaseUrl;

  }



  if (state.apiBaseReady) {

    return state.apiBaseReady;

  }



  state.apiBaseReady = (async () => {

    for (const candidate of apiBaseCandidates) {

      if (await probeApiBaseUrl(candidate)) {

        state.resolvedApiBaseUrl = candidate;

        state.apiBaseUrl = candidate;

        return candidate;

      }

    }



    const fallbackBaseUrl = apiBaseCandidates[0];

    state.resolvedApiBaseUrl = fallbackBaseUrl;

    state.apiBaseUrl = fallbackBaseUrl;

    return fallbackBaseUrl;

  })();



  try {

    return await state.apiBaseReady;

  } finally {

    state.apiBaseReady = null;

  }

}



function isJwtExpired(token) {
  if (!token || typeof token !== "string") return true;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (payload.exp && payload.exp * 1000 < Date.now() + 60000) {
      return true;
    }
    return false;
  } catch (_) {
    return true;
  }
}

async function ensureGuestSession(forceRefresh = false) {

  if (forceRefresh) {
    state.authToken = "";
    state.authReady = null;
  } else if (state.authToken && !isJwtExpired(state.authToken)) {
    return state.authToken;
  }

  if (state.authReady) {

    return state.authReady;

  }



  const guestCredentials = {

    username: "guest_demo",

    password: "Password123",

    role: "user",

  };

  const apiBaseUrl = await resolveApiBaseUrl();



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

        const details = await response.text().catch(() => "");

        throw new Error(`Login failed with status ${response.status}${details ? `: ${details}` : ""}`);

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

        const details = await signupResponse.text().catch(() => "");

        throw new Error(`Signup failed with status ${signupResponse.status}${details ? `: ${details}` : ""}`);

      }



      return signupResponse.json();

    })

    .then((payload) => {

      const accessToken = payload?.data?.access_token;

      if (!accessToken) {

        throw new Error("Login response did not contain an access token");

      }

      state.authToken = accessToken;

      state.lastBackendError = "";

      return accessToken;

    })

    .finally(() => {

      state.authReady = null;

    });



  return state.authReady;

}



async function requestAIResponse(prompt, context = {}, useVoice = false) {

  const accessToken = await ensureGuestSession();

  const apiBaseUrl = await resolveApiBaseUrl();

  const resolvedContext = { ...context, language: "en", output_language: "English" };

  const preferredUserName = getPreferredUserName();

  if (preferredUserName && !resolvedContext.user_name) {

    resolvedContext.user_name = preferredUserName;

  }

  const response = await fetch(`${apiBaseUrl}/ai-response`, {

    method: "POST",

    headers: {

      "Content-Type": "application/json",

      Authorization: `Bearer ${accessToken}`,

    },

    body: JSON.stringify({

      prompt,

      use_voice: useVoice,

      context: resolvedContext,

    }),

  });



  if (!response.ok) {

    const details = await response.text().catch(() => "");

    throw new Error(`AI request failed with status ${response.status}${details ? `: ${details}` : ""}`);

  }



  const payload = await response.json();

  const text = payload?.data?.response;

  if (!text) {

    throw new Error("AI response was empty");

  }



  return {

    text,

    voicePreview: payload?.data?.voice_preview || null,

    raw: payload?.data || {},

  };

}



async function requestAIStudy(topic) {

  const aiResult = await requestAIResponse(

    buildStudyPrompt(topic),

    {

      topic,

      mode: "study",

      study_mode: state.studyMode,

      learner_age: state.studyLearnerAge || "",

      learner_level: getStudyAgeProfile().shortLabel,

      response_style: state.studyMode === "solve" || isDirectAnswerStudyTopic(topic) ? "direct_answer" : state.studyMode,

    },

    false,

  );

  return {

    response: aiResult.text,

    voicePreview: aiResult.voicePreview,

    steps: splitResponseIntoSteps(aiResult.text, topic),

  };

}



async function requestStudyDoubtResponse(doubt) {

  const topic = state.currentTopic || state.studyDraft || "this topic";

  const prompt = [

    `We are studying: ${topic}.`,

    `The learner's doubt or follow-up question is: ${doubt}.`,

    "Answer like a live tutor speaking in real time.",

    "First answer the doubt directly, then reconnect it to the topic.",

    "Keep it clear, friendly, and short enough to speak aloud.",

    "End with one tiny check question.",

  ].join("\n");

  const aiResult = await requestAIResponse(

    prompt,

    {

      topic,

      mode: "study_doubt",

      study_mode: state.studyMode,

      learner_age: state.studyLearnerAge || "",

      learner_level: getStudyAgeProfile().shortLabel,

      response_style: "spoken_tutor_followup",

    },

    true,

  );



  return {

    response: aiResult.text,

    voicePreview: aiResult.voicePreview,

    steps: splitResponseIntoSteps(aiResult.text, topic),

  };

}



async function handleStudyVoiceTranscript(transcript) {

  const cleaned = String(transcript || "").replace(/\s+/g, " ").trim();

  if (!cleaned) {

    return;

  }



  const normalized = cleaned.toLowerCase();

  if (/^(?:stop|pause|quiet|be quiet|stop speaking|wait|hold on)\b/.test(normalized)) {

    stopSpeechPlayback();

    setCompanionState({

      mood: "Paused",

      speech: "Okay, I stopped. Ask your doubt when ready.",

      status: "Study explanation paused for a learner question.",

      forceSpeak: true,

    });

    queueStudyVoiceCapture(1200);

    return;

  }



  const hasActiveTopic = Boolean(state.currentTopic || state.studyDraft);

  if (!hasActiveTopic || /^(?:explain|teach me|study|learn)\b/i.test(cleaned)) {

    const topic = cleaned

      .replace(/^(?:explain|teach me|study|learn)\s+(?:about\s+)?/i, "")

      .trim() || cleaned;

    await startStudySession(topic);

    return;

  }



  state.studyVoiceBusy = true;

  stopSpeechPlayback();

  try {

    setSpeechBubbleText(`Doubt: ${cleaned}`);

    const aiData = await requestStudyDoubtResponse(cleaned);

    renderStudyBoard(state.currentTopic || state.studyDraft || cleaned, aiData, {

      mode: "doubt",

      showVisual: state.currentStudyVisualOpen,

    });

    setAvatarExpressionVariant("focused", { duration: 1600, allowWhileLocked: true });

    speak(aiData.response, { voicePreview: aiData.voicePreview });

  } catch (error) {

    state.lastBackendError = error instanceof Error ? error.message : String(error || "Unknown doubt error");

    const fallback = `Good question. For ${state.currentTopic || "this topic"}, think of it one step at a time: what it is, why it happens, and one example. Ask me the part that feels confusing.`;

    const fallbackData = {

      response: fallback,

      voicePreview: null,

      steps: splitResponseIntoSteps(fallback, state.currentTopic || "this topic"),

    };

    renderStudyBoard(state.currentTopic || state.studyDraft || "this topic", fallbackData, {

      mode: "doubt-fallback",

      showVisual: state.currentStudyVisualOpen,

    });

    speak(fallback);

  } finally {

    state.studyVoiceBusy = false;

  }

}



function readStoredAuthAccounts() {

  try {

    const raw = window.localStorage.getItem(AUTH_ACCOUNTS_STORAGE_KEY);

    const parsed = raw ? JSON.parse(raw) : {};

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {

      return {};

    }

    return parsed;

  } catch (_error) {

    return {};

  }

}



function writeStoredAuthAccounts(accounts) {

  window.localStorage.setItem(AUTH_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));

}



function readStoredAuthToken() {

  try {

    return String(window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || "").trim();

  } catch (_error) {

    return "";

  }

}



function writeStoredAuthToken(token) {

  const normalizedToken = String(token || "").trim();

  try {

    if (normalizedToken) {

      window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, normalizedToken);

    } else {

      window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);

    }

  } catch (_error) {

  }

  return normalizedToken;

}



function normalizeAuthIdentifier(value) {

  return String(value || "").trim().toLowerCase();

}



function getEntryAuthFieldValue(form, fieldName) {

  const formData = new FormData(form);

  return formData.get(fieldName);

}



function setEntryAuthBusy(isBusy) {

  state.entryAuthBusy = Boolean(isBusy);

  entryAuthOverlay?.classList.toggle("is-busy", state.entryAuthBusy);



  [entrySignInForm, entrySignUpForm].filter(Boolean).forEach((form) => {

    form.querySelectorAll("input, button").forEach((element) => {

      element.disabled = state.entryAuthBusy;

    });

  });



  entryAuthModeButtons.forEach((button) => {

    button.disabled = state.entryAuthBusy;

  });



  if (entryGuestButton) {

    entryGuestButton.disabled = state.entryAuthBusy;

  }



  if (entryAuthResetButton) {

    entryAuthResetButton.disabled = state.entryAuthBusy;

  }



  if (entryAgeInput) {

    entryAgeInput.disabled = state.entryAuthBusy;

  }

}



function syncEntryLearnerAge() {

  const rawValue = entryAgeInput?.value || readStoredStudyLearnerAge() || "14";

  const savedAge = writeStoredStudyLearnerAge(rawValue) || "14";

  state.studyLearnerAge = savedAge;

  if (entryAgeInput && !entryAgeInput.value) {

    entryAgeInput.value = savedAge;

  }

  return savedAge;

}



function getAuthDisplayName(displayName, identifier) {

  const normalizedDisplayName = normalizePreferredUserName(displayName);

  if (normalizedDisplayName) {

    return normalizedDisplayName;

  }



  const normalizedIdentifier = normalizeAuthIdentifier(identifier);

  if (!normalizedIdentifier) {

    return "User";

  }



  return normalizedIdentifier.includes("@")

    ? normalizedIdentifier.split("@")[0]

    : normalizedIdentifier;

}



function cacheOfflineAuthAccount(identifier, displayName, password) {

  const normalizedIdentifier = normalizeAuthIdentifier(identifier);

  if (!normalizedIdentifier || !password) {

    return;

  }



  const accounts = readStoredAuthAccounts();

  accounts[normalizedIdentifier] = {

    displayName: getAuthDisplayName(displayName, normalizedIdentifier),

    password,

    createdAt: accounts[normalizedIdentifier]?.createdAt || new Date().toISOString(),

    updatedAt: new Date().toISOString(),

  };

  writeStoredAuthAccounts(accounts);

}



function persistEntryAuthSession({ identifier, displayName, accessToken = "" }) {

  const normalizedIdentifier = normalizeAuthIdentifier(identifier);

  const resolvedDisplayName = getAuthDisplayName(displayName, normalizedIdentifier);



  state.authToken = writeStoredAuthToken(accessToken);

  state.currentUserName = resolvedDisplayName;

  state.currentUserIdentifier = normalizedIdentifier;

  state.preferredUserName = writeStoredPreferredUserName(resolvedDisplayName);



  try {

    window.localStorage.setItem(AUTH_LAST_USER_STORAGE_KEY, normalizedIdentifier);

    window.localStorage.setItem(AUTH_DISPLAY_NAME_STORAGE_KEY, resolvedDisplayName);

  } catch (_error) {

  }



  updateCurrentUserBadge();

  loadGoldPointsForUser(normalizedIdentifier);

  syncPreferredNameControls();

  return resolvedDisplayName;

}



async function readAuthErrorMessage(response, fallbackMessage) {

  try {

    const payload = await response.clone().json();

    const detail =

      payload?.detail ||

      payload?.message ||

      (Array.isArray(payload?.errors) ? payload.errors.join(", ") : "");

    if (detail) {

      return String(detail);

    }

  } catch (_error) {

  }



  const text = await response.text().catch(() => "");

  return text || fallbackMessage;

}



function isBackendUnavailableError(error) {

  const message = error instanceof Error ? error.message : String(error || "");

  return /backend|server|network|fetch|load failed|failed to fetch|ecconnrefused/i.test(message);

}



async function requestEntryAuth(path, payload, fallbackMessage) {

  const apiBaseUrl = await resolveApiBaseUrl();



  let response;

  try {

    response = await fetch(`${apiBaseUrl}/${path}`, {

      method: "POST",

      headers: {

        "Content-Type": "application/json",

      },

      body: JSON.stringify(payload),

    });

  } catch (_error) {

    throw new Error("We could not reach the Aubit server.");

  }



  if (!response.ok) {

    throw new Error(await readAuthErrorMessage(response, fallbackMessage));

  }



  return response.json();

}



function setEntryAuthFeedback(message = "", tone = "error") {

  if (!entryAuthFeedback) {

    return;

  }



  entryAuthFeedback.textContent = message;

  entryAuthFeedback.classList.remove("is-hidden", "is-success", "is-error");

  if (!message) {

    entryAuthFeedback.classList.add("is-hidden");

    return;

  }



  entryAuthFeedback.classList.add(tone === "success" ? "is-success" : "is-error");

}



function updateCurrentUserBadge() {

  const userName = state.currentUserName.trim();

  if (!userName) {

    currentUserLabel.textContent = "";

    currentUserBadge.classList.add("is-hidden");

    syncGoldPointsBadge();

    return;

  }



  currentUserLabel.textContent = userName;

  currentUserBadge.classList.remove("is-hidden");

  syncGoldPointsBadge();

}



function setEntryAuthMode(mode = "signin") {

  entryAuthModeButtons.forEach((button) => {

    button.classList.toggle("active", button.dataset.authMode === mode);

  });

  entrySignInForm?.classList.toggle("is-hidden", mode !== "signin");

  entrySignUpForm?.classList.toggle("is-hidden", mode !== "signup");

  setEntryAuthFeedback("");

}



function revealFloorGateway(displayName) {

  if (!entryAuthOverlay) {

    return;

  }



  entryAuthOverlay.classList.add("ready");

  if (floorGatewayLabel) {

    floorGatewayLabel.textContent = `Welcome ${displayName}. Tap the pod to enter Aubit`;

  }

}



function isPodEntryPending() {

  try {

    return window.localStorage.getItem(AUTH_POD_PENDING_STORAGE_KEY) === "true";

  } catch (_error) {

    return false;

  }

}



function setPodEntryPending(isPending) {

  try {

    if (isPending) {

      window.localStorage.setItem(AUTH_POD_PENDING_STORAGE_KEY, "true");

    } else {

      window.localStorage.removeItem(AUTH_POD_PENDING_STORAGE_KEY);

    }

  } catch (_error) {

  }

}



function completeEntryAuth() {

  state.authUnlocked = true;

  try {

    window.localStorage.setItem(AUTH_UNLOCKED_STORAGE_KEY, "true");

    window.localStorage.setItem(AUTH_DISPLAY_NAME_STORAGE_KEY, state.currentUserName || state.preferredUserName || "User");

  } catch (_error) {

  }

  setPodEntryPending(false);

  openPod();

  setIdleBehavior();

}



async function handleSignInSubmit(event) {

  event.preventDefault();

  if (state.entryAuthBusy) {

    return;

  }



  if (!syncEntryLearnerAge()) {

    return;

  }



  const identifier = normalizeAuthIdentifier(getEntryAuthFieldValue(entrySignInForm, "email"));

  const password = String(getEntryAuthFieldValue(entrySignInForm, "password") || "");



  if (!identifier || !password) {

    setEntryAuthFeedback("Enter email or username and password to sign in.");

    return;

  }



  if (password.length < 8) {

    setEntryAuthFeedback("Password must be at least 8 characters.");

    return;

  }



  setEntryAuthBusy(true);

  setEntryAuthFeedback("Signing you in...", "success");



  try {

    let payload;

    try {

      const loginPayload = identifier.includes("@")

        ? { email: identifier, password, role: "user" }

        : { username: identifier, password, role: "user" };

      payload = await requestEntryAuth(

        "login",

        loginPayload,

        "Sign in failed.",

      );

      cacheOfflineAuthAccount(identifier, payload?.data?.user?.display_name || "", password);

    } catch (error) {

      if (!isBackendUnavailableError(error)) {

        throw error;

      }



      const accounts = readStoredAuthAccounts();

      const offlineAccount = accounts[identifier];

      if (offlineAccount && offlineAccount.password !== password) {

        throw new Error("We could not reach the Aubit server, and the saved offline password does not match.");

      }



      if (!offlineAccount) {

        cacheOfflineAuthAccount(identifier, "", password);

      }



      const fallbackAccount = readStoredAuthAccounts()[identifier];

      const offlineDisplayName = persistEntryAuthSession({

        identifier,

        displayName: fallbackAccount?.displayName || "",

        accessToken: "",

      });

      setEntryAuthFeedback("Signed in using local mode. Entering Aubit...", "success");

      revealFloorGateway(offlineDisplayName);

      setTimeout(() => completeEntryAuth(), 300);

      return;

    }



    const displayName = persistEntryAuthSession({

      identifier,

      displayName: payload?.data?.user?.display_name,

      accessToken: payload?.data?.access_token || "",

    });

    setEntryAuthFeedback("Sign in successful. Entering Aubit...", "success");

    revealFloorGateway(displayName);

    setTimeout(() => completeEntryAuth(), 300);

  } catch (error) {

    setEntryAuthFeedback(error instanceof Error ? error.message : "Sign in failed.");

  } finally {

    setEntryAuthBusy(false);

  }

}



async function handleSignUpSubmit(event) {

  event.preventDefault();

  if (state.entryAuthBusy) {

    return;

  }



  if (!syncEntryLearnerAge()) {

    return;

  }



  const displayName = String(getEntryAuthFieldValue(entrySignUpForm, "display_name") || "").trim();

  const identifier = normalizeAuthIdentifier(getEntryAuthFieldValue(entrySignUpForm, "email"));

  const password = String(getEntryAuthFieldValue(entrySignUpForm, "password") || "");

  const confirmPassword = String(getEntryAuthFieldValue(entrySignUpForm, "confirm_password") || "");



  if (!displayName || !identifier || !password || !confirmPassword) {

    setEntryAuthFeedback("Fill all sign up fields before continuing.");

    return;

  }



  if (password.length < 8) {

    setEntryAuthFeedback("Password must be at least 8 characters.");

    return;

  }



  if (password !== confirmPassword) {

    setEntryAuthFeedback("Passwords do not match.");

    return;

  }



  setEntryAuthBusy(true);

  setEntryAuthFeedback("Creating your account...", "success");



  try {

    try {

      const payload = await requestEntryAuth(

        "signup",

        {

          email: identifier,

          password,

          role: "user",

          display_name: displayName,

        },

        "Sign up failed.",

      );

      cacheOfflineAuthAccount(identifier, displayName, password);

      const resolvedDisplayName = persistEntryAuthSession({

        identifier,

        displayName: payload?.data?.user?.display_name || displayName,

        accessToken: payload?.data?.access_token || "",

      });

      setEntryAuthFeedback("Sign up complete. Entering Aubit...", "success");

      revealFloorGateway(resolvedDisplayName);

      setTimeout(() => completeEntryAuth(), 300);

      return;

    } catch (error) {

      if (!isBackendUnavailableError(error)) {

        throw error;

      }

    }



    const accounts = readStoredAuthAccounts();

    if (accounts[identifier]) {

      throw new Error("We could not reach the Aubit server, and an offline account with this email already exists on this device.");

    }



    cacheOfflineAuthAccount(identifier, displayName, password);

    const offlineDisplayName = persistEntryAuthSession({

      identifier,

      displayName,

      accessToken: "",

    });

    setEntryAuthFeedback("Offline account created on this device. Tap the pod to enter Aubit.", "success");

    revealFloorGateway(offlineDisplayName);

  } catch (error) {

    setEntryAuthFeedback(error instanceof Error ? error.message : "Sign up failed.");

  } finally {

    setEntryAuthBusy(false);

  }

}



function handleGuestEntry() {

  if (state.entryAuthBusy) {

    return;

  }



  if (!syncEntryLearnerAge()) {

    return;

  }



  const guestName = persistEntryAuthSession({

    identifier: "guest@aubit.local",

    displayName: "Guest",

    accessToken: "",

  });

  setEntryAuthFeedback("Guest mode ready. Entering Aubit...", "success");

  revealFloorGateway(guestName);

  setTimeout(() => completeEntryAuth(), 300);

}



function initEntryAuthOverlay() {

  if (!entryAuthOverlay) {

    state.authUnlocked = true;

    document.body.classList.remove("auth-locked");

    return;

  }



  const lastUser = normalizeAuthIdentifier(window.localStorage.getItem(AUTH_LAST_USER_STORAGE_KEY) || "");

  state.authToken = readStoredAuthToken();



  if (entryAgeInput) {

    entryAgeInput.value = state.studyLearnerAge || "";

  }



  state.authUnlocked = false;

  state.authToken = "";

  writeStoredAuthToken("");

  setPodEntryPending(false);

  try {

    window.localStorage.removeItem(AUTH_UNLOCKED_STORAGE_KEY);

  } catch (_error) {

  }

  document.body.classList.add("auth-locked");

  entryAuthOverlay.classList.remove("is-hidden", "ready");

  entryAuthOverlay.classList.remove("is-busy");

  setEntryAuthMode("signin");



  const signInEmailField = entrySignInForm?.querySelector("input[name=\"email\"]");

  if (signInEmailField && lastUser) {

    signInEmailField.value = lastUser;

  }



  entryAuthModeButtons.forEach((button) => {

    button.addEventListener("click", () => setEntryAuthMode(button.dataset.authMode));

  });

  entrySignInForm?.addEventListener("submit", handleSignInSubmit);

  entrySignUpForm?.addEventListener("submit", handleSignUpSubmit);

  entryGuestButton?.addEventListener("click", handleGuestEntry);

  floorGatewayButton?.addEventListener("click", completeEntryAuth);

}



function recoverStartupForAuth(error) {

  console.error("Aubit startup failed:", error);

  state.authUnlocked = false;

  document.body.classList.add("auth-locked");

  entryAuthOverlay?.classList.remove("is-hidden");

  entryAuthOverlay?.classList.remove("ready");

  setEntryAuthMode("signin");

  setEntryAuthFeedback("The login page is ready, but the rest of the app is still loading. Please try again.");

}



function bootstrapApp() {

  if (hasBootstrappedApp) {

    return;

  }



  hasBootstrappedApp = true;



  try {

    state.robotVariant = readStoredRobotVariant();

    state.preferredUserName = readStoredPreferredUserName();

    state.studyLearnerAge = readStoredStudyLearnerAge();

    state.currentUserIdentifier = normalizeAuthIdentifier(window.localStorage.getItem(AUTH_LAST_USER_STORAGE_KEY) || "");

    state.currentUserName = normalizePreferredUserName(window.localStorage.getItem(AUTH_DISPLAY_NAME_STORAGE_KEY) || state.currentUserName);

    loadGoldPointsForUser(state.currentUserIdentifier);

    initEntryAuthOverlay();

    applyOutfitStyle(state.currentOutfit);

    applyAvatarRoomPosition();

    syncAvatarMotionState();

    syncAvatarExpression();

    syncWidgetModeToggleLabel();

    startHomeClock();

    applyTheme(state.theme);

    updateCurrentUserBadge();

    syncPreferredNameControls();

    renderDefaultBoard();

    studyBoard.classList.add("is-hidden");

    if (!introOverlay?.classList.contains("active")) {

      closeIntro();

    }

    speechBubble.textContent = buildCompanionGreeting();

    if (state.authUnlocked) {

      setIdleBehavior();

      if (!introOverlay?.classList.contains("active")) {

        setCompanionState({

          speech: buildCompanionGreeting(),

        });

      }

    }

  } catch (error) {

    recoverStartupForAuth(error);

  }

}



async function startStudySession(topic) {

  const normalizedTopic = String(topic || "Python").trim() || "Python";

  const requestId = state.studyRequestId + 1;

  const shouldShowVisual = state.studyMode === "image";

  state.studyRequestId = requestId;

  state.studyDraft = normalizedTopic;

  rememberCreatorSubjectFromText(normalizedTopic);

  clearStudyVoiceTimer();

  stopSpeechPlayback();



  if (shouldShowVisual) {

    renderImageLoadingBoard(normalizedTopic);

    try {

      const imageData = await fetchStudyTopicPhoto(normalizedTopic);

      if (requestId !== state.studyRequestId) {

        return;

      }

      if (imageData?.src) {

        renderInternetImageBoard(normalizedTopic, imageData);

      } else {

        renderInternetImageErrorBoard(normalizedTopic);

      }

      updateRewards({ coins: 4 });

    } catch (error) {

      if (requestId !== state.studyRequestId) {

        return;

      }

      state.lastBackendError = error instanceof Error ? error.message : String(error || "Unknown image error");

      renderInternetImageErrorBoard(normalizedTopic);

    }

    return;

  }



  const instantData = buildInstantStudyData(normalizedTopic);

  renderStudyBoard(normalizedTopic, instantData, {

    mode: "instant",

    showVisual: shouldShowVisual,

  });



  try {

    const aiData = await requestAIStudy(normalizedTopic);

    if (requestId !== state.studyRequestId) {

      return;

    }

    renderStudyBoard(normalizedTopic, aiData, {

      mode: "refined",

      showVisual: state.currentStudyVisualOpen || shouldShowVisual,

    });

    speak(aiData.response, { voicePreview: aiData.voicePreview });

    updateRewards({ coins: 4 });

    setAvatarExpressionVariant("focused", { duration: 1600, allowWhileLocked: true });

  } catch (error) {

    if (requestId !== state.studyRequestId) {

      return;

    }

    state.lastBackendError = error instanceof Error ? error.message : String(error || "Unknown backend error");

    renderStudyBoard(normalizedTopic, instantData, {

      mode: "instant",

      error: state.lastBackendError,

      showVisual: state.currentStudyVisualOpen || shouldShowVisual,

    });

    speak(instantData.response, { voicePreview: instantData.voicePreview });

    setAvatarExpressionVariant("soft", { duration: 1600, allowWhileLocked: true });

  }

}



function extractPromptAfterWakePhrase(transcript) {

  const match = transcript.match(/hello aubit[\s,:-]*(.*)/i);

  return match ? match[1].trim() : "";

}



function getVoiceCommandGame(prompt) {

  const normalized = prompt.toLowerCase();

  const games = {

    sudoku: ["sudoku", "sudoku grid"],

    "snake-ladder": ["snake and ladder", "snake ladder", "snakes and ladders"],

    chess: ["chess", "aubit chess"],

    monopoly: ["monopoly", "aubit streets"],

    maze: ["maze", "neon maze", "neon maze dx"],

    "red-bounce": ["red bounce", "red bounce dx"],

    "subway-sprint": ["subway sprint", "subway surfers", "subway runner", "train runner"],

  };



  return Object.entries(games).find(([, aliases]) =>

    aliases.some((alias) => normalized.includes(alias)),

  )?.[0] || "";

}



function runDesktopActionFromApp(command, options = {}, pendingSpeech = "Working on it.") {

  if (!desktopShell?.runCommand) {

    return false;

  }



  setCompanionState({

    mood: "Action Mode",

    speech: pendingSpeech,

    status: `Aubit is running the desktop action ${command}.`,

  });



  desktopShell

    .runCommand(command, options)

    .then((result) => {

      if (!result?.message) {

        return;

      }



      setCompanionState({

        mood: result.ok === false ? "Fallback" : "Action Complete",

        speech: result.message,

        status: `Desktop action ${command} finished.`,

      });

    })

    .catch((error) => {

      setCompanionState({

        mood: "Fallback",

        speech: `That desktop action did not finish cleanly. ${error instanceof Error ? error.message : String(error)}`,

        status: `Desktop action ${command} failed.`,

      });

    });



  return true;

}



function handleVoiceCommand(prompt) {

  const normalized = prompt.toLowerCase();

  const requestedGame = getVoiceCommandGame(prompt);

  const youtubeMatch =

    prompt.match(/^open\s+youtube(?:\s+and)?\s+play\s+(.+)$/i) ||

    prompt.match(/^play\s+(.+?)\s+on\s+youtube$/i) ||

    prompt.match(/^play\s+youtube\s+(.+)$/i);



  if (requestedGame && /\b(open|start|play|launch)\b/.test(normalized)) {

    activatePanel("games");

    renderEmbeddedGame(requestedGame);

    setCompanionState({

      mood: "Game Mode",

      speech: `Opening ${getGameLabel(requestedGame)}.`,

      status: `Voice assistant opened the ${getGameLabel(requestedGame)} game.`,

    });

    return true;

  }



  if (/\b(open|show)\b.*\bbluetooth\b/.test(normalized) && runDesktopActionFromApp("open_bluetooth_settings", {}, "Opening Bluetooth settings.")) {

    return true;

  }



  if (

    /\b(connect|pair|setup|set up)\b.*\b(phone|mobile)\b/.test(normalized) &&

    runDesktopActionFromApp("open_bluetooth_settings", {}, "Opening Bluetooth setup for your phone.")

  ) {

    return true;

  }



  if (

    /\b(phone|mobile)\b.*\b(status|bridge|connected|connection)\b/.test(normalized) &&

    runDesktopActionFromApp("phone_bridge_status", {}, "Checking the Bluetooth phone bridge.")

  ) {

    return true;

  }



  const phoneActionMatch =

    prompt.match(/^(?:tell|ask)\s+(?:my\s+)?phone\s+to\s+(.+)$/i) ||

    prompt.match(/^(?:phone|mobile)\s+(.+)$/i) ||

    prompt.match(/^open\s+(.+)\s+on\s+(?:my\s+)?phone$/i) ||

    prompt.match(/^play\s+(.+)\s+on\s+(?:my\s+)?phone$/i);



  if (phoneActionMatch && runDesktopActionFromApp("phone_bridge_command", { query: phoneActionMatch[1].trim() }, `Sending ${phoneActionMatch[1].trim()} to your phone bridge.`)) {

    return true;

  }



  if (youtubeMatch && runDesktopActionFromApp("play_youtube_result", { query: youtubeMatch[1].trim() }, `Playing ${youtubeMatch[1].trim()} on YouTube.`)) {

    return true;

  }



  const musicMatch =

    prompt.match(/^(?:play|start)\s+(?:some\s+)?(?:music|songs?)$/i) ||

    prompt.match(/^(?:play|start)\s+(.+?\s+(?:music|song))$/i);



  if (musicMatch && runDesktopActionFromApp("play_youtube_result", { query: musicMatch[1]?.trim() || "music" }, "Playing music on YouTube.")) {

    return true;

  }



  if (/\b(open|launch|start)\s+youtube\b(?!\s+music)/.test(normalized) && runDesktopActionFromApp("open_youtube", {}, "Opening YouTube.")) {

    return true;

  }



  if (/\b(open|show|read|get)\b.*\b(news|headlines)\b/.test(normalized) && runDesktopActionFromApp("open_named_site", { site: "news" }, "Opening the latest news.")) {

    return true;

  }



  const siteMatch = prompt.match(/^open\s+(google|maps|drive|docs|wikipedia|chatgpt|spotify|youtube music)$/i);

  if (siteMatch && runDesktopActionFromApp("open_named_site", { site: siteMatch[1].trim().toLowerCase().replace(/\s+/g, "_") }, `Opening ${siteMatch[1].trim()}.`)) {

    return true;

  }



  const googleSearchMatch =

    prompt.match(/^(?:search for|look up|google|search)\s+(.+)$/i) ||

    prompt.match(/^open\s+google\s+and\s+search\s+(.+)$/i);



  if (googleSearchMatch && runDesktopActionFromApp("show_google_results", { query: googleSearchMatch[1].trim() }, `Searching Google for ${googleSearchMatch[1].trim()}.`)) {

    return true;

  }



  const desktopAppMatch = prompt.match(/^open\s+(calculator|notepad|file explorer|explorer|paint|settings|camera|terminal|powershell|command prompt|cmd)$/i);

  if (desktopAppMatch && runDesktopActionFromApp("open_desktop_app", { query: desktopAppMatch[1].trim() }, `Opening ${desktopAppMatch[1].trim()}.`)) {

    return true;

  }



  if (/\b(pause|stop)\b.*\b(music|song|video|media|youtube)\b/.test(normalized) && runDesktopActionFromApp("pause_media", {}, "Pausing media.")) {

    return true;

  }



  if (/\b(resume|continue|play)\b.*\b(music|song|video|media|youtube)\b/.test(normalized) && runDesktopActionFromApp("play_media", {}, "Resuming media.")) {

    return true;

  }



  if (/\b(close|hide)\b.*\b(youtube|music|news|browser|command window)\b/.test(normalized) && runDesktopActionFromApp("close_automation_window", {}, "Closing the assistant browser window.")) {

    return true;

  }



  if (/\bopen whatsapp\b/.test(normalized) && runDesktopActionFromApp("open_whatsapp", {}, "Opening WhatsApp.")) {

    return true;

  }



  if (/\bopen gmail\b/.test(normalized) && runDesktopActionFromApp("open_named_site", { site: "gmail" }, "Opening Gmail.")) {

    return true;

  }



  if (/\bopen downloads\b/.test(normalized) && runDesktopActionFromApp("open_downloads", {}, "Opening Downloads.")) {

    return true;

  }



  if (/\b(take|capture)\b.*\bscreenshot\b/.test(normalized) && runDesktopActionFromApp("capture_window", {}, "Taking a screenshot.")) {

    return true;

  }



  if (

    (/\b(system status|system health|device health|pc health|computer health)\b/.test(normalized) ||

      /\b(check|scan|inspect|test)\b.*\b(system|laptop|computer|pc)\b/.test(normalized)) &&

    runDesktopActionFromApp("system_status", {}, "Checking your system now.")

  ) {

    return true;

  }



  if (normalized.includes("study")) {

    activatePanel("study");

    return true;

  }

  if (normalized.includes("jintendo") || normalized.includes("game")) {

    openJintendoLauncher();

    return true;

  }

  if (normalized.includes("home")) {

    goHome();

    return true;

  }

  if (normalized.includes("dark theme")) {

    if (state.theme !== "dark") {

      toggleTheme();

    }

    return true;

  }

  if (normalized.includes("light theme")) {

    if (state.theme !== "light") {

      toggleTheme();

    }

    return true;

  }

  if (normalized.includes("tired")) {

    setCompanionState({

      mood: "Caring",

      speech: "Would you like to take a short break?",

      status: "Aubit detected fatigue-related language and suggested a restorative pause.",

    });

    return true;

  }



  return false;

}



async function handleVoicePrompt(prompt) {

  if (!prompt || state.voiceBusy) {

    return;

  }



  state.voiceBusy = true;

  setSpeechBubbleText(`You said: ${prompt}`);



  try {

    const aiResult = await requestAIResponse(

      prompt,

      {

        mode: "desktop_shell",

        topic: "trusted companion conversation",

        response_style: "realtime_conversation",

        answer_depth: "instant_phrase",

        latency_priority: "ultra_fast",

        speaking_instruction: "Answer only in natural English. Reply in 4 to 10 words for normal chat. Use one short sentence.",

        voice_delivery: "browser_instant",

      },

      false,

    );

    setCompanionState({

      mood: "Responsive",

      speech: aiResult.text,

      status: "Aubit answered a spoken prompt through the backend AI brain.",

      voicePreview: aiResult.voicePreview,

      forceSpeak: true,

    });

  } catch (error) {

    state.lastBackendError = error instanceof Error ? error.message : String(error || "Unknown backend error");

    if (state.currentPanel === "study") {

      renderBackendUnavailableBoard("Study Board", state.studyDraft || prompt);

    }

    setCompanionState({

      mood: "Fallback",

      speech: `I could not reach the backend AI right now. ${state.lastBackendError}`,

      status: `Voice prompt failed because the backend AI request did not complete. ${state.lastBackendError}`,

      forceSpeak: true,

    });

  } finally {

    state.voiceBusy = false;

    state.voiceWakeActive = false;

  }

}



function renderGamesBoard() {

  state.activeGame = "";

  syncPanelPresentation();

  updateBoardChrome("Jintendo Games", false);

  setBoardContentLayout();

  const featuredGame = jintendoGames[state.jintendoSelectedIndex] || jintendoGames[0];

  const gameTiles = jintendoGames

    .map((game, index) => `

      <button

        class="jintendo-game-card${game.id === featuredGame.id ? " featured" : ""}"

        type="button"

        data-game="${game.id}"

        style="--game-accent: ${game.accent}; --game-index: ${index};"

        aria-label="Play ${game.title}"

        aria-current="${game.id === featuredGame.id ? "true" : "false"}"

        tabindex="${game.id === featuredGame.id ? "0" : "-1"}"

      >

        <span class="jintendo-game-art">

          <img src="${game.icon}" alt="" />

        </span>

        <span class="jintendo-game-text">

          <span class="jintendo-game-kicker">${game.kicker}</span>

          <strong>${game.title}</strong>

        </span>

        <span class="jintendo-game-status">${game.status}</span>

      </button>

    `)

    .join("");



  replaceBoardContent(`

    <div class="games-board jintendo-board">

      <div class="jintendo-hero">

        <div class="jintendo-brand">

          <span class="jintendo-console-mark">J</span>

          <span>

            <span class="jintendo-kicker">Aubit Game Emulator</span>

            <strong>Jintendo Games</strong>

          </span>

        </div>

        <div class="jintendo-feature" style="--game-accent: ${featuredGame.accent};">

          <span class="jintendo-feature-label" data-jintendo-feature-label>${featuredGame.kicker} / ${featuredGame.status}</span>

          <h3 data-jintendo-feature-title>${featuredGame.title}</h3>

          <p data-jintendo-feature-description>${featuredGame.description}</p>

          <button class="jintendo-play-button" type="button" data-jintendo-play data-game="${featuredGame.id}" aria-label="Play ${featuredGame.title}">

            Play Now

          </button>

        </div>

      </div>

      <div class="jintendo-controls" aria-label="Slide Jintendo games">

        <button class="jintendo-nav-button" type="button" data-jintendo-scroll="-1" aria-label="Previous games">&lt;</button>

        <span>Carousel / Snap Select</span>

        <button class="jintendo-nav-button" type="button" data-jintendo-scroll="1" aria-label="Next games">&gt;</button>

      </div>

      <div class="jintendo-carousel" aria-label="Jintendo game selection" tabindex="0">

        ${gameTiles}

      </div>

    </div>

  `);

  installJintendoCarouselRuntime();

  autoScrollStudyBoard();

}



function renderEmbeddedGame(game) {

  const gameConfig = {

    sudoku: {

      title: "Sudoku",

      src: "./sudoku.html?embed=1",

    },

    "snake-ladder": {

      title: "Snake and Ladder",

      src: "./snake-and-ladder.html?embed=1",

    },

    chess: {

      title: "Aubit Chess",

      src: "./chess.html?embed=1",

    },

    monopoly: {

      title: "Aubit Streets",

      src: "./monopoly.html?embed=1",

    },

    maze: {

      title: "Neon Maze DX",

      src: "./maze.html?embed=1",

    },

    "red-bounce": {

      title: "Red Bounce DX",

      src: "./red-bounce.html?embed=1",

    },

    "subway-sprint": {

      title: "Subway Sprint",

      src: "./subway-sprint.html?embed=1",

    },

  }[game];



  if (!gameConfig) {

    return;

  }



  state.activeGame = game;

  syncPanelPresentation();

  updateBoardChrome(gameConfig.title, false);

  setBoardContentLayout("game-embed");

  replaceBoardContent(`

    <div class="game-embed-card">

      <iframe

        class="game-embed-frame"

        src="${gameConfig.src}"

        title="${gameConfig.title}"

        loading="lazy"

      ></iframe>

    </div>

  `);

  autoScrollStudyBoard();

}



window.addEventListener("message", (event) => {

  const isLocalFileMessage = event.origin === "null" && window.location.protocol === "file:";

  if (!isLocalFileMessage && event.origin !== window.location.origin) {

    return;

  }



  const payload = event.data;

  if (!payload || typeof payload !== "object") {

    return;

  }



  if (payload.type === "aubit-game-action" && payload.action === "back-to-game-hub") {

    renderGamesBoard();

    gameToolButtons?.querySelectorAll("[data-game]").forEach((button) => {

      button.classList.remove("active");

    });

    setCompanionState({

      speech: "Returning to the game hub.",

      reward: { coins: 1, gp: 5 },

    });

    return;

  }



  if (payload.type === "aubit-game-action" && payload.action === "game-reward") {

    const gp = Number.parseInt(payload.gp ?? payload.points ?? payload.score ?? "0", 10);

    if (Number.isFinite(gp) && gp > 0) {

      updateRewards({ gp });

    }

  }

});



function updateBoard(topicKey) {

  const topic = boardTopics[topicKey];

  if (!topic) return;



  if (topicKey === "study") {

    renderStudyTopicPrompt();

    return;

  }



  if (topicKey === "games") {

    renderGamesBoard();

    return;

  }



  if (topicKey === "creator") {

    renderCreatorInfoBoard();

    return;

  }



  if (topicKey === "model3d") {

    renderTextTo3DBoard();

    if (state.model3dConfigured === null) refreshTextTo3DConfig();

    return;

  }



  replaceBoardContent(`

    <h3>${topic.title}</h3>

    <p>${topic.copy}</p>

  `);

}



function applyTheme(theme) {

  state.theme = theme;

  appShell.dataset.theme = theme;

  focusLampButton.classList.toggle("theme-on", theme === "dark");

  applyRoomBackdrop();

}



function launchGame(game) {

  if (!game) return;



  const url = gameLinks[game];

  if (url) {

    if (url.startsWith("./")) {

      window.location.href = url;

      return;

    }

    window.open(url, "_blank", "noopener,noreferrer");

  }

}



function shouldShowBoard(panel) {

  return panel === "study" || panel === "creator" || panel === "games";

}



function syncPanelPresentation() {

  if (state.currentPanel !== "model3d") window.Aubit3DStudio.close();

  const showBoard = shouldShowBoard(state.currentPanel);

  appShell.dataset.panel = state.currentPanel || "default";

  studyBoard.dataset.boardMode = state.activeGame ? "game-player" : state.currentPanel || "default";

  studyBoard.classList.toggle("is-hidden", !showBoard);

  if (!showBoard) {

    stopStudyDiagramRenderer();

  }

  companionStage.classList.toggle("panel-focus", showBoard);

  companionStage.classList.toggle("game-player", state.currentPanel === "games" && Boolean(state.activeGame));

  customizeToolButtons?.classList.toggle("is-hidden", state.currentPanel !== "customize");

  gameToolButtons?.classList.toggle("is-hidden", state.currentPanel !== "games");

  if (state.currentPanel !== "customize") {

    setCustomizeMenu(false);

  }

  if (state.currentPanel !== "games") {

    setGameMenu(false);

  }

}



function toggleTheme() {

  const nextTheme = state.theme === "light" ? "dark" : "light";

  applyTheme(nextTheme);

  setCompanionState({

    speech:

      nextTheme === "dark"

        ? "Dark theme enabled. I have dimmed the room for a calmer focus mode."

        : "Light theme enabled. The room is bright again.",

  });

}



function activatePanel(target) {

  const requestedTarget = target;

  const previousPanel = state.currentPanel;

  const isToggleOff = requestedTarget === state.currentPanel;

  const nextPanel = isToggleOff ? "" : requestedTarget;



  setRobotMenu(false);

  state.currentPanel = nextPanel;

  if (nextPanel !== "games") {

    state.activeGame = "";

  }

  applyRoomBackdrop();

  document.querySelectorAll(".panel-card").forEach((card) => {

    card.classList.toggle("active", card.dataset.panel === nextPanel);

  });

  syncPanelPresentation();



  if (nextPanel) {

    updateBoard(nextPanel);

  } else {

    renderDefaultBoard();

  }



  const companionLines = {

    study: "Tell me the topic you want to study today. I can explain it with visuals and step-by-step guidance.",

    games: "Let us play something light and rewarding. Sudoku, Snake and Ladder, Chess, or Monopoly?",

    customize: "choose an outfit for me to look better",

    creator: "This creator info board can help you shape ideas, scripts, and launch steps more clearly.",

    model3d: "Describe an object and I will help you turn it into a 3D model.",

    settings: "You can keep me as a voice assistant or open the full companion world.",

  };



  if (nextPanel) {

    setCompanionState({

      mood: nextPanel === "games" ? "Bright Companion" : "Calm Mentor",

      speech: companionLines[nextPanel],

      status: `Aubit switched to ${nextPanel} mode and updated the room behavior profile.`,

    });

  } else {

    setCompanionState({

      speech: "Panel closed. I am back in the default room position.",

    });

  }



  syncVoiceModeForPanel(previousPanel);

}



function triggerIntro(forceOpen = false) {

  introOverlay.classList.add("active");

  introOverlay.hidden = false;

  if (forceOpen) {

    introCaption.classList.remove("is-hidden");

    clickHint.textContent = `Tap the pod to open ${getRobotProfile().name}`;

  }

}



function closeIntro() {

  introOverlay.classList.remove("active");

  introOverlay.hidden = true;

}



function openPhotoViewer(sourceImage) {

  if (sourceImage?.src && photoViewerImage) {

    photoViewerImage.src = sourceImage.src;

  }



  if (photoViewerImage) {

    const altBase = sourceImage?.alt || "Aubit image";

    photoViewerImage.alt = `${altBase} enlarged view`;

  }



  photoViewer?.classList.add("open");

}



function closePhotoViewer() {

  photoViewer?.classList.remove("open");

}



function backToHomeFromPhotoViewer() {

  closePhotoViewer();

  if (state.currentPanel) {

    goHome();

  }

}



function goHome() {

  closeIntro();

  activatePanel("");

}



function openPod() {

  closeIntro();

  state.introPlayed = true;

  setPodEntryPending(false);

  state.authUnlocked = true;

  document.body.classList.remove("auth-locked");

  entryAuthOverlay?.classList.add("is-hidden");

  activatePanel("");

  setCompanionState({

    mood: "Awake and Caring",

    speech: buildCompanionGreeting(),

    status: "Aubit opened directly into the main companion experience.",

    reward: { stars: 2 },

  });

}



function initVoiceRecognition() {

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {

    setCompanionState({

      mood: "Listening Unavailable",

      speech: "Voice recognition is not available in this browser. Click the buttons to explore the experience.",

      status: "SpeechRecognition API was not found. The UI remains functional without live voice input.",

      forceSpeak: true,

    });

    return null;

  }



  const recognition = new SpeechRecognition();

  recognition.lang = "en-US";

  recognition.continuous = true;

  recognition.interimResults = true;



  recognition.onresult = async (event) => {

    if (state.voiceInputMode === "study") {

      const input = getStudyTopicInput();

      if (!input) {

        state.voiceInputMode = "";

        return;

      }



      let transcript = "";

      for (let index = 0; index < event.results.length; index += 1) {

        transcript += `${event.results[index][0].transcript} `;

      }



      input.value = transcript.trim();

      state.studyDraft = input.value;

      setSpeechBubbleText(`Study topic: ${state.studyDraft || "listening..."}`);



      const latestResult = event.results[event.results.length - 1];

      if (latestResult?.isFinal) {

        state.voiceInputMode = "";

        try {

          recognition.stop();

        } catch (_error) {

        }

        await handleStudyVoiceTranscript(state.studyDraft);

      }

      return;

    }



    for (let index = event.resultIndex; index < event.results.length; index += 1) {

      const result = event.results[index];

      const transcript = result[0].transcript.trim();



      if (!transcript || !result.isFinal) {

        continue;

      }



      const normalized = transcript.toLowerCase();

      if (normalized.includes("hello aubit")) {

        const inlinePrompt = extractPromptAfterWakePhrase(transcript);

        state.voiceWakeActive = true;

        setCompanionState({

          mood: "Attentive",

          speech: inlinePrompt ? `I heard you. Working on ${inlinePrompt}.` : "I am listening. Tell me what you need.",

          status: "Wake phrase detected. Aubit is now in active listening mode.",

          forceSpeak: true,

        });



        if (inlinePrompt) {

          if (!handleVoiceCommand(inlinePrompt)) {

            await handleVoicePrompt(inlinePrompt);

          } else {

            state.voiceWakeActive = false;

          }

        }

        continue;

      }



      if (!state.voiceWakeActive) {

        continue;

      }



      if (!handleVoiceCommand(transcript)) {

        await handleVoicePrompt(transcript);

      } else {

        state.voiceWakeActive = false;

      }

    }

  };



  recognition.onerror = () => {

  };



  recognition.onend = () => {

    if (state.voiceInputMode === "study") {

      state.voiceInputMode = "";

      return;

    }



    state.voiceWakeActive = false;

  };



  return recognition;

}



function startListening(options = {}) {

  if (!state.recognition) {

    state.recognition = initVoiceRecognition();

  }



  if (!state.recognition) return;



  const target = options.target || "";

  const announce = options.announce !== false;

  const isStudyTarget = target === "study";



  state.voiceInputMode = target;

  state.recognition.continuous = isStudyTarget ? false : true;

  state.recognition.interimResults = true;



  try {

    state.recognition.start();

    if (announce) {

      setAvatarExpressionVariant("curious", { duration: 2000, allowWhileLocked: true });

      setCompanionState({

        mood: "Listening",

        speech: isStudyTarget

          ? "Listening for your study topic."

          : "Aubit is listening in the background.",

        status: isStudyTarget

          ? "Microphone session started for study topic dictation."

          : "Microphone session started. Aubit is waiting for the wake phrase.",

        forceSpeak: !isStudyTarget || options.forceSpeak === true,

      });

    } else {

      setSpeechBubbleText(

        isStudyTarget

          ? "Voice study mode is ready. Say your topic or use the mic button."

          : "Aubit is listening in the background.",

      );

    }

  } catch (_error) {

    try {

      state.recognition.stop();

    } catch (_innerError) {

    }

    window.setTimeout(() => {

      try {

        state.recognition.start();

      } catch (_finalError) {

        speak("Voice input is already active.");

      }

    }, 120);

  }

}



function clearIdleTimers() {

  window.clearTimeout(state.idleTimer);

  window.clearTimeout(state.sleepTimer);

  state.idleTimer = null;

  state.sleepTimer = null;

}



function clearWakeSequenceTimers() {

  window.clearTimeout(state.wakeStageTimer);

  window.clearTimeout(state.wakeCompleteTimer);

  state.wakeStageTimer = null;

  state.wakeCompleteTimer = null;

}



function clearAvatarMotionTimers() {

  window.clearTimeout(state.avatarMoveTimer);

  window.clearTimeout(state.avatarActionTimer);

  state.avatarMoveTimer = null;

  state.avatarActionTimer = null;

}



function clearAvatarExpressionTimer() {

  window.clearTimeout(state.avatarExpressionTimer);

  state.avatarExpressionTimer = null;

}



function resolveBaseAvatarExpression() {

  if (state.avatarState === "sleeping") {

    return "sleepy";

  }



  if (state.avatarState === "waking" || state.avatarState === "looking-around") {

    return "curious";

  }



  if (state.avatarState === "idle") {

    return "calm";

  }



  return "neutral";

}



function syncAvatarExpression() {

  const expression = state.avatarExpression || resolveBaseAvatarExpression();

  [aubitAvatar, introAubit].filter(Boolean).forEach((avatar) => {

    avatar.dataset.expression = expression;

  });

}



function setAvatarExpressionVariant(nextExpression = resolveBaseAvatarExpression(), options = {}) {

  const overlayActive = introOverlay?.classList.contains("active");

  if (!options.allowWhileLocked && !state.authUnlocked && !overlayActive) {

    return;

  }



  clearAvatarExpressionTimer();

  state.avatarExpression = nextExpression || resolveBaseAvatarExpression();

  syncAvatarExpression();



  if (options.duration) {

    state.avatarExpressionTimer = window.setTimeout(() => {

      state.avatarExpressionTimer = null;

      state.avatarExpression = resolveBaseAvatarExpression();

      syncAvatarExpression();

    }, options.duration);

  }

}



function applyAvatarRoomPosition() {

  if (!aubitPlatform) {

    return;

  }



  aubitPlatform.style.setProperty("--aubit-room-x", `${state.avatarPositionX}px`);

  aubitPlatform.style.setProperty("--aubit-room-y", `${state.avatarPositionY}px`);

}



function syncAvatarMotionState() {

  if (!aubitPlatform) {

    return;

  }



  aubitPlatform.classList.toggle("is-walking", state.avatarMoving);

  aubitPlatform.classList.toggle("is-sitting", state.avatarAction === "sit");

  aubitPlatform.classList.toggle("is-waving", state.avatarAction === "wave");

}



function setAvatarPose(action = "stand", options = {}) {

  if (

    !state.authUnlocked &&

    options.requireUnlock !== false

  ) {

    return;

  }



  const nextAction = action === "sit" ? "sit" : action === "wave" ? "wave" : "stand";

  clearAvatarMotionTimers();

  state.avatarMoving = false;

  state.avatarAction = nextAction;

  if (state.avatarState === "idle") {

    setAvatarExpressionState("awake");

  }

  if (aubitPlatform) {

    aubitPlatform.style.setProperty("--aubit-move-duration", "620ms");

  }

  syncAvatarMotionState();

  resetPointerTracking();



  if (options.announce !== false) {

    const robotName = getRobotProfile().name;

    if (nextAction === "sit") {

      setSpeechBubbleText(`${robotName} is sitting down now.`);

    } else if (nextAction === "wave") {

      setSpeechBubbleText(`${robotName} is waving hello.`);

    } else {

      setSpeechBubbleText(`${robotName} is standing by.`);

    }

  }



  if (nextAction === "wave") {

    state.avatarActionTimer = window.setTimeout(() => {

      state.avatarAction = "stand";

      syncAvatarMotionState();

      setIdleBehavior();

    }, 1800);

  } else {

    setIdleBehavior();

  }

}



function setAvatarExpressionState(nextState = "awake") {

  state.avatarState = nextState;

  [aubitAvatar, introAubit].filter(Boolean).forEach((avatar) => {

    avatar.classList.toggle("is-idle", nextState === "idle");

    avatar.classList.toggle("is-sleeping", nextState === "sleeping");

    avatar.classList.toggle("is-waking", nextState === "waking");

    avatar.classList.toggle("is-looking-around", nextState === "looking-around");

  });

  state.avatarExpression = resolveBaseAvatarExpression();

  syncAvatarExpression();

}



function enterSleepMode() {

  if (!state.authUnlocked) {

    return;

  }



  clearIdleTimers();

  clearWakeSequenceTimers();

  clearAvatarMotionTimers();

  state.avatarMoving = false;

  state.avatarAction = "stand";

  syncAvatarMotionState();

  resetPointerTracking();

  setRobotMenu(false);

  setAvatarExpressionState("awake");

  setAvatarExpressionVariant("soft", { duration: 900, allowWhileLocked: true });

  speechBubble.textContent = `${getRobotProfile().name} is awake and ready.`;

}



function startWakeSequence() {

  if (!state.authUnlocked || state.avatarState === "waking" || state.avatarState === "looking-around") {

    return;

  }



  clearIdleTimers();

  clearWakeSequenceTimers();

  clearAvatarMotionTimers();

  state.avatarMoving = false;

  state.avatarAction = "stand";

  syncAvatarMotionState();

  resetPointerTracking();

  setRobotMenu(false);

  setAvatarExpressionState("waking");

  setAvatarExpressionVariant("excited", { duration: 900, allowWhileLocked: true });

  speechBubble.textContent = `${getRobotProfile().name} is waking up...`;



  state.wakeStageTimer = window.setTimeout(() => {

    setAvatarExpressionState("looking-around");

    setAvatarExpressionVariant("curious", { duration: 1200, allowWhileLocked: true });

    speechBubble.textContent = `${getRobotProfile().name} is looking around.`;

  }, 640);



  state.wakeCompleteTimer = window.setTimeout(() => {

    resetPointerTracking();

    setAvatarExpressionState("awake");

    setCompanionState({

      mood: "Awake and Ready",

      speech: buildCompanionGreeting({ listening: true }),

      status: `${getRobotProfile().name} woke up, looked around, and returned to the front.`,

    });

    setIdleBehavior();

  }, 2200);

}



function setIdleBehavior() {

  if (!state.authUnlocked) {

    clearIdleTimers();

    clearWakeSequenceTimers();

    return;

  }



  clearIdleTimers();

  if (state.avatarState === "sleeping" || state.avatarState === "waking" || state.avatarState === "looking-around") {

    return;

  }



  if (state.avatarAction !== "stand" || state.avatarMoving) {

    return;

  }



  setAvatarExpressionState("awake");

  resetPointerTracking();

  state.idleTimer = window.setTimeout(() => {

    if (state.avatarState !== "awake" || state.avatarAction !== "stand" || state.avatarMoving) {

      return;

    }



    setAvatarExpressionState("idle");

    speechBubble.textContent = `${getRobotProfile().name} is quietly on standby.`;

  }, 30000);

}



function trackPointer(event) {

  pointerTrackingRuntime.pointerX = event.clientX;

  pointerTrackingRuntime.pointerY = event.clientY;



  if (pointerTrackingRuntime.rafId) {

    return;

  }



  pointerTrackingRuntime.rafId = window.requestAnimationFrame(() => {

    pointerTrackingRuntime.rafId = 0;

    applyPointerTracking();

  });

}



function applyPointerTracking() {

  if (

    !state.authUnlocked ||

    state.compactMode ||

    document.hidden ||

    introOverlay.classList.contains("active") ||

    state.avatarState === "sleeping" ||

    state.avatarState === "waking" ||

    state.avatarState === "looking-around" ||

    state.avatarAction !== "stand" ||

    state.avatarMoving

  ) {

    return;

  }



  if (!aubitAvatar) return;

  const rect = aubitAvatar.getBoundingClientRect();

  if (!rect.width || !rect.height) {

    return;

  }



  const centerX = rect.left + rect.width / 2;

  const centerY = rect.top + rect.height / 2;

  const deltaX = (pointerTrackingRuntime.pointerX - centerX) / rect.width;

  const deltaY = (pointerTrackingRuntime.pointerY - centerY) / rect.height;

  const rotateY = Math.max(-9, Math.min(9, deltaX * 18));

  const rotateX = Math.max(-6, Math.min(6, deltaY * -14));

  const moveX = Math.max(-12, Math.min(12, deltaX * 24));

  const moveY = Math.max(-10, Math.min(10, deltaY * 20));



  if (aubitAvatar) aubitAvatar.style.transform = `translate3d(${moveX}px, ${moveY}px, 0) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

  speechBubble.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;

}



function resetPointerTracking() {

  if (pointerTrackingRuntime.rafId) {

    window.cancelAnimationFrame(pointerTrackingRuntime.rafId);

    pointerTrackingRuntime.rafId = 0;

  }

  if (aubitAvatar) aubitAvatar.style.transform = "";

  speechBubble.style.transform = "";

}



function handleUserActivity(event) {

  if (event?.type === "mousemove") {

    const now = performance.now();

    if (now - lastIdleRefreshAt < 240) {

      return;

    }

    lastIdleRefreshAt = now;

  } else {

    lastIdleRefreshAt = performance.now();

  }



  setIdleBehavior();

}



introPod.addEventListener("click", openPod);

homePhotoFrame?.addEventListener("click", () => {

  openPhotoViewer(homePhotoFrame.querySelector("img"));

});

photoViewerClose?.addEventListener("click", closePhotoViewer);

photoViewerBack?.addEventListener("click", backToHomeFromPhotoViewer);

photoViewer?.addEventListener("click", (event) => {

  if (event.target === photoViewer) {

    closePhotoViewer();

  }

});



widgetModeToggle.addEventListener("click", () => {

  if (isDesktopShellAvailable) {

    desktopShell.enterWidgetMode();

    return;

  }



  state.compactMode = !state.compactMode;

  appShell.classList.toggle("compact-mode", state.compactMode);

  syncWidgetModeToggleLabel();

  setCompanionState({

    mood: state.compactMode ? "Compact Assistant" : "Immersive Companion",

    speech: state.compactMode

      ? "Voice assistant mode enabled. I will stay lightweight and close to your desktop."

      : "Full world mode enabled. The room and progression systems are now visible.",

    status: state.compactMode

      ? "Aubit is now presented as a compact desktop-style assistant."

      : "Aubit returned to the immersive room view with the full feature stack visible.",

  });

});



document.querySelectorAll(".panel-card").forEach((card) => {

  card.addEventListener("click", () => activatePanel(card.dataset.panel));

});



document.querySelectorAll(".object-card").forEach((card) => {

  card.addEventListener("click", () => {

    const reaction = reactions[card.dataset.reaction];

    if (card.dataset.reaction === "focus") {

      toggleTheme();

    }

    if (reaction) setCompanionState(reaction);

  });

});



aubitAvatar?.addEventListener("click", (event) => {

  event.stopPropagation();

  if (state.avatarState === "sleeping") {

    startWakeSequence();

    return;

  }



  if (state.avatarState === "waking" || state.avatarState === "looking-around") {

    return;

  }



  setIdleBehavior();

  setRobotMenu(!state.robotMenuOpen);

});



robotChoiceMenu?.addEventListener("click", (event) => {

  const variantButton = event.target.closest("[data-robot-variant]");

  if (!variantButton) {

    return;

  }



  const variant = variantButton.dataset.robotVariant || "male";

  if (variant === state.robotVariant) {

    setRobotMenu(false);

    return;

  }



  setRobotVariant(variant);

});



window.addEventListener("click", (event) => {

  if (!state.robotMenuOpen) {

    return;

  }



  if (event.target.closest("#aubitAvatar") || event.target.closest("#robotChoiceMenu")) {

    return;

  }



  setRobotMenu(false);

});



customizeToolButtons?.addEventListener("click", (event) => {

  const toggleButton = event.target.closest("#customizeToolToggle");

  if (toggleButton) {

    setCustomizeMenu(!state.customizeMenuOpen);

    return;

  }



  const branchToggle = event.target.closest("[data-outfit-branch]");

  if (branchToggle) {

    const branch = branchToggle.dataset.outfitBranch || "";

    setOutfitBranch(state.activeOutfitBranch === branch ? "" : branch);

    return;

  }



  const outfitButton = event.target.closest("[data-outfit-style]");

  if (!outfitButton) {

    return;

  }



  const style = outfitButton.dataset.outfitStyle || "default";

  applyOutfitStyle(style);

  setCustomizeMenu(false);

  setCompanionState({

    speech:

      state.robotVariant === "female"

        ? aubiraOutfitImages[style]

          ? aubiraOutfitResponses[style] || "Aubira style applied."

          : `${outfitResponses[style] || "Outfit style saved."} Switch back to Aubit to preview that outfit.`

        : outfitResponses[style] || "Outfit style applied.",

  });

});



gameToolButtons?.addEventListener("click", (event) => {

  const toggleButton = event.target.closest("#gameToolToggle");

  if (toggleButton) {

    openJintendoLauncher({ showIconMenu: false });

    return;

  }



  const gameButton = event.target.closest("[data-game]");

  if (!gameButton) {

    return;

  }



  const game = gameButton.dataset.game;

  if (!game) {

    return;

  }



  setGameMenu(false);

  renderEmbeddedGame(game);

  gameToolButtons?.querySelectorAll("[data-game]").forEach((button) => {

    button.classList.toggle("active", button.dataset.game === game);

  });

  setCompanionState({

    speech: `Opening ${getGameLabel(game)} inside the game hub.`,

    reward: { coins: 3, gp: 25 },

  });

});



boardActionButton.addEventListener("click", async () => {

  await startStudySession("Python");

  setCompanionState({

    mood: "Teaching",

    status: "Aubit started a study-board explanation with backend AI support when available.",

    reward: { coins: 2 },

  });

});



boardContent.addEventListener("click", async (event) => {

  const model3dAction = event.target.closest("[data-model3d-action]");

  if (model3dAction) {

    const action = model3dAction.dataset.model3dAction;

    if (action === "refresh-config") await refreshTextTo3DConfig();

    if (action === "download-glb") await downloadTextTo3D("glb");

    if (action === "download-stl") await downloadTextTo3D("stl");

    return;

  }



  const jintendoScrollButton = event.target.closest("[data-jintendo-scroll]");

  if (jintendoScrollButton) {

    const direction = Number.parseInt(jintendoScrollButton.dataset.jintendoScroll || "0", 10);

    if (direction) {

      const nextIndex = Math.max(0, Math.min(jintendoGames.length - 1, state.jintendoSelectedIndex + direction));

      updateJintendoSelection(jintendoGames[nextIndex]?.id, { scroll: true });

    }

    return;

  }



  const jintendoCard = event.target.closest(".jintendo-game-card");

  const jintendoPlayButton = event.target.closest("[data-jintendo-play]");

  if (jintendoCard && !jintendoPlayButton) {

    updateJintendoSelection(jintendoCard.dataset.game, { scroll: true });

    setCompanionState({

      mood: "Game Selected",

      speech: `${getGameLabel(jintendoCard.dataset.game)} selected. Press Play Now when you are ready.`,

      status: "The Jintendo carousel selection changed.",

    });

    return;

  }



  const studyModeButton = event.target.closest("[data-study-mode]");

  if (studyModeButton) {

    const nextMode = studyModeButton.dataset.studyMode || "study";

    if (!studyModeConfigs[nextMode]) {

      return;

    }



    syncStudyDraft();

    state.studyMode = nextMode;

    renderStudyTopicPrompt();

    setCompanionState({

      speech: `${getStudyModeConfig().label} mode selected.`,

    });

    return;

  }



  const studyAction = event.target.closest("[data-study-action]");

  if (studyAction) {

    if (studyAction.dataset.studyAction === "voice-topic") {

      syncStudyDraft();

      startStudyVoiceCapture();

      return;

    }



    if (studyAction.dataset.studyAction === "draw-visual") {

      const topic = state.currentTopic || state.studyDraft.trim() || "Python";

      const studyData = state.currentStudyData || buildInstantStudyData(topic);

      renderStudyBoard(topic, studyData, {

        mode: state.currentStudyMode || "instant",

        showVisual: true,

      });

      stopSpeechPlayback();

      return;

    }



    if (studyAction.dataset.studyAction === "make-simpler" || studyAction.dataset.studyAction === "give-example") {

      const topic = state.currentTopic || state.studyDraft.trim() || "Python";

      const response = studyAction.dataset.studyAction === "make-simpler"

        ? `Simpler version: ${topic} is one idea we can understand step by step.\n\nThink of it like this: first know what it is, then see one example, then answer one small question.\n\nQuick check: can you say what ${topic} means in your own words?`

        : `Example for ${topic}: imagine one real situation where this idea appears.\n\nLook for what is happening, why it happens, and what changes because of it.\n\nNow try making your own example in one sentence.`;

      const quickData = {

        response,

        voicePreview: null,

        steps: splitResponseIntoSteps(response, topic),

        source: "quick-action",

      };

      renderStudyBoard(topic, quickData, {

        mode: "instant",

        showVisual: state.currentStudyVisualOpen,

      });

      speak(response);

      return;

    }



    if (studyAction.dataset.studyAction === "replay-diagram") {

      replayStudyDiagram();

      stopSpeechPlayback();

      return;

    }



    if (studyAction.dataset.studyAction === "stop-speaking") {

      stopSpeechPlayback();

      setSpeechBubbleText("Stopped. Ask your doubt with the mic when ready.");

      queueStudyVoiceCapture(700);

      return;

    }



    syncStudyDraft();

    const topic = state.studyDraft.trim() || "Python";

    await startStudySession(topic);

    return;

  }



  const gameAction = event.target.closest("[data-game-action]");

  if (gameAction) {

    if (gameAction.dataset.gameAction === "back-hub") {

      renderGamesBoard();

      setCompanionState({

        speech: "Back to the game hub.",

        reward: { coins: 1, gp: 5 },

      });

    }

    return;

  }



  const trigger = event.target.closest(".jintendo-game-card, .jintendo-play-button, .game-tile, .game-action, .level-chip, .game-link");

  if (!trigger) return;



  const game = trigger.dataset.game || trigger.closest(".game-tile")?.dataset.game;

  if (!game) return;



  if (isEmbeddedBoardGame(game) && state.currentPanel === "games") {

    event.preventDefault();

    renderEmbeddedGame(game);

    setCompanionState({

      speech: `Opening ${getGameLabel(game)} inside the game hub.`,

      reward: { coins: 3, gp: 25 },

    });

    return;

  }



  const gameMessages = {

    sudoku: "Launching Sudoku Grid from Jintendo Games. Opening the puzzle board now.",

    "snake-ladder": "Launching Snake & Ladder from Jintendo Games. Setting up a two-player board now.",

    chess: "Launching Aubit Chess from Jintendo Games. Setting up the board now.",

    monopoly: "Launching Aubit Streets from Jintendo Games. Setting up the board now.",

    maze: "Launching Neon Maze DX from Jintendo Games. Powering up the arcade cabinet now.",

    "red-bounce": "Launching Red Bounce DX. Loading the platform challenge now.",

    "subway-sprint": "Launching Subway Sprint. Warming up the train-track runner now.",

  };



  setCompanionState({

    speech: gameMessages[game] || "Preparing the selected game.",

    reward: { coins: 3, gp: 25 },

  });



  event.preventDefault();

  launchGame(game);

});



boardContent.addEventListener("keydown", async (event) => {

  const input = event.target.closest("#studyTopicInput");

  if (!input) {

    return;

  }



  state.studyDraft = input.value;



  if (event.key !== "Enter") {

    return;

  }



  event.preventDefault();

  const topic = input.value.trim() || "Python";

  await startStudySession(topic);

});



boardContent.addEventListener("submit", (event) => {

  event.preventDefault();

  if (event.target.id === "model3dForm") {

    state.model3dPrompt = event.target.elements.prompt.value;

    startTextTo3D();

  }

});



boardContent.addEventListener("input", (event) => {

  if (event.target.id === "model3dPrompt") {

    state.model3dPrompt = event.target.value;

  }

});



window.addEventListener("message", (event) => {

  if (event.data?.type !== "aubit-gamehub-back" || state.currentPanel !== "games") {

    return;

  }



  renderGamesBoard();

  setCompanionState({

    speech: "Back to the game hub.",

    reward: { coins: 1, gp: 5 },

  });

});



window.addEventListener("keydown", (event) => {

  if (event.key === "Escape" && state.robotMenuOpen) {

    setRobotMenu(false);

  }



  if (event.key === "Escape" && photoViewer?.classList.contains("open")) {

    closePhotoViewer();

  }

});



["click", "keydown", "mousemove", "touchstart"].forEach((eventName) => {

  window.addEventListener(eventName, handleUserActivity, { passive: true });

});



window.addEventListener("mousemove", trackPointer, { passive: true });

aubitAvatar?.addEventListener("mouseleave", resetPointerTracking);

companionNameForm?.addEventListener("submit", handlePreferredNameSubmit);

companionNameInput?.addEventListener("input", syncPreferredNameControls);

window.addEventListener("storage", handlePreferredNameStorage);

document.addEventListener("visibilitychange", () => {

  if (document.hidden) {

    resetPointerTracking();

    pauseStudyDiagramRenderer();

    return;

  }



  if (studyDiagramRuntime.spec && document.getElementById("studyDiagramCanvas") && !studyDiagramRuntime.rafId) {

    mountStudyDiagram(studyDiagramRuntime.spec);

  }

});



document.addEventListener("DOMContentLoaded", bootstrapApp, { once: true });

window.addEventListener("load", bootstrapApp, { once: true });
