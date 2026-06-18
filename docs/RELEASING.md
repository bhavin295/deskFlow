# Publishing DeskFlow releases

## One-time: enable GitHub Actions (optional)

Copy the workflow file into GitHub:

```bash
mkdir -p .github/workflows
cp docs/release-workflow.yml .github/workflows/release.yml
git add .github/workflows/release.yml
git commit -m "Add release workflow"
git push origin main
```

Your GitHub token needs the **`workflow`** scope when pushing Actions files. In GitHub → Settings → Developer settings → Personal access tokens, enable **workflow** (or use SSH / `gh auth login`).

After that, every `git push origin v*` tag builds macOS + Windows installers automatically.

---

## Manual release (fastest — no CI)

1. Build locally:

```bash
npm run electron:build:mac    # macOS .dmg + .zip → dist-electron/
npm run electron:build:win    # Windows .exe (on Windows)
```

2. Open **[GitHub → deskFlow → Releases → Draft a new release](https://github.com/bhavin295/deskFlow/releases/new)**

3. Choose tag **`v0.1.0`** (create if needed), title **DeskFlow v0.1.0**

4. Upload from `dist-electron/`:
   - `DeskFlow-0.1.0.dmg` (macOS)
   - `DeskFlow-0.1.0-mac.zip` (macOS alt)
   - `DeskFlow Setup 0.1.0.exe` (Windows, when built)

5. Paste release notes (example):

```markdown
## DeskFlow v0.1.0

First public release — installable desktop app with bundled UI server.

### Requirements
- DeskQ Agent installed on the same machine
- macOS 12+ or Windows 10+

### Install
See [INSTALL.md](https://github.com/bhavin295/deskFlow/blob/main/INSTALL.md)
```

6. Click **Publish release**

Share the release URL with your team.

---

## macOS code signing (recommended for wider distribution)

Unsigned builds work with **Right-click → Open** on first launch. For no warnings:

1. Enroll in [Apple Developer Program](https://developer.apple.com/programs/)
2. Create a **Developer ID Application** certificate
3. Set env vars before build:

```bash
export CSC_LINK=/path/to/certificate.p12
export CSC_KEY_PASSWORD=your-password
export APPLE_ID=your@email.com
export APPLE_APP_SPECIFIC_PASSWORD=xxxx-xxxx-xxxx-xxxx
npm run electron:build:mac
```

See [electron-builder code signing](https://www.electron.build/code-signing).
