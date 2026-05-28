/**
 * gRPC-клиент для сервиса Auth (sso.proto)
 */

import { rpc } from "../_client";
import { AuthClientImpl } from "../../../gen/sso/sso";
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

const client = new AuthClientImpl(rpc);

/** Регистрация. После — нужна верификация почты. */
export async function register(req: RegisterRequest): Promise<RegisterResponse> {
  return client.Register(req);
}

/** Верификация почты (2FA). Возвращает пару токенов. */
export async function verifyEmail(req: VerifyRequest): Promise<TokenPair> {
  return client.VerifyEmail(req);
}

/** Логин. Возвращает access_token + refresh_token. */
export async function login(req: LoginRequest): Promise<TokenPair> {
  return client.Login(req);
}

/** Логаут. Инвалидирует refresh_token. */
export async function logout(req: LogoutRequest): Promise<LogoutResponse> {
  return client.Logout(req);
}

/** Обновление пары токенов по refresh_token. */
export async function refreshToken(req: RefreshRequest): Promise<TokenPair> {
  return client.RefreshToken(req);
}

// ── Admin-only ────────────────────────────────────────────────

/** Список всех пользователей. Требует роль admin в JWT. */
export async function listUsers(req: ListUsersRequest): Promise<ListUsersResponse> {
  return client.ListUsers(req);
}

/** Назначить роль пользователю. Требует роль admin в JWT. */
export async function setRole(req: SetRoleRequest): Promise<Empty> {
  return client.SetRole(req);
}

/** Создать студента напрямую (без регистрации). Требует роль admin в JWT. */
export async function createStudent(req: User): Promise<Empty> {
  return client.CreateStudent(req);
}
