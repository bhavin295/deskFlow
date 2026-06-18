# Install DeskFlow

DeskFlow is a desktop companion for **DeskQ Agent**. It runs **11-minute focus cycles** synced with DeskQ screenshots.

## Download

Get the latest installer from **[GitHub Releases](https://github.com/bhavin295/deskFlow/releases)**:

| Platform | File |
|----------|------|
| macOS | `DeskFlow-x.x.x.dmg` |
| Windows | `DeskFlow Setup x.x.x.exe` |

No Node.js or terminal required — double-click the installer.

---

## Requirements

1. **DeskQ Agent** installed and running on the same machine
2. **macOS 12+** or **Windows 10+**
3. **Accessibility permission** (macOS only, for keep-alive nudges — optional but recommended)

---

## macOS install

1. Download `DeskFlow-x.x.x.dmg` from Releases
2. Open the DMG and drag **DeskFlow** to Applications
3. First launch: if macOS shows an security warning (unsigned build), right-click the app → **Open** → **Open** again
4. Grant **Accessibility** when prompted (Settings → Privacy & Security → Accessibility → enable DeskFlow)

---

## Windows install

1. Download `DeskFlow Setup x.x.x.exe` from Releases
2. Run the installer and follow the prompts
3. Launch DeskFlow from the Start menu

If SmartScreen warns about an unsigned app, click **More info** → **Run anyway**.

---

## First run

1. Open **DeskQ Agent** and sign in
2. Launch **DeskFlow** — it auto-detects DeskQ data on macOS
3. Tap **Start tracking** in DeskQ Agent
4. DeskFlow syncs and begins your 11-minute focus cycle

### What to expect

- Every **11 minutes**: a 3-second countdown alert
- After the alert: DeskFlow waits for DeskQ to capture a screenshot, then starts a fresh cycle
- **Menu bar tray** (macOS): show/hide DeskFlow, sync DeskQ, quit
- **Keep-alive** (dock toggle): prevents DeskQ from auto-stopping after ~15 min idle

---

## Keyboard shortcuts (desktop)

| Shortcut | Action |
|----------|--------|
| `⌘⇧H` / `Ctrl+Shift+H` | Hide to tray |
| `⌘⇧T` / `Ctrl+Shift+T` | Test alert |
| `⌘⇧D` / `Ctrl+Shift+D` | Sync DeskQ |
| `⌘⇧,` / `Ctrl+Shift+,` | Open settings |

---

## Troubleshooting

### DeskFlow window is blank

- Quit and reopen the app
- On macOS, check Console.app for `[DeskFlow UI]` errors
- Re-download the latest release

### “DeskQ not linked”

- Ensure DeskQ Agent is installed and you have started tracking at least once
- In DeskFlow **Settings → DeskQ**, tap **Sync DeskQ now**
- Override path (advanced): set `DESQ_AGENT_DB_PATH` in a `.env.local` file next to the app (dev builds only)

### Keep-alive not working (macOS)

- System Settings → Privacy & Security → **Accessibility** → enable **DeskFlow**
- In DeskFlow settings, run **Test nudge** under Keep-alive

---

## For developers

See [README.md](./README.md) and [PROJECT.md](./PROJECT.md) for building from source.

```bash
npm install
npm run electron:dev    # dev mode (requires Node.js)
npm run electron:build  # production .dmg / .exe locally
```

Release builds are published automatically when a `v*` tag is pushed to GitHub.
