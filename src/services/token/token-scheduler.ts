// token-scheduler.ts
import { useAuthStore, subscribeToTokenUpdate, unsubscribeFromTokenUpdate } from "@/storage/auth.store";
import type { AuthState } from "@/storage/auth.store";

const REFRESH_THRESHOLD_MS = Number(import.meta.env.VITE_REFRESH_THRESHOLD_MS) || 5 * 60 * 1000;

let refreshTimer: ReturnType<typeof setTimeout> | null = null;

function clearRefreshTimer() {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

function triggerRefresh() {
  void useAuthStore.getState().refresh();
}

function scheduleTokenRefresh(state: AuthState) {
  clearRefreshTimer();

  if (!state.accessToken || !state.exp) return;

  const now = Date.now();
  const expiryMs = state.exp * 1000;
  let delay = expiryMs - now - REFRESH_THRESHOLD_MS;

  if (delay <= 0) {
    triggerRefresh();
    return;
  }

  const MAX_DELAY = 2_147_483_647;
  if (delay > MAX_DELAY) delay = MAX_DELAY;

  refreshTimer = setTimeout(triggerRefresh, delay);
}

function onAuthStateChange(state: AuthState) {
  if (state.accessToken && state.exp && state.refreshToken) {
    scheduleTokenRefresh(state);
  } else {
    clearRefreshTimer();
  }
}

let isSubscribed = false;

export function initTokenScheduler() {
  if (isSubscribed) return;

  subscribeToTokenUpdate(onAuthStateChange);

  onAuthStateChange(useAuthStore.getState());

  isSubscribed = true;
}

export function destroyTokenScheduler() {
  clearRefreshTimer();
  unsubscribeFromTokenUpdate(onAuthStateChange);
  isSubscribed = false;
}
