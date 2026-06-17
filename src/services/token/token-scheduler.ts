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

/**
 * Единая точка рефреша — всегда через стор.
 *
 * ВАЖНО: планировщик НЕ дёргает auth.refreshToken напрямую и не держит
 * собственный флаг isRefreshing. Дедупликация параллельных вызовов живёт
 * в useAuthStore.refresh() (общий refreshPromise), поэтому bootstrapAuth,
 * планировщик и интерцептор могут сработать одновременно — на сеть уйдёт
 * ровно один запрос. Решение о clear() (только на 401) тоже принимает стор.
 */
function triggerRefresh() {
  void useAuthStore.getState().refresh();
}

/**
 * Планирует обновление токена на основе времени истечения accessToken.
 */
function scheduleTokenRefresh(state: AuthState) {
  clearRefreshTimer();

  if (!state.accessToken || !state.exp) return;

  const now = Date.now();
  const expiryMs = state.exp * 1000;
  let delay = expiryMs - now - REFRESH_THRESHOLD_MS;

  // Если время уже прошло или порог отрицательный – обновляем сразу
  if (delay <= 0) {
    triggerRefresh();
    return;
  }

  // Защита от слишком больших задержек (например, exp в далёком будущем)
  const MAX_DELAY = 2_147_483_647; // максимум для setTimeout
  if (delay > MAX_DELAY) delay = MAX_DELAY;

  refreshTimer = setTimeout(triggerRefresh, delay);
}

/**
 * Обработчик изменений состояния стора.
 * Перепланирует обновление при каждом новом действительном токене.
 */
function onAuthStateChange(state: AuthState) {
  if (state.accessToken && state.exp && state.refreshToken) {
    scheduleTokenRefresh(state);
  } else {
    clearRefreshTimer();
  }
}

let isSubscribed = false;

/**
 * Инициализирует планировщик обновления токенов.
 * Вызывается один раз при старте приложения.
 */
export function initTokenScheduler() {
  if (isSubscribed) return;

  subscribeToTokenUpdate(onAuthStateChange);

  // Немедленно обработать текущее состояние
  onAuthStateChange(useAuthStore.getState());

  isSubscribed = true;
}

/**
 * Останавливает планировщик и отписывается от обновлений стора.
 */
export function destroyTokenScheduler() {
  clearRefreshTimer();
  unsubscribeFromTokenUpdate(onAuthStateChange);
  isSubscribed = false;
}
