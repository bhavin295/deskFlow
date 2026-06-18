"use strict";
/**
 * Session management: init (create or resume today's session) and sync totals from backend.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.applySessionTotalsFromBackend = applySessionTotalsFromBackend;
exports.createSessionManager = createSessionManager;
const state_1 = require("../state");
const dateUtils_1 = require("../utils/dateUtils");
const sessionUtils_1 = require("../utils/sessionUtils");
function applySessionTotalsFromBackend(session) {
    const nextActive = session.totalActiveSeconds ?? 0;
    const nextIdle = session.totalIdleSeconds ?? 0;
    const prevActive = state_1.appState.trackedSecondsTotal;
    const prevIdle = state_1.appState.idleSecondsTotal;
    state_1.appState.trackedSecondsTotal = Math.max(prevActive, nextActive);
    state_1.appState.idleSecondsTotal = Math.max(prevIdle, nextIdle);
    const deltaActive = state_1.appState.trackedSecondsTotal - prevActive;
    const deltaIdle = state_1.appState.idleSecondsTotal - prevIdle;
    if (deltaActive >= 2 || deltaIdle >= 2) {
        console.log('[session] totals.sync', {
            prevActive,
            nextActive,
            appliedActive: state_1.appState.trackedSecondsTotal,
            deltaActive,
            prevIdle,
            nextIdle,
            appliedIdle: state_1.appState.idleSecondsTotal,
            deltaIdle,
        });
    }
}
function createSessionManager(apiClient, authStore) {
    return {
        applySessionTotalsFromBackend,
        async getOrCreateSession(userId) {
            const today = (0, dateUtils_1.getTodayDateString)();
            const s = state_1.appState;
            try {
                const data = await apiClient.initSession();
                s.currentSession = (0, sessionUtils_1.mapWorkSessionToCurrentSession)(data);
                applySessionTotalsFromBackend(data);
                authStore.setSession(s.currentSession.id, s.currentSession.date);
                return s.currentSession;
            }
            catch (error) {
                console.error('Failed to init session from backend:', error);
                if (s.currentSession && s.currentSession.userId === userId && s.currentSession.date === today) {
                    return s.currentSession;
                }
                s.currentSession = {
                    id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    userId,
                    date: today,
                    startedAt: new Date(),
                };
                return s.currentSession;
            }
        },
    };
}
