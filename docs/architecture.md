# Aubit Desktop Architecture

## Product Modes

1. Desktop widget mode
   A small always-available Aubit face window that sits above the desktop, supports wake phrase detection, shows transcription, and opens the full experience.
2. Immersive app mode
   A full companion environment similar to a virtual house, with study, test, games, care interactions, cosmetics, and progression.

## Recommended Stack

- Shell: Electron for Windows widget windowing and `.exe` packaging
- UI: HTML/CSS/JavaScript or React inside Electron renderer
- Realtime voice:
  - Wake phrase service: `hello Aubit`
  - Streaming STT: Whisper or Azure Speech
  - TTS: OpenAI TTS, Azure Neural Voice, or ElevenLabs with a warm assistant voice profile
- AI orchestration:
  - Conversation agent
  - Tutor agent
  - Test generator and evaluator
  - Game event narrator
- Persistence:
  - SQLite for local profile, coins, stars, unlocked items, and room evolution
  - Optional cloud sync for memory and cross-device history
- 3D / animation:
  - CSS 3D for lightweight scenes
  - Three.js for future character rigging, eye tracking, and richer room interactions

## System Modules

### 1. Widget Shell

- Transparent frameless window
- Click to open immersive app
- Always-on-top option
- Quick actions: listen, mute, study, hide

### 2. Voice Layer

- Passive wake listening
- Active capture after wake phrase
- Live transcript stream
- TTS output queue with interruption support

### 3. Companion Brain

- Intent router
- Emotion state model
- Safety policy layer
- Long-term memory for preferences and routines

### 4. World Simulation

- Room state
- Weather state
- Season and festival overlays
- Unlockable decorations, rooms, pets, trophies

### 5. Learning Engine

- Subject explainer
- Board renderer
- Question generator
- Test scoring and mastery tracking

### 6. Games Layer

- Chess engine integration
- Arcade minigames
- Reward economy feed back into room progression

## Evolution Roadmap

### Phase 1

- Single-room lobby
- Widget launcher
- Intro pod animation
- Study/test/customize/settings prototype

### Phase 2

- Real speech-to-text and text-to-speech
- AI backend integration
- Persistent local profile
- Outfit inventory and store

### Phase 3

- Chess, memory, puzzle, Flappy Aubit, Aubit Run
- Garden, rooftop, and garage rooms
- Dynamic weather and calendar-based festivals

### Phase 4

- Advanced memory
- Emotional adaptation
- Full 3D character rig
- Cross-device sync and account system

## User Flow

1. User sees Aubit widget on desktop.
2. User clicks widget or says `hello Aubit`.
3. Aubit wakes, listens, and shows live transcript.
4. Aubit answers in voice and decides whether to remain in widget mode or open immersive mode.
5. User studies, tests, plays, or customizes.
6. Coins and stars unlock upgrades, outfits, and room changes.

## Packaging To `.exe`

To turn this into a Windows `.exe`:

1. Wrap the current frontend in Electron.
2. Add `electron-builder`.
3. Create two BrowserWindows:
   - widget window
   - immersive main window
4. Add preload APIs for microphone, tray, notifications, and persistence.
5. Build on Windows with:

```bash
npm run dist
```

The current workspace does not yet contain Electron dependencies or a Windows build environment, so the `.exe` itself is not produced in this session.
