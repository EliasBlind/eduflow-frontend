import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, TokenPair } from "../api/gen/sso/sso";

export type Role = "admin" | "teacher" | "student" | "";

export interface AuthState {
  id:           string | null;
  accessToken:  string | null;
  refreshToken: string | null;
  email:        string | null;
  user:         User   | null;
  role:         Role;
  isAuthenticated: boolean;
}

interface AuthActions {
  setTokens: (pair: TokenPair) => void;
  setUser: (user: User) => void;
  setRole: (role: Role) => void;
  clear: () => void;
}

const initial: AuthState = {
  id:              null,
  accessToken:     null,
  refreshToken:    null,
  email:           null,
  user:            null,
  role:            "",
  isAuthenticated: false,
};

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      ...initial,

      setTokens: (pair) => {
        const decoded = decodeJWT(pair.accessToken);
        set({
          id:              decoded?.Id ?? null,
          accessToken:     pair.accessToken,
          refreshToken:    pair.refreshToken,
          isAuthenticated: true,
          role:            decoded?.Role ?? "",
        });
      },
        
      setUser: (user) =>
        set({
          user,
          role: user.role as Role,
        }),

      setRole: (role) =>
        set((state) => ({
          role,
          user: state.user ? { ...state.user, role } : null,
        })),

      clear: () => set(initial),
    }),
    {
      name: "auth",
      partialize: (state) => ({
        accessToken:     state.accessToken,
        refreshToken:    state.refreshToken,
        role:            state.role,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

export const selectIsAdmin   = (s: AuthState) => s.role === "admin";
export const selectIsTeacher = (s: AuthState) => s.role === "teacher";
export const selectIsStudent = (s: AuthState) => s.role === "student";

interface JwtPayload {
  Id: string;
  Role: Role;
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
        .join("")
    );

    const payload = JSON.parse(json) as JwtPayload;
    return payload;
  } catch {
    return null;
  }
}
