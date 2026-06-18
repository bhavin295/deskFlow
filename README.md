# DeskFlow

DeskQ companion for **11-minute focus cycles** — alerts, keep-alive nudges, and session sync via the Electron desktop app.

## Getting started

Install dependencies:

```bash
npm install
```

Run the Next.js dev server (port **4000**):

```bash
npm run dev
```

Open [http://localhost:4000](http://localhost:4000) in your browser for the UI preview.

For full DeskQ sync, tray, keep-alive, and notifications, run Electron (requires the dev server):

```bash
npm run electron:dev
```

Or in two terminals:

```bash
npm run dev          # http://localhost:4000
npm run electron     # loads ELECTRON_APP_URL (default http://localhost:4000)
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Next.js dev server on port 4000 |
| `npm run build` | Production Next.js build |
| `npm run start` | Production server on port 4000 |
| `npm run electron` | Electron shell (Next.js must be running) |
| `npm run electron:dev` | Dev server + Electron together |
| `npm run electron:build` | Build `.dmg` / installer via electron-builder |

## Configuration

- Timer defaults: `config/timer.json`
- Optional team policy: set `NEXT_PUBLIC_TEAM_INTERVAL_MINUTES` in `.env.local`
- Electron loads `ELECTRON_APP_URL` (default `http://localhost:4000`)

See [PROJECT.md](./PROJECT.md) for architecture and DeskQ integration details.
