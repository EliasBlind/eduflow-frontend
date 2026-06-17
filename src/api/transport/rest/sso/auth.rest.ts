/**
 * REST-клиент для сервиса Auth (sso.proto)
 */

import { http } from "../_client";
import type {
  RegisterRequest,
  RegisterResponse,
  VerifyRequest,
  TokenPair,
  LoginRequest,
  LogoutRequest,
  LogoutResponse,
  RefreshRequest,
  ListUsersResponse,
  SetRoleRequest,
  User,
} from "../../../gen/sso/sso";

/** POST /v1/auth/register */
export function register(req: RegisterRequest): Promise<RegisterResponse> {
  return http.post("/v1/auth/register", req);
}

/** POST /v1/auth/verify */
export function verifyEmail(req: VerifyRequest): Promise<TokenPair> {
  return http.post("/v1/auth/verify", req);
}

/** POST /v1/auth/login */
export function login(req: LoginRequest): Promise<TokenPair> {
  return http.post("/v1/auth/login", req);
}

/** POST /v1/auth/logout */
export function logout(req: LogoutRequest): Promise<LogoutResponse> {
  return http.post("/v1/auth/logout", req);
}

/** POST /v1/auth/refresh */
export function refreshToken(req: RefreshRequest): Promise<TokenPair> {
  return http.post("/v1/auth/refresh", req);
}

// ── Admin-only ────────────────────────────────────────────────

/** GET /v1/users */
export function listUsers(): Promise<ListUsersResponse> {
  return http.get("/v1/users");
}

/** POST /v1/users/{user_id}/role */
export function setRole(req: SetRoleRequest): Promise<void> {
  const { userId, ...body } = req;
  return http.post(`/v1/users/${userId}/role`, body);
}

/** POST /v1/create_users */
export function createUsers(req: User[]): Promise<void> {
  return http.post("/v1/create_users", {users: req});
}
