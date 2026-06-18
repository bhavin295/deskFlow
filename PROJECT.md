# DeskFlow — Project Documentation

Single reference for architecture, setup, system behavior, and everything built in this app.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Architecture](#architecture)
5. [How the System Works](#how-the-system-works)
6. [DeskQ Integration](#deskq-integration)
7. [Setup & Installation](#setup--installation)
8. [Running the App](#running-the-app)
9. [Configuration](#configuration)
10. [Features & UI](#features--ui)
11. [State Management](#state-management)
12. [Electron Desktop Layer](#electron-desktop-layer)
13. [Development Tools](#development-tools)
14. [Building for Production](#building-for-production)
15. [Key Files Reference](#key-files-reference)

---

## Overview

**DeskFlow** (package name: `tracker-alert`) is a productivity companion that runs **11-minute focus cycles** aligned with **DeskQ Agent** screenshot intervals.

| Property | Value |
|---|---|
| Product name | DeskFlow |
| Package name | `tracker-alert` |
| App ID (Electron) | `com.tracker.alert` |
| Default alert interval | 11 minutes |
| Alert countdown | 3 → 2 → 1 seconds |
| Primary platforms | Web (Next.js) + Desktop (Electron) |

### What it does

1. Counts elapsed time during a focus session in **11-minute cycles**.
2. At each interval, shows a **3-second countdown alert** (full-screen overlay).
3. After the countdown, enters **"Awaiting DeskQ"** — waiting for DeskQ Agent to take a screenshot.
4. When DeskQ captures a screenshot (or the user starts/stops tracking in DeskQ), the session **syncs automatically**.
5. Provides a **Break Hub** with mini-games and wellness tools during breaks.

### Two run modes

| Mode | Timer runs in | DeskQ sync | Overlay |
|---|---|---|---|
| **Browser** (`npm run dev`) | React (`useTrackerTimer`) | No | In-app React overlay |
| **Electron** (`npm run electron:dev`) | Main process (`TimerService`) | Yes | System-wide transparent overlay |

In Electron, the main process owns the timer so it keeps running even when the window is hidden (stealth mode).

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI framework | Next.js 16 (App Router) |
| UI library | React 19 |
| Language | TypeScript + CommonJS (Electron) |
| Styling | Tailwind CSS v4 |
| Desktop shell | Electron 34 |
| Desktop packaging | electron-builder |
| Dev orchestration | concurrently, wait-on, cross-env |

---

## Project Structure

```
tracker-alert/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout, fonts, metadata
│   ├── page.tsx            # Main home screen
│   ├── providers.tsx       # TrackerProvider wrapper
│   └── globals.css         # All styles, animations, iPhone shell theme
│
├── components/             # React UI
│   ├── games/              # Snake, Memory, Reaction
│   ├── wellness/           # Breathing, Eye Rest, Stretch
│   ├── svg/                # Icons and logos
│   ├── IPhoneShell.tsx     # iPhone frame + layout shell
│   ├── TimerPanel.tsx      # Circular progress timer
│   ├── StatusCard.tsx      # Session status banner
│   ├── ActionBar.tsx       # Stop / Reset when active; DeskQ sync strip when idle
│   ├── DeskQSyncStrip.tsx  # Passive DeskQ waiting indicator (Option B)
│   ├── StatsBar.tsx        # Interval, countdown, next-in, cycle %
│   ├── BreakHub.tsx        # Games & wellness drawer
│   ├── CountdownOverlay.tsx# Browser-only alert overlay
│   └── ...
│
├── context/
│   └── TrackerContext.tsx  # Global timer state provider
│
├── hooks/
│   ├── useTrackerTimer.ts  # Timer logic (browser + Electron bridge)
│   └── useElectronBridge.ts# Electron-only helpers (tray, always-on-top)
│
├── types/
│   ├── tracker.ts          # Timer types and constants
│   └── electron.d.ts       # window.electronAPI typings
│
├── config/
│   └── timer.json          # COUNTDOWN_START, ALERT_INTERVAL_MINUTES
│
├── desktop/                # Electron main process
│   ├── main.cjs            # App entry, window, IPC, stealth
│   ├── preload.cjs         # contextBridge → window.electronAPI
│   ├── timer-service.cjs   # Authoritative timer in main process
│   ├── overlay.cjs         # System-wide countdown overlay window
│   ├── overlay.html        # Overlay UI (3→1 countdown)
│   ├── tray.cjs            # Menu bar / system tray
│   └── services/
│       ├── background-service.cjs   # DeskQ event routing
│       ├── deskq-agent-watcher.cjs  # SQLite + filesystem watcher
│       └── desq-watcher.cjs         # Log-file tail watcher
│
├── public/                 # Static assets (backgrounds, icons)
├── .env.example            # Environment variable template
└── package.json            # Scripts, dependencies, electron-builder config
```

### Orphan files (not used at runtime)

These files at the project root are **compiled artifacts from DeskQ Agent** and are **not imported** by DeskFlow:

- `trackingManager.js`
- `sessionManager.js`
- `screenshotPaths.js`

They can be ignored or removed; the active timer logic lives in `desktop/timer-service.cjs` and `hooks/useTrackerTimer.ts`.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Electron Main Process                     │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │ TimerService │  │ Background   │  │ System Overlay Window │  │
│  │ (11-min tick)│◄─┤ Service      │  │ (3→1 countdown)       │  │
│  └──────┬───────┘  │ (DeskQ sync) │  └───────────────────────┘  │
│         │          └──────┬───────┘                               │
│         │                 │                                       │
│         │          ┌──────▼───────┐                               │
│         │          │ DeskQ Watcher│                               │
│         │          │ (agent / log)│                               │
│         │          └──────────────┘                               │
│         │ IPC (preload.cjs)                                       │
└─────────┼─────────────────────────────────────────────────────────┘
          │
┌─────────▼─────────────────────────────────────────────────────────┐
│                     Next.js Renderer (React)                       │
│  TrackerProvider → useTrackerTimer → UI Components                 │
│  (IPhoneShell, TimerPanel, StatusCard, BreakHub, ...)            │
└───────────────────────────────────────────────────────────────────┘
          ▲
          │ HTTP (localhost:3000)
          │
┌─────────┴─────────┐
│  DeskQ Agent      │  ← SQLite queue.db, screenshots/, heartbeats
│  (external app)   │
└───────────────────┘
```

### Data flow (Electron)

1. **TimerService** ticks every second in the main process.
2. State is broadcast via IPC (`timer:state`) to the React UI.
3. **BackgroundService** watches DeskQ and calls timer methods (`restartAfterScreenshot`, `onDesqTimerStart`, `onDesqTimerStop`).
4. On alert, **overlay.cjs** shows a full-screen transparent window with the countdown.
5. **Stealth mode** hides the main window while a session is engaged and running.

---

## How the System Works

### Timer states

| State | Meaning |
|---|---|
| `stopped` | No active session |
| `running` | Counting elapsed seconds toward next 11-min alert |
| `alert` | 3-second countdown is active |

### Session lifecycle

```
[Stopped / Waiting]
       │
       │ DeskQ timer starts (auto-sync)
       ▼
   [Running] ──── counts 0 → 660 seconds (11 min)
       │
       │ elapsed % 660 === 0
       ▼
   [Alert] ──── 3 → 2 → 1 countdown overlay
       │
       │ countdown reaches 0
       ▼
[Awaiting DeskQ] ──── elapsed reset to 0, waiting for screenshot
       │
       │ DeskQ screenshot detected
       ▼
   [Running] ──── fresh 11-min cycle from 0
```

### Status labels (UI)

| Label | When shown |
|---|---|
| **Waiting** | Timer stopped, not engaged |
| **Running** | Active session, counting time |
| **Alert Active** | Countdown overlay visible |
| **Awaiting DeskQ** | Countdown finished; waiting for DeskQ screenshot |

### Stealth mode (Electron only)

When `engaged` is true and the session is `running`, `alert`, or `awaitingScreenshot`:

- Main window is **hidden**
- Dock icon is hidden (macOS)
- **Content protection** is enabled (screen capture protection)
- Timer continues in the main process
- System overlay still shows the 3→1 countdown

Closing the window minimizes to tray instead of quitting.

---

## DeskQ Integration

DeskFlow syncs with **DeskQ Agent** so its timer aligns with DeskQ's screenshot schedule.

### Integration modes

#### 1. Agent mode (default)

Auto-discovers DeskQ Agent data on macOS:

```
~/Library/Application Support/deskq-agent/users/<userId>/queue.db
```

**Watches:**

- `heartbeat_draft.last_tick_ms` — detects if DeskQ tracking is active (tick within 45s)
- `screenshots_queue.captured_at` — new screenshot events
- `tracking_stop_events.stopped_at` — timer stop events
- `screenshots/` directory — filesystem watch for new `.jpg` files

Override path with `DESQ_AGENT_DB_PATH`.

#### 2. Log mode

Set `DESQ_LOG_PATH` to tail a text log file. Uses regex patterns to detect screenshot, start, and stop events.

### DeskQ event → timer action

| Event | Timer action |
|---|---|
| Screenshot detected | `restartAfterScreenshot()` — fresh 11-min cycle |
| DeskQ timer started | `onDesqTimerStart()` — start from 0 |
| DeskQ timer stopped | `onDesqTimerStop()` — full reset |
| DeskQ tracking active on startup | Auto-sync: start DeskFlow session |
| DeskQ tracking inactive while running | Auto-sync: stop DeskFlow session |

### Pattern configuration

Custom regex patterns via environment variables (see [Configuration](#configuration)):

- `DESQ_START_PATTERNS` — lines that mean "timer started"
- `DESQ_STOP_PATTERNS` — lines that mean "timer stopped"
- `DESQ_MATCH_PATTERNS` — extra lines to watch (log mode)

---

## Setup & Installation

### Prerequisites

- **Node.js** 20+
- **npm** (or yarn/pnpm/bun)
- **DeskQ Agent** installed (for full integration; optional for UI-only dev)
- **macOS** recommended for agent-mode auto-discovery (Windows supported for Electron build)

### Install

```bash
cd tracker-alert
npm install
```

### Environment setup

```bash
cp .env.example .env.local
```

Edit `.env.local` as needed (see [Configuration](#configuration)). For most local dev with DeskQ Agent on macOS, no env vars are required — agent mode auto-discovers the database.

---

## Running the App

### Web only (browser)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- Timer runs in the browser via `localStorage` persistence
- No DeskQ integration
- In-app countdown overlay (not system-wide)

### Electron (recommended full experience)

```bash
npm run electron:dev
```

This runs:

1. `next dev` on port 3000
2. Waits for the server, then launches Electron loading `ELECTRON_APP_URL`

Electron features enabled: main-process timer, DeskQ sync, system overlay, tray, stealth mode.

### Production web server

```bash
npm run build
npm start
```

### Lint

```bash
npm run lint
```

---

## Configuration

### `config/timer.json`

Central timer constants (shared by TypeScript and Electron):

```json
{
  "COUNTDOWN_START": 3,
  "ALERT_INTERVAL_MINUTES": 11
}
```

Imported in `types/tracker.ts` as `ALERT_INTERVAL_SECONDS` and `COUNTDOWN_START`.

### Environment variables (`.env.local`)

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | Next.js dev server port |
| `ELECTRON_APP_URL` | `http://localhost:3000` | URL Electron loads |
| `DESQ_LOG_PATH` | — | Enable log-file watcher mode |
| `DESQ_AGENT_DB_PATH` | auto-discover | Override DeskQ SQLite path |
| `DESQ_MATCH_PATTERNS` | screenshot, desq, deskq | Extra log patterns (comma-separated regex) |
| `DESQ_START_PATTERNS` | timer started, session started, … | Start-event patterns |
| `DESQ_STOP_PATTERNS` | timer stopped, session ended, … | Stop-event patterns |
| `DESKFLOW_KEEP_ALIVE_INTERVAL_MS` | `600000` (10 min) | Cursor nudge interval when idle — tuned for DeskQ ~15 min auto-stop |
| `DESKFLOW_KEEP_ALIVE_IDLE_THRESHOLD_S` | `30` | Only nudge if system idle at least this long |

Electron main process loads `.env.local` and `.env` from the project root on startup.

---

## Features & UI

### iPhone-style shell

The entire app is rendered inside an **iPhone 15 Pro–style frame** (393×852 px in Electron):

| Component | Role |
|---|---|
| `IPhoneShell` | Outer chassis, coordinates layout |
| `IPhoneHardware` | Side buttons, frame bezels |
| `IPhoneStatusBar` | Live clock, signal/wifi/battery icons |
| `IPhoneDock` | Bottom dock with Break Hub, keep-alive, and theme toggle |
| `AnimatedBackground` | Themed gradient / robot backgrounds |
| `AppBrand` | DeskFlow logo and tagline |

### Main screen (`app/page.tsx`)

| Section | Component | Description |
|---|---|---|
| Status | `StatusCard` | Running / Waiting / Alert / Awaiting DeskQ |
| Dev tools | `TestCountdownButton` | Preview countdown (dev only) |
| Timer | `TimerPanel` | Circular progress ring + elapsed time |
| Metrics | `StatsBar` | Interval, countdown length, next alert, cycle % |
| Actions | `ActionBar` | Stop + Reset when active; `DeskQSyncStrip` when idle |

### Keep alive (Electron only)

DeskQ Agent auto-stops tracking after **~15 minutes** of keyboard/mouse inactivity. DeskFlow nudges the cursor before that happens **while your session is active**:

| Setting | Value | Why |
|---|---|---|
| Nudge interval | **10 min** (default) | 5 min buffer before DeskQ's 15 min idle stop |
| Idle threshold | 30 s | Skip nudge if you were active recently |
| Auto on/off | Dock → **Keep alive** | **On** when DeskQ tracking / session runs; **Off** when it stops |

Each nudge moves the cursor in a small pattern and taps F15 (harmless on most Macs). Grant macOS **Accessibility** permission when prompted. Check the Electron console for `idle before … after … effective=true` to confirm it worked.

### Break Hub

Opened from the dock. Two tabs:

**Games**

| Game | File | Description |
|---|---|---|
| Snake | `games/SnakeGame.tsx` | Classic snake arcade |
| Memory | `games/MemoryGame.tsx` | Card matching pairs |
| Reaction | `games/ReactionGame.tsx` | Reflex speed test |

**Wellness**

| Tool | File | Description |
|---|---|---|
| Breathe | `wellness/BreathingExercise.tsx` | Box breathing exercise |
| Eye Rest | `wellness/EyeRestTimer.tsx` | 20-20-20 rule timer |
| Stretch | `wellness/StretchGuide.tsx` | Desk stretch guide |

Break Hub is disabled during active alert countdown.

### Theme

`ThemeToggle` in the dock supports light/dark mode (stored in browser/Electron renderer).

### Countdown overlay

| Environment | Implementation |
|---|---|
| Browser | `CountdownOverlay.tsx` — full-screen React modal with bell, ring, particles |
| Electron | `desktop/overlay.html` — separate always-on-top, click-through system window |

---

## State Management

### TrackerContext

`context/TrackerContext.tsx` wraps the app and exposes:

```typescript
interface TrackerContextValue {
  state: "stopped" | "running" | "alert";
  elapsedSeconds: number;
  countdown: number;
  showOverlay: boolean;
  statusLabel: StatusLabel;
  nextAlertSeconds: number;
  awaitingScreenshot: boolean;
  deskqStatus: DesqStatus | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
  testAlert: () => void;
}
```

Use `useTracker()` in any client component.

### useTrackerTimer

Dual-mode hook:

- **Electron** (`window.electronAPI.usesMainTimer === true`): delegates to IPC; subscribes to `onTimerState`, `onDesqStatus`
- **Browser**: runs interval timers locally; persists to `localStorage` key `tracker-alert-state`

### Electron API (`window.electronAPI`)

Exposed via `desktop/preload.cjs`:

| Method | Description |
|---|---|
| `getTimerState()` | Current timer snapshot |
| `startTimer()` / `stopTimer()` / `resetTimer()` | Session controls |
| `testAlert()` | Trigger countdown immediately |
| `simulateScreenshot()` | Dev: simulate DeskQ screenshot |
| `getDesqStatus()` / `syncDeskq()` | DeskQ link status |
| `onTimerState(cb)` | Subscribe to timer updates |
| `onDesqDetected(cb)` | DeskQ notification events |
| `onDesqTimerStarted(cb)` / `onDesqTimerStopped(cb)` | DeskQ lifecycle |
| `minimizeToTray()` | Hide to system tray |

---

## Electron Desktop Layer

### Main window (`desktop/main.cjs`)

- Fixed iPhone dimensions: **393 × 852**
- Frameless, transparent, rounded corners
- Content protection enabled
- Close → hide to tray (not quit)
- Loads Next.js from `ELECTRON_APP_URL`

### TimerService (`desktop/timer-service.cjs`)

Authoritative timer when running in Electron:

- 1-second tick interval
- Emits state on every change
- Handles alert trigger, countdown, screenshot restart, DeskQ sync

### BackgroundService (`desktop/services/background-service.cjs`)

Routes DeskQ watcher events to `TimerService` and broadcasts IPC events to the renderer.

### System tray (`desktop/tray.cjs`)

- **Show Tracker** — bring window to front
- **Quit** — exit application

### IPC channels

| Channel | Direction | Purpose |
|---|---|---|
| `timer:get-state` | invoke | Get timer snapshot |
| `timer:start/stop/reset/test-alert` | invoke | Control timer |
| `timer:simulate-screenshot` | invoke | Dev screenshot simulation |
| `timer:state` | main → renderer | Push timer updates |
| `desq:get-status` / `desq:sync` | invoke | DeskQ status |
| `desq:status` | main → renderer | DeskQ status updates |
| `tracker:desq-detected` | main → renderer | Raw DeskQ notification |
| `tracker:screenshot-restart` | main → renderer | Screenshot → cycle restart |
| `tracker:desq-timer-started/stopped` | main → renderer | DeskQ lifecycle |
| `window:shown` | main → renderer | Window became visible |

---

## Development Tools

Available only when `NODE_ENV === "development"`:

| Tool | Location | Action |
|---|---|---|
| Preview Countdown | `TestCountdownButton` | Triggers 3→1 alert immediately |
| Simulate Screenshot | `TestCountdownButton` | Calls `electronAPI.simulateScreenshot()` when awaiting DeskQ |

---

## Building for Production

### Electron desktop app

```bash
npm run electron:build
```

Runs `next build` then `electron-builder`. Output goes to `dist-electron/`.

| Platform | Target |
|---|---|
| macOS | DMG (`public.app-category.productivity`) |
| Windows | NSIS installer |

Build config is in `package.json` under the `"build"` key. Product name: **DeskFlow**, icon: `desktop/icon.svg`.

---

## Key Files Reference

| File | Purpose |
|---|---|
| `app/page.tsx` | Main UI layout |
| `hooks/useTrackerTimer.ts` | Timer hook (browser + Electron) |
| `desktop/timer-service.cjs` | Main-process timer engine |
| `desktop/main.cjs` | Electron entry point |
| `desktop/services/background-service.cjs` | DeskQ event orchestration |
| `desktop/services/deskq-agent-watcher.cjs` | DeskQ SQLite/filesystem watcher |
| `config/timer.json` | 11-min interval & 3s countdown config |
| `types/tracker.ts` | Shared timer types |
| `types/electron.d.ts` | Electron API types |
| `.env.example` | Environment variable template |

---

## Quick Start Cheat Sheet

```bash
# 1. Install
cd tracker-alert && npm install

# 2. (Optional) Configure
cp .env.example .env.local

# 3. Run with full DeskQ + Electron experience
npm run electron:dev

# 4. Or run browser-only
npm run dev
```

**Expected behavior with DeskQ Agent:**

1. Install and start DeskQ Agent tracking → DeskFlow auto-starts a session.
2. Every 11 minutes → 3-second countdown overlay appears.
3. DeskQ takes screenshot → DeskFlow resets and starts a new 11-minute cycle.
4. Stop DeskQ tracking → DeskFlow resets completely.

---

*Last updated: June 2025 — DeskFlow v0.1.0*
