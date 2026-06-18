# DeskFlow

DeskQ companion for **11-minute focus cycles** — alerts, keep-alive nudges, and session sync via the Electron desktop app.

## Download (for everyone)

**Install the desktop app — no coding required:**

👉 **[Releases → Download DeskFlow](https://github.com/bhavin295/deskFlow/releases)**

| Platform | Installer |
|----------|-----------|
| macOS | `.dmg` |
| Windows | `.exe` (NSIS) |

Full install steps: **[INSTALL.md](./INSTALL.md)**

You also need **DeskQ Agent** installed and running on the same machine.

---

## Getting started (developers)

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
| `npm run electron:build` | Build `.dmg` / `.exe` (bundled UI server) |
| `npm run electron:build:mac` | macOS `.dmg` + `.zip` only |
| `npm run electron:build:win` | Windows installer only |

## Publishing a release

1. Bump version in `package.json`
2. Commit and push to `main`
3. Tag and push:

```bash
git tag v0.1.0
git push origin v0.1.0
```

GitHub Actions builds macOS and Windows installers and attaches them to the release automatically.

## Configuration

- Timer defaults: `config/timer.json`
- Server port: `config/server.json` (default **4000**)
- Optional team policy: set `NEXT_PUBLIC_TEAM_INTERVAL_MINUTES` in `.env.local`
- Electron loads `ELECTRON_APP_URL` (default `http://localhost:4000`; production builds start this automatically)

See [PROJECT.md](./PROJECT.md) for architecture and DeskQ integration details.
