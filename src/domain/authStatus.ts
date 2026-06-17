
export const AuthStatus = {
  Pending: "pending",
  Authenticated: "authenticated",
  Unauthenticated: "unauthenticated",
} as const;

export type TAuthStatus = typeof AuthStatus[keyof typeof AuthStatus];
