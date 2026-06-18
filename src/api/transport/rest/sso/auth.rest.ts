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
  ListUsersRequest,
  ListUsersResponse,
  SetRoleRequest,
  User,
} from "../../../gen/sso/sso";
import type { Empty } from "../../../gen/sso/google/protobuf/empty";

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
// req нужен только для совпадения сигнатуры с gRPC-транспортом; у GET тела/параметров нет.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function listUsers(_req: ListUsersRequest = {}): Promise<ListUsersResponse> {
  return http.get("/v1/users");
}

/** POST /v1/users/{user_id}/role */
export function setRole(req: SetRoleRequest): Promise<Empty> {
  const { userId, ...body } = req;
  return http.post(`/v1/users/${userId}/role`, body);
}

/** POST /v1/create_users */
export function createUsers(req: User[]): Promise<Empty> {
  return http.post("/v1/create_users", { users: req });
}
