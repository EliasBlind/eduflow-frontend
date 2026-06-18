import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, TokenPair } from "@/api/gen/sso/sso";
import { Role, type TRole } from "@/domain/person";
import { auth } from "@/api/client";
import { APP_ID } from "@/api/appId";
import { AuthStatus, type TAuthStatus } from "@/domain/authStatus"

type AuthUpdateCallback = (state: AuthState) => void;
const authUpdateListeners: AuthUpdateCallback[] = [];

export function subscribeToTokenUpdate(listener: AuthUpdateCallback): void {
  authUpdateListeners.push(listener);
}

export function unsubscribeFromTokenUpdate(listener: AuthUpdateCallback): void {
  const index = authUpdateListeners.indexOf(listener);
  if (index !== -1) {
    authUpdateListeners.splice(index, 1);
  }
}

function runTokenUpdateCallback(token: AuthState) {
  authUpdateListeners.forEach((listener) => {
    listener(token);
  });
}


export interface AuthState {
  id:              string | null;
  exp:             number | null;
  accessToken:     string | null;
  refreshToken:    string | null;
  user:            User   | null;
  role:            TRole;
  isAuthenticated: boolean;
  status:          TAuthStatus;
}

interface AuthActions {
  setTokens: (pair: TokenPair) => void;
  setUser:   (user: Partial<User>) => void;
  setRole:   (role: TRole) => void;
  refresh:   () => Promise<boolean>;
  clear:     () => void;
}

const initial: AuthState = {
  id:              null,
  exp:             null,
  accessToken:     null,
  refreshToken:    null,
  user:            null,
  role:            Role.Unauthorized,
  isAuthenticated: false,
  status:          AuthStatus.Pending, // до рехидрации статус неизвестен
};

function isExpired(exp: number | null): boolean {
  if (!exp) return true;
  const threshold = Number(import.meta.env.VITE_REFRESH_THRESHOLD_MS) || 0;
  const expireTimeMs = exp * 1000 - threshold;
  return Date.now() >= expireTimeMs;
}

// один общий промис на все параллельные запросы — без дублей рефреша
let refreshPromise: Promise<boolean> | null = null;

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      ...initial,

      setTokens: (pair) => {
        const decoded = decodeJWT(pair.accessToken);
        const id   = decoded?.Id ?? null;
        const role = decoded?.Role ?? Role.Unauthorized;

        set((state) => ({
          id,
          exp:             decoded?.exp ?? null,
          accessToken:     pair.accessToken,
          refreshToken:    pair.refreshToken,
          isAuthenticated: true,
          status:          AuthStatus.Authenticated,
          role,
          // мёржим id/role в user, не затирая то, что уже могло быть (login, fullName и т.п.)
          user: {
            ...(state.user ?? {}),
            ...(id ? { id } : {}),
            role,
          } as User,
        }));

        runTokenUpdateCallback(get());
      },

      setUser: (user) => {
        set((state) => {
          const updatedUser = state.user
            ? { ...state.user, ...user }
            : (user as User);
          return {
            user: updatedUser,
            ...(user.role !== undefined && { role: user.role as TRole }),
          };
        });
      },

      setRole: (role) =>
        set((state) => ({
          role,
          user: state.user ? { ...state.user, role } : null,
        })),

      refresh: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          get().clear();
          return false;
        }
        if (refreshPromise) return refreshPromise;

        refreshPromise = (async () => {
          try {
            const tokens = await auth.refreshToken({ refreshToken, appId: APP_ID });
            get().setTokens(tokens);
            return true;
          } catch (e) {
            if (isUnauthorizedError(e)) {
              get().clear();
            }
            return false;
          } finally {
            refreshPromise = null;
          }
        })();

        return refreshPromise;
      },

      clear: () => set({ ...initial, status: AuthStatus.Unauthenticated }),
    }),
    {
      name: "auth",
      partialize: (state) => ({
        id:           state.id,
        exp:          state.exp,
        accessToken:  state.accessToken,
        refreshToken: state.refreshToken,
        user:         state.user,
        role:         state.role,
      }),
    },
  ),
);

function isUnauthorizedError(e: unknown): boolean {
  if (typeof e !== "object" || e === null) return false;
  const err = e as { status?: unknown; code?: unknown; response?: { status?: unknown } };

  if (err.status === 401) return true;
  if (err.response?.status === 401) return true;

  // gRPC / Connect: Code.Unauthenticated === 16
  if (err.code === 16) return true;

  return false;
}

function bootstrapAuth(): void {
  const state = useAuthStore.getState();

  if (!isExpired(state.exp)) {
    useAuthStore.setState({ isAuthenticated: true, status: AuthStatus.Authenticated });
    return;
  }

  if (state.refreshToken) {
    void state.refresh();
  } else {
    state.clear();
  }
}

if (useAuthStore.persist.hasHydrated()) {
  bootstrapAuth();
} else {
  useAuthStore.persist.onFinishHydration(bootstrapAuth);
}

interface JwtPayload {
  exp:  number;
  Id:   string;
  Role: TRole;
}

function decodeJWT(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}
