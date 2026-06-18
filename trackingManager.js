"use strict";
/**
 * Tracking lifecycle: start/stop tracking, metrics, and heartbeat control.
 * Coordinates session, idle monitor, and heartbeat runner.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTrackingManager = createTrackingManager;
const axios_1 = __importDefault(require("axios"));
const tracking_1 = require("../constants/tracking");
const screenshot_1 = require("../constants/screenshot");
const state_1 = require("../state");
const idle_1 = require("../idle");
const dateUtils_1 = require("../utils/dateUtils");
const sessionUtils_1 = require("../utils/sessionUtils");
const currentUser_1 = require("../utils/currentUser");
const trackingMetrics_1 = require("../utils/trackingMetrics");
const screenCapturePermissionService_1 = require("../services/screenCapturePermissionService");
const deviceInfoService_1 = require("../services/deviceInfoService");
const waylandCaptureService_1 = require("../services/waylandCaptureService");
const overlayIcon_1 = require("../utils/overlayIcon");
const STARTUP_QUEUE_FLUSH_TIMEOUT_MS = 30000;
function createTrackingManager(deps) {
    const { apiClient, sessionManager, heartbeatControl, screenshotControl, onUserConfigUpdated, onSessionChanged, onAutoStopDueToIdle, onTrackingStopped, queueFlush, } = deps;
    const s = state_1.appState;
    let startupQueueSyncInFlight = null;
    const toErrorMessage = (error) => {
        if (error instanceof Error && error.message)
            return error.message;
        return String(error);
    };
    async function refreshUserConfigFromProfile() {
        if (!s.currentUser)
            return;
        const previous = s.currentUser;
        let next = (0, currentUser_1.toCurrentUser)(previous);
        try {
            const profile = await apiClient.getProfile();
            next = (0, currentUser_1.toCurrentUser)(profile);
        }
        catch (error) {
            console.warn('[tracking] profile.refresh.failed before start:', error);
        }
        const changed = previous.trackingLevel !== next.trackingLevel ||
            previous.screenshotIntervalMinutes !== next.screenshotIntervalMinutes ||
            previous.screenshotEnabled !== next.screenshotEnabled ||
            previous.email !== next.email;
        s.currentUser = next;
        if (changed) {
            console.log('[tracking] profile.config.updated', {
                userId: next.id,
                previousTrackingLevel: previous.trackingLevel,
                nextTrackingLevel: next.trackingLevel,
                previousIntervalMinutes: previous.screenshotIntervalMinutes,
                nextIntervalMinutes: next.screenshotIntervalMinutes,
                previousScreenshotEnabled: previous.screenshotEnabled,
                nextScreenshotEnabled: next.screenshotEnabled,
            });
        }
        if (onUserConfigUpdated) {
            await onUserConfigUpdated(next);
        }
    }
    function getTrackingMetrics() {
        const snapshot = {
            isTracking: s.isTracking,
            hasUser: !!s.currentUser,
            activityState: s.activityState,
            trackedSecondsTotal: s.trackedSecondsTotal,
            idleSecondsTotal: s.idleSecondsTotal,
            trackingStartedAt: s.trackingStartedAt,
            idleStartedAt: s.idleStartedAt,
            getElapsedSecondsSince: dateUtils_1.getElapsedSecondsSince,
        };
        return (0, trackingMetrics_1.computeTrackingMetrics)(snapshot);
    }
    function resetTrackingMetrics() {
        s.trackingStartedAt = null;
        s.idleStartedAt = null;
        s.trackedSecondsTotal = 0;
        s.idleSecondsTotal = 0;
        s.activityState = null;
        s.intervalActiveSeconds = 0;
        s.intervalIdleSeconds = 0;
        intervalLastTickMs = null;
        if (s.intervalAccumulatorId) {
            clearInterval(s.intervalAccumulatorId);
            s.intervalAccumulatorId = null;
        }
        s.isSystemSuspended = false;
        s.suspendStartedAtMs = null;
        s.pendingSleepIdleSeconds = 0;
        s.pendingResumeAtMs = null;
        s.forcedIdleReason = null;
        s.autoStoppedDueToIdle = false;
        s.autoStopResumeError = null;
        s.isTrackingActionInProgress = false;
    }
    function deriveAutoStopReason(forcedIdleReason) {
        switch (forcedIdleReason) {
            case 'lock': return 'auto_lock';
            case 'suspend': return 'auto_suspend';
            case 'session-inactive': return 'auto_session_inactive';
            default: return 'auto_idle';
        }
    }
    async function handleAutoStop() {
        const reason = deriveAutoStopReason(s.forcedIdleReason ?? null);
        console.log('[auto-stop] handleAutoStop: beginning stop sequence', { sessionId: s.currentSession?.id });
        try {
            await stopTracking({ reason });
            console.log('[auto-stop] handleAutoStop: tracking stopped successfully, setting autoStoppedDueToIdle flag');
            s.autoStoppedDueToIdle = true;
            await onAutoStopDueToIdle?.();
        }
        catch (err) {
            console.error('[auto-stop] handleAutoStop: stopTracking failed:', err);
            if (!s.isTracking) {
                console.log('[auto-stop] handleAutoStop: tracking appears stopped despite error, proceeding with dialog');
                s.autoStoppedDueToIdle = true;
                await onAutoStopDueToIdle?.();
            }
            else {
                console.error('[auto-stop] handleAutoStop: tracking still active after error, cannot show dialog');
            }
        }
    }
    let intervalLastTickMs = null;
    /** Returns active/idle seconds for the current heartbeat window (no reset). */
    function getIntervalSnapshot() {
        return { activeSeconds: s.intervalActiveSeconds, idleSeconds: s.intervalIdleSeconds };
    }
    function resetIntervalSnapshot() {
        s.intervalActiveSeconds = 0;
        s.intervalIdleSeconds = 0;
    }
    function startIntervalAccumulator() {
        if (s.intervalAccumulatorId)
            return;
        resetIntervalSnapshot();
        intervalLastTickMs = Date.now();
        s.intervalAccumulatorId = setInterval(() => {
            const now = Date.now();
            if (s.isSystemSuspended) {
                intervalLastTickMs = s.suspendStartedAtMs ?? now;
                return;
            }
            if (s.pendingSleepIdleSeconds > 0) {
                s.intervalIdleSeconds += s.pendingSleepIdleSeconds;
                s.pendingSleepIdleSeconds = 0;
                intervalLastTickMs = s.pendingResumeAtMs ?? now;
                s.pendingResumeAtMs = null;
            }
            if (!s.isTracking || !s.activityState) {
                intervalLastTickMs = now;
                return;
            }
            if (intervalLastTickMs === null) {
                intervalLastTickMs = now;
                return;
            }
            const deltaSeconds = Math.max(0, Math.floor((now - intervalLastTickMs) / 1000));
            if (deltaSeconds <= 0)
                return;
            if (s.activityState === 'active') {
                s.intervalActiveSeconds += deltaSeconds;
            }
            intervalLastTickMs = now;
        }, tracking_1.INTERVAL_ACCUMULATOR_MS);
    }
    function stopIntervalAccumulator() {
        if (s.intervalAccumulatorId) {
            clearInterval(s.intervalAccumulatorId);
            s.intervalAccumulatorId = null;
        }
        intervalLastTickMs = null;
    }
    function startHeartbeatInterval() {
        startIntervalAccumulator();
        heartbeatControl.start();
    }
    function stopHeartbeatInterval() {
        heartbeatControl.stop();
        stopIntervalAccumulator();
    }
    async function waitForHeartbeatIdle() {
        await heartbeatControl.waitForIdle();
    }
    function startStartupQueueSync() {
        if (!queueFlush)
            return;
        if (startupQueueSyncInFlight)
            return;
        if (!s.isTracking || !s.currentUser || !s.currentSession)
            return;
        const runUserId = s.currentUser.id;
        const runSessionId = s.currentSession.id;
        const startedAtMs = Date.now();
        startupQueueSyncInFlight = (async () => {
            const [screenshotsResult, heartbeatsResult] = await Promise.allSettled([
                queueFlush.flushScreenshots(STARTUP_QUEUE_FLUSH_TIMEOUT_MS),
                queueFlush.flushHeartbeats(STARTUP_QUEUE_FLUSH_TIMEOUT_MS),
            ]);
            if (!s.currentUser ||
                !s.currentSession ||
                s.currentUser.id !== runUserId ||
                s.currentSession.id !== runSessionId) {
                return;
            }
            const errors = [];
            if (screenshotsResult.status === 'rejected') {
                errors.push(`[screenshots] ${toErrorMessage(screenshotsResult.reason)}`);
            }
            if (heartbeatsResult.status === 'rejected') {
                errors.push(`[heartbeats] ${toErrorMessage(heartbeatsResult.reason)}`);
            }
            const completedAtMs = Date.now();
            const payload = {
                startedAt: new Date(startedAtMs).toISOString(),
                completedAt: new Date(completedAtMs).toISOString(),
                durationMs: Math.max(0, completedAtMs - startedAtMs),
                screenshotsFlushed: screenshotsResult.status === 'fulfilled',
                heartbeatsFlushed: heartbeatsResult.status === 'fulfilled',
                errors,
            };
            if (errors.length > 0) {
                console.warn('[tracking] startup.queue_sync.partial_failed', payload);
            }
            else {
                console.log('[tracking] startup.queue_sync.completed', payload);
            }
            queueFlush.onStartupSyncCompleted?.(payload);
        })().finally(() => {
            startupQueueSyncInFlight = null;
        });
    }
    async function startTracking() {
        if (!s.currentUser)
            return;
        if (s.isTracking)
            return;
        // Guard against concurrent calls: both checks and the set are synchronous
        // (before the first await), so this is effectively an atomic mutex in JS.
        if (s.isTrackingActionInProgress)
            return;
        s.isTrackingActionInProgress = true;
        let waylandCaptureStarted = false;
        try {
            // Always refresh /users/me before starting/continuing tracking so updated
            // tracking level changes are applied on the agent side.
            await refreshUserConfigFromProfile();
            // Screen recording permission is only needed when screenshots are active.
            // If admin has disabled screenshots, skip the permission check entirely.
            if (s.currentUser.screenshotEnabled !== false) {
                const hasScreenPermission = await (0, screenCapturePermissionService_1.ensureMacScreenCapturePermission)({
                    parentWindow: s.mainWindow,
                    interactive: true,
                });
                if (!hasScreenPermission) {
                    throw new Error('Screen Recording permission is required on macOS. Please grant permission and restart DeskQ Agent.');
                }
            }
            // On Wayland, acquire the persistent screen-capture stream BEFORE creating
            // a backend session. The XDG Desktop Portal permission dialog appears here.
            // If the user denies it, startTracking() throws and no session is created,
            // so idle counting and heartbeats never start until permission is granted.
            // Skip if screenshots are disabled by admin — no stream needed.
            if (process.platform === 'linux' && (0, deviceInfoService_1.isWaylandSession)() && s.currentUser.screenshotEnabled !== false) {
                await (0, waylandCaptureService_1.startWaylandCapture)();
                waylandCaptureStarted = true;
            }
            const preStartSessionId = s.currentSession?.id ?? null;
            const session = await sessionManager.getOrCreateSession(s.currentUser.id);
            const today = (0, dateUtils_1.getTodayDateString)();
            if (session.date !== today) {
                throw new Error(`Cannot start tracking: session date (${session.date}) does not match today (${today}). ` +
                    'A midnight rollover must be performed before starting tracking.');
            }
            onSessionChanged?.({ id: session.id, date: session.date });
            let startedSession = null;
            try {
                startedSession = await apiClient.startSession();
            }
            catch (startErr) {
                if (axios_1.default.isAxiosError(startErr) && startErr.response?.status === 409) {
                    // Session already active on backend. If initSession() failed earlier and left us
                    // with a local fallback ID (session_xxx), retry initSession now — the backend is
                    // clearly reachable and should return the real session.
                    if (s.currentSession?.id.startsWith('session_')) {
                        try {
                            const recovered = await sessionManager.getOrCreateSession(s.currentUser.id);
                            if (!recovered.id.startsWith('session_')) {
                                onSessionChanged?.({ id: recovered.id, date: recovered.date });
                                console.log('[tracking] start.409_session_recovered', {
                                    fallbackId: session.id,
                                    recoveredId: recovered.id,
                                });
                            }
                        }
                        catch {
                            // Backend still unreachable; keep fallback session and proceed
                        }
                    }
                }
                else {
                    throw startErr;
                }
            }
            if (startedSession) {
                s.currentSession = (0, sessionUtils_1.mapWorkSessionToCurrentSession)(startedSession);
                sessionManager.applySessionTotalsFromBackend(startedSession);
                onSessionChanged?.({ id: s.currentSession.id, date: s.currentSession.date });
            }
            console.log('[tracking] start.session.ids', {
                preStartSessionId,
                initSessionId: session.id,
                startedSessionId: startedSession?.id ?? null,
                activeSessionId: s.currentSession?.id ?? null,
                sessionDate: s.currentSession?.date ?? null,
            });
            s.isTracking = true;
            s.autoStoppedDueToIdle = false;
            s.autoStopResumeError = null;
            s.activityState = null;
            s.isSystemSuspended = false;
            s.suspendStartedAtMs = null;
            s.pendingSleepIdleSeconds = 0;
            s.pendingResumeAtMs = null;
            s.forcedIdleReason = null;
            // Always start active — user just clicked Start Tracking so they are present (EC-4).
            (0, idle_1.setActivityState)('active');
            const screenshotIntervalMs = s.currentUser.screenshotIntervalMinutes * 60 * 1000;
            console.log('[tracking] user.capture.config', {
                userId: s.currentUser.id,
                trackingLevel: s.currentUser.trackingLevel,
                screenshotIntervalMinutes: s.currentUser.screenshotIntervalMinutes,
                screenshotIntervalMs,
                screenshotEnabled: s.currentUser.screenshotEnabled,
            });
            s.trayManager?.setTrackingState(true);
            startHeartbeatInterval();
            (0, idle_1.setAutoStopCallback)(() => { void handleAutoStop(); });
            (0, idle_1.startIdleMonitor)();
            console.log('[screenshots] start requested by tracking manager');
            screenshotControl.start();
            startStartupQueueSync();
            console.log('Tracking started for session:', session.id);
        }
        catch (error) {
            // If Wayland capture was started but something later failed, tear it down
            // so we don't leave an orphaned BrowserWindow.
            if (waylandCaptureStarted) {
                (0, waylandCaptureService_1.stopWaylandCapture)().catch(() => { });
            }
            console.error('Failed to start tracking:', error);
            throw error;
        }
        finally {
            s.isTrackingActionInProgress = false;
        }
    }
    async function stopTracking(options) {
        if (!s.isTracking)
            return;
        // Prevent concurrent stopTracking calls (e.g. auto-stop racing with manual stop).
        // startTracking uses the same flag so this also prevents stop+start interleaving.
        if (s.isTrackingActionInProgress)
            return;
        s.isTrackingActionInProgress = true;
        if (s.activityState === 'active' && s.trackingStartedAt) {
            s.trackedSecondsTotal += (0, dateUtils_1.getElapsedSecondsSince)(s.trackingStartedAt);
        }
        // Capture synchronously before any await or state clearing — avoids race where appState is mutated mid-stop
        const sessionIdAtStop = s.currentSession?.id ?? null;
        const sessionDateAtStop = s.currentSession?.date ?? null;
        const trackedSecondsAtStop = s.trackedSecondsTotal;
        const userIdAtStop = s.currentUser?.id;
        const activityStateAtStop = s.activityState;
        const forcedIdleReasonAtStop = s.forcedIdleReason;
        const isSystemSuspendedAtStop = s.isSystemSuspended;
        s.trackingStartedAt = null;
        s.idleStartedAt = null;
        s.activityState = null;
        s.isSystemSuspended = false;
        s.suspendStartedAtMs = null;
        s.pendingSleepIdleSeconds = 0;
        s.pendingResumeAtMs = null;
        s.forcedIdleReason = null;
        stopHeartbeatInterval();
        (0, idle_1.stopIdleMonitor)();
        console.log('[screenshots] stop requested by tracking manager');
        screenshotControl.stop();
        if (process.platform === 'linux' && (0, deviceInfoService_1.isWaylandSession)()) {
            try {
                await (0, waylandCaptureService_1.stopWaylandCapture)();
            }
            catch (err) {
                console.warn('[screenshots] wayland capture stream stop failed:', err);
            }
        }
        try {
            await Promise.race([
                heartbeatControl.waitForIdle(),
                new Promise(resolve => setTimeout(resolve, tracking_1.HEARTBEAT_WAIT_FOR_IDLE_TIMEOUT_MS)),
            ]);
            if (queueFlush) {
                try {
                    await queueFlush.flushHeartbeats(tracking_1.HEARTBEAT_FLUSH_TIMEOUT_MS);
                }
                catch (error) {
                    console.error('[heartbeat] queue.flush.failed', error);
                }
                try {
                    await queueFlush.flushScreenshots(screenshot_1.SCREENSHOT_FLUSH_TIMEOUT_MS);
                }
                catch (error) {
                    console.error('[screenshots] queue.flush.failed', error);
                }
            }
            if (!options?.skipBackendStop) {
                const stoppedSession = await apiClient.stopSession();
                s.currentSession = (0, sessionUtils_1.mapWorkSessionToCurrentSession)(stoppedSession);
                sessionManager.applySessionTotalsFromBackend(stoppedSession);
                onSessionChanged?.({ id: s.currentSession.id, date: s.currentSession.date });
            }
        }
        catch (err) {
            if (axios_1.default.isAxiosError(err) && (err.response?.status === 404 || err.response?.status === 409)) {
                // No session or already paused — ignore
            }
            else {
                console.error('Failed to stop session on backend:', err);
            }
        }
        finally {
            // Flip local tracking state only after best-effort flush + backend stop call.
            s.isTracking = false;
            s.trayManager?.setTrackingState(false);
            (0, overlayIcon_1.updateTaskbarOverlay)('stopped');
            s.isTrackingActionInProgress = false;
            if (userIdAtStop && onTrackingStopped) {
                try {
                    onTrackingStopped({
                        userId: userIdAtStop,
                        sessionId: sessionIdAtStop,
                        sessionDate: sessionDateAtStop,
                        reason: options?.reason ?? null,
                        trackedSeconds: trackedSecondsAtStop,
                        forcedIdleReason: forcedIdleReasonAtStop ?? null,
                        activityState: activityStateAtStop,
                        isSystemSuspended: isSystemSuspendedAtStop,
                        stoppedAt: new Date(),
                    });
                }
                catch {
                    // swallow — stop event recording must never affect the tracking stop result
                }
            }
        }
        console.log('Tracking stopped');
    }
    return {
        getTrackingMetrics,
        getIntervalSnapshot,
        resetIntervalSnapshot,
        resetTrackingMetrics,
        startTracking,
        stopTracking,
        startHeartbeatInterval,
        stopHeartbeatInterval,
        waitForHeartbeatIdle,
    };
}
