const { screen } = require("electron");

/** macOS virtual key codes */
const KEY_TAB = 48;
const KEY_RIGHT_ARROW = 124;
/** Digits 1–6 (Control+1 … Control+6 switches desktops). */
const DESKTOP_KEY_CODES = [18, 19, 20, 21, 22, 23];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sortDisplays(displays) {
  return [...displays].sort((a, b) => a.bounds.x - b.bounds.x || a.bounds.y - b.bounds.y);
}

function displayIndexAt(point, displays) {
  const idx = displays.findIndex((d) => {
    const b = d.bounds;
    return point.x >= b.x && point.x < b.x + b.width && point.y >= b.y && point.y < b.y + b.height;
  });
  return idx >= 0 ? idx : 0;
}

async function pressKey(keyCode, modifiers, execCommand) {
  const modClause =
    modifiers.length > 0
      ? ` using {${modifiers.map((m) => `${m} down`).join(", ")}}`
      : "";
  const script = `tell application "System Events" to key code ${keyCode}${modClause}`;
  await execCommand("osascript", ["-e", script]);
}

/** Cmd+Tab — switches to the previous app (standard macOS app switcher). */
async function pressCommandTab(execCommand, reverse = false) {
  const modifiers = reverse ? ["command", "shift"] : ["command"];
  await pressKey(KEY_TAB, modifiers, execCommand);
}

async function pressControlKey(keyCode, execCommand) {
  await pressKey(keyCode, ["control"], execCommand);
}

/**
 * Switch to the next monitor, next app (Cmd+Tab), or next macOS Space.
 * Returns jump target for the mouse drag and a label for logging.
 */
async function rotateToNextScreen({ execCommand, desktopCycleIndex }) {
  const point = screen.getCursorScreenPoint();
  const displays = sortDisplays(screen.getAllDisplays());

  if (displays.length > 1) {
    const idx = displayIndexAt(point, displays);
    const nextIdx = (idx + 1) % displays.length;
    const next = displays[nextIdx];
    return {
      desktopCycleIndex: desktopCycleIndex + 1,
      target: {
        x: Math.round(next.bounds.x + next.bounds.width / 2),
        y: Math.round(next.bounds.y + next.bounds.height / 2),
        kind: `display-${nextIdx + 1}-of-${displays.length}`,
      },
    };
  }

  const reverse = desktopCycleIndex % 2 === 1;
  const errors = [];

  // 1) Cmd+Tab — what most Mac users use to change what's on screen
  try {
    await pressCommandTab(execCommand, reverse);
    await sleep(450);
    const after = screen.getCursorScreenPoint();
    return {
      desktopCycleIndex: desktopCycleIndex + 1,
      target: {
        x: after.x,
        y: after.y,
        kind: reverse ? "cmd-shift-tab" : "cmd-tab",
      },
    };
  } catch (err) {
    errors.push(`Cmd+Tab: ${err.message}`);
  }

  // 2) Control+→ — next Space / desktop
  try {
    await pressControlKey(KEY_RIGHT_ARROW, execCommand);
    await sleep(450);
    const after = screen.getCursorScreenPoint();
    return {
      desktopCycleIndex: desktopCycleIndex + 1,
      target: {
        x: after.x,
        y: after.y,
        kind: "space-arrow-right",
      },
    };
  } catch (err) {
    errors.push(`Control+→: ${err.message}`);
  }

  // 3) Control+1…6 — numbered desktops
  const desktopSlot = desktopCycleIndex % DESKTOP_KEY_CODES.length;
  const keyCode = DESKTOP_KEY_CODES[desktopSlot];
  try {
    await pressControlKey(keyCode, execCommand);
    await sleep(450);
    const after = screen.getCursorScreenPoint();
    return {
      desktopCycleIndex: desktopCycleIndex + 1,
      target: {
        x: after.x,
        y: after.y,
        kind: `space-desktop-${desktopSlot + 1}`,
      },
    };
  } catch (err) {
    errors.push(`Control+${desktopSlot + 1}: ${err.message}`);
  }

  throw new Error(
    `Screen switch failed — allow DeskFlow in Accessibility, then try again. (${errors.join("; ")})`,
  );
}

module.exports = { rotateToNextScreen };
