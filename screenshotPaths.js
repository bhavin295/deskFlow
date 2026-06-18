"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getScreenshotDir = getScreenshotDir;
exports.ensureScreenshotDir = ensureScreenshotDir;
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
function getScreenshotDir(userId) {
    return path_1.default.join(electron_1.app.getPath('userData'), 'users', userId, 'screenshots');
}
async function ensureScreenshotDir(userId) {
    const dir = getScreenshotDir(userId);
    await promises_1.default.mkdir(dir, { recursive: true });
    return dir;
}
